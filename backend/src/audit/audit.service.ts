import { Injectable, Logger } from '@nestjs/common';
import { AuditAction, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

interface AuditEntry {
  action: AuditAction;
  entity: string;
  entityId?: string;
  before?: unknown;
  after?: unknown;
  userId?: string;
  ip?: string;
  userAgent?: string;
}

@Injectable()
export class AuditService {
  private readonly logger = new Logger(AuditService.name);
  constructor(private prisma: PrismaService) {}

  /** Grava de forma assíncrona; falha de auditoria nunca derruba a requisição. */
  log(entry: AuditEntry): void {
    this.prisma.auditLog
      .create({
        data: {
          action: entry.action,
          entity: entry.entity,
          entityId: entry.entityId,
          before: (entry.before ?? undefined) as Prisma.InputJsonValue,
          after: (entry.after ?? undefined) as Prisma.InputJsonValue,
          userId: entry.userId,
          ip: entry.ip,
          userAgent: entry.userAgent,
        },
      })
      .catch((err) => this.logger.error({ err }, 'Falha ao gravar auditoria'));
  }
}
