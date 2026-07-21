import { Injectable } from '@nestjs/common';
import PDFDocument = require('pdfkit');

const STATUS_LABEL: Record<string, string> = {
  ABERTO: 'Aberto', EM_ANDAMENTO: 'Em andamento', PENDENTE: 'Pendente',
  CONCLUIDO: 'Concluído', ARQUIVADO: 'Arquivado', CANCELADO: 'Cancelado',
};

@Injectable()
export class PdfService {
  /** Comprovante oficial de abertura de protocolo. */
  buildReceipt(protocol: any): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({ size: 'A4', margin: 50 });
      const chunks: Buffer[] = [];
      doc.on('data', (c) => chunks.push(c));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      // Cabeçalho institucional
      doc.fontSize(14).font('Helvetica-Bold')
        .text('PREFEITURA MUNICIPAL DE LARANJAL DO JARI', { align: 'center' });
      doc.fontSize(10).font('Helvetica')
        .text('Estado do Amapá — Protocolo Geral', { align: 'center' });
      doc.moveDown(0.5);
      doc.moveTo(50, doc.y).lineTo(545, doc.y).stroke();
      doc.moveDown();

      doc.fontSize(16).font('Helvetica-Bold')
        .text('COMPROVANTE DE PROTOCOLO', { align: 'center' });
      doc.moveDown();

      doc.fontSize(22).font('Helvetica-Bold')
        .text(`Nº ${protocol.number}`, { align: 'center' });
      doc.moveDown(1.5);

      const line = (label: string, value: string) => {
        doc.fontSize(10).font('Helvetica-Bold').text(label, { continued: true })
          .font('Helvetica').text(` ${value}`);
        doc.moveDown(0.4);
      };

      line('Data/hora de abertura:', new Date(protocol.createdAt).toLocaleString('pt-BR'));
      line('Situação:', STATUS_LABEL[protocol.status] ?? protocol.status);
      line('Assunto:', protocol.subject?.name ?? '-');
      line('Setor de destino:', `${protocol.currentDepartment?.name} (${protocol.currentDepartment?.acronym})`);
      line('Requerente:', protocol.applicant?.name ?? '-');
      line('CPF/CNPJ:', protocol.applicant?.document ?? '-');
      doc.moveDown(0.4);
      doc.font('Helvetica-Bold').text('Descrição da solicitação:');
      doc.font('Helvetica').text(protocol.description, { align: 'justify' });
      doc.moveDown(1.5);

      doc.fontSize(9).fillColor('#444444')
        .text('Acompanhe o andamento em: consulta pública do Sistema de Protocolo, informando o número acima.', { align: 'center' })
        .text(`Documento gerado eletronicamente em ${new Date().toLocaleString('pt-BR')}. Dispensa assinatura.`, { align: 'center' });

      doc.end();
    });
  }
}
