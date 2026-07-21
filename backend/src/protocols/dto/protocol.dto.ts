import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { MovementType, Priority, ProtocolStatus } from '@prisma/client';
import { IsEnum, IsNotEmpty, IsOptional, IsString, Length } from 'class-validator';

export class CreateProtocolDto {
  @ApiProperty({ description: 'Descrição/objeto da solicitação' })
  @IsString() @IsNotEmpty()
  description: string;

  @ApiProperty() @IsString() subjectId: string;

  @ApiProperty({ description: 'Setor de destino inicial' })
  @IsString()
  departmentId: string;

  @ApiPropertyOptional({ enum: Priority, default: Priority.NORMAL })
  @IsOptional() @IsEnum(Priority)
  priority?: Priority;

  // Dados do requerente (upsert por documento)
  @ApiProperty() @IsString() applicantName: string;
  @ApiProperty({ description: 'CPF/CNPJ somente dígitos' }) @IsString() @Length(11, 14) applicantDocument: string;
  @ApiPropertyOptional() @IsOptional() @IsString() applicantEmail?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() applicantPhone?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() applicantAddress?: string;
}

export class ForwardProtocolDto {
  @ApiProperty({ description: 'Setor de destino' }) @IsString() toDepartmentId: string;
  @ApiPropertyOptional({ description: 'Despacho/observação' }) @IsOptional() @IsString() note?: string;
}

export class DispatchDto {
  @ApiProperty({ enum: MovementType }) @IsEnum(MovementType) type: MovementType;
  @ApiPropertyOptional() @IsOptional() @IsString() note?: string;
}

export class QueryProtocolsDto {
  @ApiPropertyOptional({ enum: ProtocolStatus }) @IsOptional() @IsEnum(ProtocolStatus) status?: ProtocolStatus;
  @ApiPropertyOptional() @IsOptional() @IsString() departmentId?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() search?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() page?: string;
}
