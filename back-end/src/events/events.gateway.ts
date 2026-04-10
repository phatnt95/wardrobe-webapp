import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { Injectable, Logger, UseGuards } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
@Injectable()
export class EventsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;
  private readonly logger = new Logger(EventsGateway.name);

  constructor(private jwtService: JwtService) { }

  async handleConnection(client: Socket) {
    try {
      const authHeader = client.handshake.headers.authorization;
      if (authHeader) {
        const token = authHeader.split(' ')[1];
        const payload = this.jwtService.verify(token);
        if (payload && payload.sub) {
          client.join(payload.sub); // join user ID room
          this.logger.log(`Client connected: ${client.id} to room ${payload.sub}`);
        }
      }
    } catch (err) {
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
  }

  notifyUser(userId: string, eventName: string, data: any) {
    this.server.to(userId).emit(eventName, data);
    this.logger.log(`Notified user: ${userId} with event: ${eventName}`);
  }
}
