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
    if (!origin || allowedOrigins.has(origin) || isLocalDevelopmentOrigin(origin)) {
      callback(null, true);
      return;
    }

    callback(new Error(`Socket CORS blocked for origin ${origin}`));
  };
}

function isLocalDevelopmentOrigin(origin: string) {
  try {
    const parsedOrigin = new URL(origin);
    const hostname = parsedOrigin.hostname;
    const port = Number(parsedOrigin.port);
    const isLocalhost = hostname === 'localhost' || hostname === '127.0.0.1';
    const isPrivateIpv4 =
      /^10\./.test(hostname) ||
      /^192\.168\./.test(hostname) ||
      /^172\.(1[6-9]|2\d|3[0-1])\./.test(hostname);

    const isVitePort = port >= 5173 && port <= 5179;
    return parsedOrigin.protocol === 'http:' && isVitePort && (isLocalhost || isPrivateIpv4);
  } catch {
    return false;
  }
}

type AuthenticatedSocketData = {
  user: JwtPayload;
};

type RecordCreatedEvent = {
  deletedAt?: Date | null;
  createdBy?: {
    id?: string;
  };
  delegation?: {
    region?: {
      id?: string;
    };
  };
};

const REALTIME_DEBUG_ENABLED = process.env.REALTIME_DEBUG === 'true';

function realtimeDebugLog(event: string, payload?: Record<string, unknown>) {
  if (!REALTIME_DEBUG_ENABLED) {
    return;
  }

  if (payload) {
    console.info(`[realtime] ${event}`, payload);
    return;
  }

  console.info(`[realtime] ${event}`);
}

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
        realtimeDebugLog('auth_ok', {
          socketId: socket.id,
          userId: user.sub,
          role: user.role,
        });
        next();
      } catch (error) {
        realtimeDebugLog('auth_error', {
          socketId: socket.id,
          message: error instanceof Error ? error.message : 'Unknown socket auth error',
        });
        next(new UnauthorizedException('Unauthorized socket connection.'));
      }
    });
  }

  handleConnection(socket: Socket) {
    const user = (socket.data as AuthenticatedSocketData).user;

    socket.join(userRoom(user.sub));

    if (user.role === Role.DirectorOperativo && user.regionId) {
      socket.join(regionRoom(user.regionId));
    }

    if (this.canAccessAuditChannel(user.role)) {
      socket.join('role:coordinacion');
    }

    if (this.canAccessOversightRecordsChannel(user.role)) {
      socket.join('records:oversight');
    }

    realtimeDebugLog('connected', {
      socketId: socket.id,
      userId: user.sub,
      role: user.role,
      rooms: Array.from(socket.rooms),
    });
  }

  handleDisconnect(socket: Socket) {
    const user = (socket.data as AuthenticatedSocketData).user;

    realtimeDebugLog('disconnected', {
      socketId: socket.id,
      userId: user?.sub,
      role: user?.role,
    });
  }

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

  emitRecordChanged(payload: RecordCreatedEvent) {
    const creatorId = payload.createdBy?.id;
    const recordRegionId = payload.delegation?.region?.id;

    if (creatorId) {
      this.server.to(userRoom(creatorId)).emit('records.changed', payload);
    }

    if (recordRegionId) {
      this.server.to(regionRoom(recordRegionId)).emit('records.changed', payload);
    }

    this.server.to('records:oversight').emit('records.changed', payload);
  }

  emitAuditCreated(payload: unknown) {
    this.server.to('role:coordinacion').emit('audit.created', payload);
  }

  emitRosterReportSubmitted(payload: unknown) {
    this.server.to('records:oversight').emit('reports.submitted', payload);
  }

  emitMessageSent(payload: unknown, recipientIds: string[]) {
    realtimeDebugLog('emit_messages_new', {
      recipientIds,
    });

    for (const recipientId of recipientIds) {
      this.server.to(userRoom(recipientId)).emit('messages:new', payload);
    }
  }

  emitMessageRead(payload: unknown, recipientIds: string[]) {
    for (const recipientId of recipientIds) {
      this.server.to(userRoom(recipientId)).emit('messages:read', payload);
    }
  }

  emitConversationCreated(payload: { participants?: { id: string }[] }) {
    const participantIds =
      payload.participants?.map((p) => p.id).filter(Boolean) ?? [];

    for (const participantId of participantIds) {
      this.server.to(userRoom(participantId)).emit('conversations:updated', payload);
    }
  }

  emitConversationRead(conversationId: string, participantIds: string[]) {
    const otherParticipantIds = participantIds;
    for (const participantId of otherParticipantIds) {
      this.server.to(userRoom(participantId)).emit('conversations:read', { conversationId });
    }
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
    return [Role.PlantillaVehicular, Role.DirectorGeneral, Role.SuperAdmin, Role.Coordinacion, Role.DirectorOperativo].includes(role);
  }

  private canAccessAuditChannel(role: Role) {
    return role === Role.Coordinacion;
  }
}
