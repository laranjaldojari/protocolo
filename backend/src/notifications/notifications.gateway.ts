import { Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import {
  OnGatewayConnection, WebSocketGateway, WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

interface Notification {
  title: string;
  message: string;
  protocolId?: string;
}

@WebSocketGateway({ cors: { origin: process.env.FRONTEND_URL }, namespace: '/notifications' })
export class NotificationsGateway implements OnGatewayConnection {
  @WebSocketServer() server: Server;
  private readonly logger = new Logger(NotificationsGateway.name);

  constructor(private jwt: JwtService) {}

  handleConnection(client: Socket) {
    try {
      const token = client.handshake.auth?.token as string;
      const payload = this.jwt.verify(token, { secret: process.env.JWT_ACCESS_SECRET });
      client.join(`user:${payload.sub}`);
      if (payload.departmentId) client.join(`dept:${payload.departmentId}`);
    } catch {
      client.disconnect(true);
    }
  }

  notifyDepartment(departmentId: string, payload: Notification) {
    this.server.to(`dept:${departmentId}`).emit('notification', { ...payload, at: new Date().toISOString() });
  }

  notifyUser(userId: string, payload: Notification) {
    this.server.to(`user:${userId}`).emit('notification', { ...payload, at: new Date().toISOString() });
  }
}
