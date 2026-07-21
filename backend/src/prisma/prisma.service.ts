import { INestApplication, Injectable, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

/** Modelos com soft delete: findMany/findFirst filtram deletedAt automaticamente. */
const SOFT_DELETE_MODELS = [
  'User', 'Department', 'Subject', 'Applicant', 'Protocol',
  'ProtocolMovement', 'Attachment', 'RefreshToken',
];

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
  constructor() {
    super();
    this.$use(async (params, next) => {
      if (params.model && SOFT_DELETE_MODELS.includes(params.model)) {
        // delete → soft delete
        if (params.action === 'delete') {
          params.action = 'update';
          params.args.data = { deletedAt: new Date() };
        }
        if (params.action === 'deleteMany') {
          params.action = 'updateMany';
          params.args.data = { ...(params.args.data ?? {}), deletedAt: new Date() };
        }
        // leituras → ignora registros excluídos (a menos que explicitamente pedido)
        if (['findMany', 'findFirst', 'count'].includes(params.action)) {
          params.args = params.args ?? {};
          params.args.where = params.args.where ?? {};
          if (params.args.where.deletedAt === undefined) {
            params.args.where.deletedAt = null;
          }
        }
      }
      return next(params);
    });
  }

  async onModuleInit() {
    await this.$connect();
  }

  async enableShutdownHooks(app: INestApplication) {
    process.on('beforeExit', async () => { await app.close(); });
  }
}
