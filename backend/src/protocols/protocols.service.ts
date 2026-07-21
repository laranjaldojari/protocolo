import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { MovementType, Prisma, ProtocolStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsGateway } from '../notifications/notifications.gateway';
import { JwtUser } from '../common/decorators/current-user.decorator';
import { CreateProtocolDto, DispatchDto, ForwardProtocolDto, QueryProtocolsDto } from './dto/protocol.dto';

const STATUS_BY_MOVEMENT: Partial<Record<MovementType, ProtocolStatus>> = {
  ENCAMINHAMENTO: 'EM_ANDAMENTO',
  DESPACHO: 'EM_ANDAMENTO',
  PENDENCIA: 'PENDENTE',
  CONCLUSAO: 'CONCLUIDO',
  ARQUIVAMENTO: 'ARQUIVADO',
  CANCELAMENTO: 'CANCELADO',
  REABERTURA: 'EM_ANDAMENTO',
};

const fullInclude = {
  subject: true,
  applicant: true,
  currentDepartment: true,
  createdBy: { select: { id: true, name: true } },
  attachments: { where: { deletedAt: null } },
  movements: {
    where: { deletedAt: null },
    orderBy: { createdAt: 'asc' as const },
    include: {
      fromDepartment: true,
      toDepartment: true,
      sentBy: { select: { id: true, name: true } },
      receivedBy: { select: { id: true, name: true } },
    },
  },
} satisfies Prisma.ProtocolInclude;

@Injectable()
export class ProtocolsService {
  constructor(
    private prisma: PrismaService,
    private gateway: NotificationsGateway,
    @InjectQueue('pdf') private pdfQueue: Queue,
  ) {}

  /** Numeração sequencial anual atômica: 000042/2026 */
  private async nextNumber(tx: Prisma.TransactionClient) {
    const year = new Date().getFullYear();
    const counter = await tx.protocolCounter.upsert({
      where: { year },
      create: { year, value: 1 },
      update: { value: { increment: 1 } },
    });
    return { year, sequence: counter.value, number: `${String(counter.value).padStart(6, '0')}/${year}` };
  }

  async create(dto: CreateProtocolDto, user: JwtUser) {
    const protocol = await this.prisma.$transaction(async (tx) => {
      const { year, sequence, number } = await this.nextNumber(tx);

      const applicant = await tx.applicant.upsert({
        where: { document: dto.applicantDocument },
        create: {
          name: dto.applicantName,
          document: dto.applicantDocument,
          email: dto.applicantEmail,
          phone: dto.applicantPhone,
          address: dto.applicantAddress,
        },
        update: {
          name: dto.applicantName,
          email: dto.applicantEmail ?? undefined,
          phone: dto.applicantPhone ?? undefined,
          address: dto.applicantAddress ?? undefined,
        },
      });

      const created = await tx.protocol.create({
        data: {
          number, year, sequence,
          description: dto.description,
          priority: dto.priority ?? 'NORMAL',
          subjectId: dto.subjectId,
          applicantId: applicant.id,
          createdById: user.sub,
          currentDepartmentId: dto.departmentId,
          movements: {
            create: {
              type: 'ABERTURA',
              toDepartmentId: dto.departmentId,
              sentById: user.sub,
              note: 'Abertura de protocolo',
            },
          },
        },
        include: fullInclude,
      });
      return created;
    });

    // fila: geração do comprovante em PDF
    await this.pdfQueue.add('receipt', { protocolId: protocol.id });
    // tempo real: notifica o setor de destino
    this.gateway.notifyDepartment(dto.departmentId, {
      title: 'Novo protocolo recebido',
      message: `Protocolo ${protocol.number} — ${protocol.subject.name}`,
      protocolId: protocol.id,
    });

    return protocol;
  }

  async findAll(query: QueryProtocolsDto, user: JwtUser) {
    const take = 20;
    const page = Math.max(1, Number(query.page ?? 1));
    const where: Prisma.ProtocolWhereInput = {
      status: query.status,
      currentDepartmentId: query.departmentId,
      ...(query.search
        ? {
            OR: [
              { number: { contains: query.search } },
              { description: { contains: query.search, mode: 'insensitive' } },
              { applicant: { name: { contains: query.search, mode: 'insensitive' } } },
              { applicant: { document: { contains: query.search } } },
            ],
          }
        : {}),
      // SERVIDOR/GESTOR enxergam por padrão o próprio setor
      ...(user.role === 'SERVIDOR' && !query.departmentId && user.departmentId
        ? { currentDepartmentId: user.departmentId }
        : {}),
    };

    const [items, total] = await this.prisma.$transaction([
      this.prisma.protocol.findMany({
        where,
        include: { subject: true, applicant: true, currentDepartment: true },
        orderBy: { createdAt: 'desc' },
        take,
        skip: (page - 1) * take,
      }),
      this.prisma.protocol.count({ where }),
    ]);
    return { items, total, page, pages: Math.ceil(total / take) };
  }

  async findOne(id: string) {
    const protocol = await this.prisma.protocol.findFirst({ where: { id }, include: fullInclude });
    if (!protocol) throw new NotFoundException('Protocolo não encontrado.');
    return protocol;
  }

  /** Consulta pública (sem login) pelo número. */
  async publicLookup(number: string) {
    const protocol = await this.prisma.protocol.findFirst({
      where: { number },
      select: {
        number: true, status: true, createdAt: true, concludedAt: true,
        subject: { select: { name: true } },
        currentDepartment: { select: { name: true, acronym: true } },
        movements: {
          where: { deletedAt: null },
          orderBy: { createdAt: 'asc' },
          select: {
            type: true, createdAt: true,
            fromDepartment: { select: { acronym: true } },
            toDepartment: { select: { acronym: true } },
          },
        },
      },
    });
    if (!protocol) throw new NotFoundException('Protocolo não encontrado. Confira o número informado.');
    return protocol;
  }

  async forward(id: string, dto: ForwardProtocolDto, user: JwtUser) {
    const protocol = await this.findOne(id);
    if (['CONCLUIDO', 'ARQUIVADO', 'CANCELADO'].includes(protocol.status)) {
      throw new BadRequestException('Protocolo encerrado não pode ser encaminhado. Registre uma reabertura.');
    }
    const updated = await this.prisma.protocol.update({
      where: { id },
      data: {
        status: 'EM_ANDAMENTO',
        currentDepartmentId: dto.toDepartmentId,
        movements: {
          create: {
            type: 'ENCAMINHAMENTO',
            note: dto.note,
            fromDepartmentId: protocol.currentDepartmentId,
            toDepartmentId: dto.toDepartmentId,
            sentById: user.sub,
          },
        },
      },
      include: fullInclude,
    });
    this.gateway.notifyDepartment(dto.toDepartmentId, {
      title: 'Protocolo encaminhado ao seu setor',
      message: `Protocolo ${updated.number}`,
      protocolId: updated.id,
    });
    return updated;
  }

  async dispatch(id: string, dto: DispatchDto, user: JwtUser) {
    const protocol = await this.findOne(id);
    if (dto.type === 'ABERTURA' || dto.type === 'ENCAMINHAMENTO') {
      throw new BadRequestException('Use as rotas específicas de abertura e encaminhamento.');
    }
    const status = STATUS_BY_MOVEMENT[dto.type];
    return this.prisma.protocol.update({
      where: { id },
      data: {
        ...(status ? { status } : {}),
        ...(dto.type === 'CONCLUSAO' ? { concludedAt: new Date() } : {}),
        movements: {
          create: {
            type: dto.type,
            note: dto.note,
            fromDepartmentId: protocol.currentDepartmentId,
            sentById: user.sub,
          },
        },
      },
      include: fullInclude,
    });
  }

  async stats(user: JwtUser) {
    const whereDept = user.role === 'SERVIDOR' && user.departmentId
      ? { currentDepartmentId: user.departmentId } : {};
    const [abertos, andamento, pendentes, concluidos, total] = await this.prisma.$transaction([
      this.prisma.protocol.count({ where: { ...whereDept, status: 'ABERTO' } }),
      this.prisma.protocol.count({ where: { ...whereDept, status: 'EM_ANDAMENTO' } }),
      this.prisma.protocol.count({ where: { ...whereDept, status: 'PENDENTE' } }),
      this.prisma.protocol.count({ where: { ...whereDept, status: 'CONCLUIDO' } }),
      this.prisma.protocol.count({ where: whereDept }),
    ]);
    return { abertos, andamento, pendentes, concluidos, total };
  }

  listSubjects() {
    return this.prisma.subject.findMany({ where: { active: true }, orderBy: { name: 'asc' } });
  }
}
