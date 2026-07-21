import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AttachmentsService {
  constructor(private prisma: PrismaService) {}

  create(protocolId: string, file: Express.Multer.File, userId: string) {
    return this.prisma.attachment.create({
      data: {
        protocolId,
        originalName: file.originalname,
        storedName: file.filename,
        mimeType: file.mimetype,
        sizeBytes: file.size,
        path: file.path,
        uploadedById: userId,
      },
    });
  }

  async findOne(id: string) {
    const att = await this.prisma.attachment.findFirst({ where: { id } });
    if (!att) throw new NotFoundException('Anexo não encontrado.');
    return att;
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.attachment.delete({ where: { id } });
  }
}
