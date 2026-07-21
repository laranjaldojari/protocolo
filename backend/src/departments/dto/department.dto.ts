import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { IsBoolean, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateDepartmentDto {
  @ApiProperty({ example: 'Secretaria Municipal de Cultura' }) @IsString() name: string;
  @ApiProperty({ example: 'SEMCU' }) @IsString() @MaxLength(10) acronym: string;
}

export class UpdateDepartmentDto extends PartialType(CreateDepartmentDto) {
  @ApiPropertyOptional() @IsOptional() @IsBoolean() active?: boolean;
}
