import {
  BadRequestException, Controller, Delete, Get, Param, Post, Res,
  UploadedFile, UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiBody, ApiConsumes, ApiTags } from '@nestjs/swagger';
import { Response } from 'express';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import { randomBytes } from 'crypto';
import { CurrentUser, JwtUser } from '../common/decorators/current-user.decorator';
import { AttachmentsService } from './attachments.service';

const ALLOWED = ['application/pdf', 'image/png', 'image/jpeg',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];

@ApiTags('Anexos')
@ApiBearerAuth()
@Controller('protocolos/:protocolId/anexos')
export class AttachmentsController {
  constructor(private service: AttachmentsService) {}

  @Post()
  @ApiConsumes('multipart/form-data')
  @ApiBody({ schema: { type: 'object', properties: { file: { type: 'string', format: 'binary' } } } })
  @UseInterceptors(FileInterceptor('file', {
    storage: diskStorage({
      destination: process.env.UPLOAD_DIR ?? './uploads',
      filename: (_req, file, cb) =>
        cb(null, `${Date.now()}-${randomBytes(6).toString('hex')}${extname(file.originalname)}`),
    }),
    limits: { fileSize: 15 * 1024 * 1024 }, // 15 MB
    fileFilter: (_req, file, cb) =>
      ALLOWED.includes(file.mimetype)
        ? cb(null, true)
        : cb(new BadRequestException('Tipo de arquivo não permitido. Envie PDF, imagem (PNG/JPG) ou DOC/DOCX.'), false),
  }))
  upload(
    @Param('protocolId') protocolId: string,
    @UploadedFile() file: Express.Multer.File,
    @CurrentUser() user: JwtUser,
  ) {
    if (!file) throw new BadRequestException('Nenhum arquivo enviado.');
    return this.service.create(protocolId, file, user.sub);
  }

  @Get(':id/download')
  async download(@Param('id') id: string, @Res() res: Response) {
    const att = await this.service.findOne(id);
    res.download(join(att.path), att.originalName);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}
