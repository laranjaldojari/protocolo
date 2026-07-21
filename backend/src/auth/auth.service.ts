import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as argon2 from 'argon2';
import { createHash, randomBytes } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwt: JwtService,
    private audit: AuditService,
  ) {}

  private sha256(v: string) {
    return createHash('sha256').update(v).digest('hex');
  }

  private async issueTokens(user: { id: string; email: string; role: string; departmentId: string | null; name: string }, meta?: { ip?: string; userAgent?: string }) {
    const payload = { sub: user.id, email: user.email, role: user.role, departmentId: user.departmentId, name: user.name };
    const accessToken = await this.jwt.signAsync(payload, {
      secret: process.env.JWT_ACCESS_SECRET,
      expiresIn: process.env.JWT_ACCESS_TTL ?? '15m',
    });
    const raw = randomBytes(48).toString('hex');
    const days = 7;
    await this.prisma.refreshToken.create({
      data: {
        tokenHash: this.sha256(raw),
        userId: user.id,
        expiresAt: new Date(Date.now() + days * 24 * 60 * 60 * 1000),
        ip: meta?.ip,
        userAgent: meta?.userAgent,
      },
    });
    return { accessToken, refreshToken: raw };
  }

  async login(email: string, password: string, meta?: { ip?: string; userAgent?: string }) {
    const user = await this.prisma.user.findFirst({ where: { email, active: true } });
    if (!user || !(await argon2.verify(user.passwordHash, password))) {
      throw new UnauthorizedException('Credenciais inválidas.');
    }
    this.audit.log({ action: 'LOGIN', entity: 'auth', userId: user.id, ip: meta?.ip, userAgent: meta?.userAgent });
    const tokens = await this.issueTokens(user, meta);
    return {
      ...tokens,
      user: { id: user.id, name: user.name, email: user.email, role: user.role, departmentId: user.departmentId },
    };
  }

  async refresh(raw: string, meta?: { ip?: string; userAgent?: string }) {
    const stored = await this.prisma.refreshToken.findFirst({
      where: { tokenHash: this.sha256(raw), revokedAt: null, expiresAt: { gt: new Date() } },
      include: { user: true },
    });
    if (!stored || !stored.user.active) throw new UnauthorizedException('Refresh token inválido ou expirado.');

    // rotação: revoga o token usado e emite um novo par
    await this.prisma.refreshToken.update({ where: { id: stored.id }, data: { revokedAt: new Date() } });
    const tokens = await this.issueTokens(stored.user, meta);
    return {
      ...tokens,
      user: {
        id: stored.user.id, name: stored.user.name, email: stored.user.email,
        role: stored.user.role, departmentId: stored.user.departmentId,
      },
    };
  }

  async logout(raw: string, userId?: string) {
    await this.prisma.refreshToken.updateMany({
      where: { tokenHash: this.sha256(raw), revokedAt: null },
      data: { revokedAt: new Date() },
    });
    this.audit.log({ action: 'LOGOUT', entity: 'auth', userId });
    return { ok: true };
  }
}
