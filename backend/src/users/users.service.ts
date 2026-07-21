import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import * as argon2 from 'argon2';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUserDto, UpdateUserDto } from './dto/user.dto';

const select = {
  id: true, name: true, email: true, cpf: true, role: true, active: true,
  department: { select: { id: true, name: true, acronym: true } },
  createdAt: true, updatedAt: true,
};

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateUserDto) {
    const exists = await this.prisma.user.findFirst({ where: { email: dto.email } });
    if (exists) throw new ConflictException('E-mail já cadastrado.');
    const { password, ...rest } = dto;
    return this.prisma.user.create({
      data: { ...rest, passwordHash: await argon2.hash(password) },
      select,
    });
  }

  findAll() {
    return this.prisma.user.findMany({ select, orderBy: { name: 'asc' } });
  }

  async findOne(id: string) {
    const user = await this.prisma.user.findFirst({ where: { id }, select });
    if (!user) throw new NotFoundException('Usuário não encontrado.');
    return user;
  }

  async update(id: string, dto: UpdateUserDto) {
    await this.findOne(id);
    const { password, ...rest } = dto;
    return this.prisma.user.update({
      where: { id },
      data: { ...rest, ...(password ? { passwordHash: await argon2.hash(password) } : {}) },
      select,
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.user.delete({ where: { id } }); // vira soft delete no middleware
  }
}
