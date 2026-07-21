import { Body, Controller, Get, Param, Patch, Post, Query, Res } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Response } from 'express';
import { CurrentUser, JwtUser } from '../common/decorators/current-user.decorator';
import { Public } from '../common/decorators/public.decorator';
import { PdfService } from '../pdf/pdf.service';
import { CreateProtocolDto, DispatchDto, ForwardProtocolDto, QueryProtocolsDto } from './dto/protocol.dto';
import { ProtocolsService } from './protocols.service';

@ApiTags('Protocolos')
@Controller('protocolos')
export class ProtocolsController {
  constructor(private service: ProtocolsService, private pdf: PdfService) {}

  @Post()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Abrir novo protocolo' })
  create(@Body() dto: CreateProtocolDto, @CurrentUser() user: JwtUser) {
    return this.service.create(dto, user);
  }

  @Get()
  @ApiBearerAuth()
  findAll(@Query() query: QueryProtocolsDto, @CurrentUser() user: JwtUser) {
    return this.service.findAll(query, user);
  }

  @Get('estatisticas')
  @ApiBearerAuth()
  stats(@CurrentUser() user: JwtUser) {
    return this.service.stats(user);
  }

  @Get('assuntos')
  @ApiBearerAuth()
  subjects() {
    return this.service.listSubjects();
  }

  @Public()
  @Get('consulta-publica')
  @ApiOperation({ summary: 'Consulta pública por número (ex.: 000042/2026) — sem autenticação' })
  publicLookup(@Query('numero') numero: string) {
    return this.service.publicLookup(numero);
  }

  @Get(':id')
  @ApiBearerAuth()
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Get(':id/comprovante.pdf')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Baixar comprovante de protocolo em PDF' })
  async receipt(@Param('id') id: string, @Res() res: Response) {
    const protocol = await this.service.findOne(id);
    const buffer = await this.pdf.buildReceipt(protocol);
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `inline; filename="comprovante-${protocol.number.replace('/', '-')}.pdf"`,
    });
    res.send(buffer);
  }

  @Patch(':id/encaminhar')
  @ApiBearerAuth()
  forward(@Param('id') id: string, @Body() dto: ForwardProtocolDto, @CurrentUser() user: JwtUser) {
    return this.service.forward(id, dto, user);
  }

  @Patch(':id/despachar')
  @ApiBearerAuth()
  dispatch(@Param('id') id: string, @Body() dto: DispatchDto, @CurrentUser() user: JwtUser) {
    return this.service.dispatch(id, dto, user);
  }
}
