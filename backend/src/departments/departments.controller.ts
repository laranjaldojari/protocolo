import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { Roles } from '../common/decorators/roles.decorator';
import { CreateDepartmentDto, UpdateDepartmentDto } from './dto/department.dto';
import { DepartmentsService } from './departments.service';

@ApiTags('Setores')
@ApiBearerAuth()
@Controller('setores')
export class DepartmentsController {
  constructor(private service: DepartmentsService) {}

  @Post() @Roles(Role.ADMIN) create(@Body() dto: CreateDepartmentDto) { return this.service.create(dto); }
  @Get() findAll() { return this.service.findAll(); }
  @Get(':id') findOne(@Param('id') id: string) { return this.service.findOne(id); }
  @Patch(':id') @Roles(Role.ADMIN) update(@Param('id') id: string, @Body() dto: UpdateDepartmentDto) { return this.service.update(id, dto); }
  @Delete(':id') @Roles(Role.ADMIN) remove(@Param('id') id: string) { return this.service.remove(id); }
}
