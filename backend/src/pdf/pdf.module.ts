import { Module } from '@nestjs/common';
import { PdfProcessor } from './pdf.processor';
import { PdfService } from './pdf.service';

@Module({ providers: [PdfService, PdfProcessor], exports: [PdfService] })
export class PdfModule {}
