import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { mkdirSync, writeFileSync } from 'fs';
import { join } from 'path';
import { PrismaService } from '../prisma/prisma.service';
import { PdfService } from './pdf.service';

/** Worker BullMQ: gera e arquiva o comprovante em disco de forma assíncrona. */
@Processor('pdf')
export class PdfProcessor extends WorkerHost {
  private readonly logger = new Logger(PdfProcessor.name);

  constructor(private prisma: PrismaService, private pdf: PdfService) {
    super();
  }

  async process(job: Job<{ protocolId: string }>) {
    const protocol = await this.prisma.protocol.findFirst({
      where: { id: job.data.protocolId },
      include: { subject: true, applicant: true, currentDepartment: true },
    });
    if (!protocol) return;

    const buffer = await this.pdf.buildReceipt(protocol);
    const dir = join(process.env.UPLOAD_DIR ?? './uploads', 'comprovantes');
    mkdirSync(dir, { recursive: true });
    writeFileSync(join(dir, `${protocol.number.replace('/', '-')}.pdf`), buffer);
    this.logger.log(`Comprovante gerado para ${protocol.number}`);
  }
}
