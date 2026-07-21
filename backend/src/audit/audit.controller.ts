import { Controller, Get, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { Roles } from '../common/decorators/roles.decorator';
import { PrismaService } from '../prisma/prisma.service';

@ApiTags('Auditoria')
@ApiBearerAuth()
@Controller('auditoria')
export class AuditController {
  constructor(private prisma: PrismaService) {}

  @Get()
  @Roles(Role.ADMIN)
  findAll(@Query('page') page = '1', @Query('entity') entity?: string) {
    const take = 50;
    return this.prisma.auditLog.findMany({
      where: entity ? { entity } : undefined,
      include: { user: { select: { name: true, email: true } } },
      orderBy: { createdAt: 'desc' },
      take,
      skip: (Number(page) - 1) * take,
    });
  }
}
