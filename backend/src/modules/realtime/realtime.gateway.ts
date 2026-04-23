import {
  Injectable,
  OnModuleInit,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import {
  OnGatewayConnection,
  OnGatewayDisconnect,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, type Socket } from 'socket.io';
import { Role } from 'src/common/enums/role.enum';
import type { JwtPayload } from 'src/modules/auth/jwt-payload.type';

function resolveRealtimeOrigins() {
  const configuredOrigins = (process.env.FRONTEND_ORIGINS ?? process.env.FRONTEND_ORIGIN ?? '')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);

  const defaultOrigins = ['http://localhost:5173', 'http://127.0.0.1:5173'];
  const allowedOrigins = new Set([...defaultOrigins, ...configuredOrigins]);

  return (origin: string | undefined, callback: (error: Error | null, allow?: boolean) => void) => {
    if (!origin || allowedOrigins.has(origin)) {
      callback(null, true);
      return;
    }

    callback(new Error(`Socket CORS blocked for origin ${origin}`));
  };
}

type AuthenticatedSocketData = {
  user: JwtPayload;
};

type RecordCreatedEvent = {
  createdBy?: {
    id?: string;
  };
  delegation?: {
    region?: {
      id?: string;
    };
  };
};

function userRoom(userId: string) {
  return `user:${userId}`;
}

function regionRoom(regionId: string) {
  return `region:${regionId}`;
}

@WebSocketGateway({
  cors: {
    origin: resolveRealtimeOrigins(),
    credentials: true,
  },
})
@Injectable()
export class RealtimeGateway
  implements OnGatewayConnection, OnGatewayDisconnect, OnModuleInit
{
  constructor(private readonly jwtService: JwtService) {}

  @WebSocketServer()
  server!: Server;

  onModuleInit() {
    this.server.use((socket, next) => {
      try {
        const user = this.authenticateSocket(socket);
        (socket.data as AuthenticatedSocketData).user = user;
        next();
      } catch {
        next(new UnauthorizedException('Unauthorized socket connection.'));
      }
    });
  }

  handleConnection(socket: Socket) {
    const user = (socket.data as AuthenticatedSocketData).user;

    socket.join(userRoom(user.sub));

    if (user.role === Role.RegionalManager && user.regionId) {
      socket.join(regionRoom(user.regionId));
    }

    if (this.canAccessAuditChannel(user.role)) {
      socket.join('role:superadmin');
    }

    if (this.canAccessOversightRecordsChannel(user.role)) {
      socket.join('records:oversight');
    }
  }

  handleDisconnect() {}

  emitRecordCreated(payload: RecordCreatedEvent) {
    const creatorId = payload.createdBy?.id;
    const recordRegionId = payload.delegation?.region?.id;

    if (creatorId) {
      this.server.to(userRoom(creatorId)).emit('records.created', payload);
    }

    if (recordRegionId) {
      this.server.to(regionRoom(recordRegionId)).emit('records.created', payload);
    }

    this.server.to('records:oversight').emit('records.created', payload);
  }

  emitAuditCreated(payload: unknown) {
    this.server.to('role:superadmin').emit('audit.created', payload);
  }

  private authenticateSocket(socket: Socket) {
    const token = this.extractToken(socket);

    if (!token) {
      throw new UnauthorizedException('Missing socket token.');
    }

    return this.jwtService.verify<JwtPayload>(token);
  }

  private extractToken(socket: Socket) {
    const authToken = socket.handshake.auth?.token;

    if (typeof authToken === 'string' && authToken.trim().length > 0) {
      return authToken;
    }

    const authorizationHeader = socket.handshake.headers.authorization;

    if (typeof authorizationHeader === 'string' && authorizationHeader.startsWith('Bearer ')) {
      return authorizationHeader.slice(7).trim();
    }

    return null;
  }

  private canAccessOversightRecordsChannel(role: Role) {
    return [Role.Admin, Role.Director, Role.SuperAdmin].includes(role);
  }

  private canAccessAuditChannel(role: Role) {
    return role === Role.SuperAdmin;
  }
}
