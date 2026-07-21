import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { ProtocolsController } from './protocols.controller';
import { ProtocolsService } from './protocols.service';
import { NotificationsModule } from '../notifications/notifications.module';
import { PdfModule } from '../pdf/pdf.module';

@Module({
  imports: [BullModule.registerQueue({ name: 'pdf' }), NotificationsModule, PdfModule],
  controllers: [ProtocolsController],
  providers: [ProtocolsService],
})
export class ProtocolsModule {}
