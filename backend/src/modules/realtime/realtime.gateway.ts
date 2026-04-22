import {
  OnGatewayConnection,
  OnGatewayDisconnect,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server } from 'socket.io';

@WebSocketGateway({
  cors: {
    origin: process.env.FRONTEND_ORIGIN ?? 'http://localhost:5173',
    credentials: true,
  },
})
export class RealtimeGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server!: Server;

  handleConnection() {}

  handleDisconnect() {}

  emitRecordCreated(payload: unknown) {
    this.server.emit('records.created', payload);
  }

  emitAuditCreated(payload: unknown) {
    this.server.emit('audit.created', payload);
  }
}
