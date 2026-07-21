import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { Observable, tap } from 'rxjs';
import { AuditService } from '../../audit/audit.service';
import { AuditAction } from '@prisma/client';

const METHOD_ACTION: Record<string, AuditAction | undefined> = {
  POST: 'CREATE', PATCH: 'UPDATE', PUT: 'UPDATE', DELETE: 'DELETE',
};

/** Audita automaticamente toda mutação HTTP (quem, o quê, quando, payload, IP). */
@Injectable()
export class AuditInterceptor implements NestInterceptor {
  constructor(private audit: AuditService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const req = context.switchToHttp().getRequest();
    const action = METHOD_ACTION[req.method];
    if (!action || req.url.includes('/auth/')) return next.handle();

    return next.handle().pipe(
      tap((result) => {
        this.audit.log({
          action,
          entity: req.url.split('/')[3] ?? 'unknown',
          entityId: result?.id ?? req.params?.id,
          after: action === 'DELETE' ? undefined : result,
          before: undefined,
          userId: req.user?.sub,
          ip: req.ip,
          userAgent: req.headers['user-agent'],
        });
      }),
    );
  }
}
