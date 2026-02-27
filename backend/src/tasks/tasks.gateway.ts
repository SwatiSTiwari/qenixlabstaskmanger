import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { Task } from './schemas/task.schema';

export enum TaskEvent {
  CREATED = 'task.created',
  UPDATED = 'task.updated',
  DELETED = 'task.deleted',
}

@Injectable()
@WebSocketGateway({
  cors: {
    origin: [
      'http://localhost:3000',
      'http://localhost:3001',
      process.env.FRONTEND_URL,
    ],
    credentials: true,
  },
  namespace: '/tasks',
})
export class TasksGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer() server: Server;

  private readonly logger = new Logger(TasksGateway.name);
  private connectedClients = new Map<string, { userId: string; email: string; role: string }>();

  constructor(
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  afterInit(server: Server) {
    this.logger.log('WebSocket Gateway initialized on namespace /tasks');

    // Authenticate every incoming connection before it's accepted
    server.use((socket: Socket, next) => {
      try {
        const token =
          socket.handshake.auth?.token ||
          socket.handshake.headers?.authorization?.replace('Bearer ', '');

        if (!token) {
          return next(new Error('Authentication token missing'));
        }

        const payload = this.jwtService.verify(token, {
          secret: this.configService.get<string>('JWT_SECRET'),
        });

        // Attach user info to the socket for later use
        (socket as any).user = {
          userId: payload.sub,
          email: payload.email,
          role: payload.role,
        };

        next();
      } catch (err) {
        this.logger.warn(`Rejected unauthenticated socket: ${err.message}`);
        next(new Error('Invalid or expired token'));
      }
    });
  }

  handleConnection(client: Socket) {
    const user = (client as any).user;
    if (!user) {
      client.disconnect(true);
      return;
    }

    this.connectedClients.set(client.id, user);
    this.logger.log(
      `Client connected: ${client.id} — user ${user.email} (${user.role})`,
    );
  }

  handleDisconnect(client: Socket) {
    this.connectedClients.delete(client.id);
    this.logger.log(`Client disconnected: ${client.id}`);
  }

  /** Broadcast to all connected (authenticated) clients */
  emitTaskCreated(task: Task) {
    this.server.emit(TaskEvent.CREATED, task);
    this.logger.debug(`Emitted ${TaskEvent.CREATED} for task ${(task as any)._id}`);
  }

  emitTaskUpdated(task: Task) {
    this.server.emit(TaskEvent.UPDATED, task);
    this.logger.debug(`Emitted ${TaskEvent.UPDATED} for task ${(task as any)._id}`);
  }

  emitTaskDeleted(taskId: string) {
    this.server.emit(TaskEvent.DELETED, { taskId });
    this.logger.debug(`Emitted ${TaskEvent.DELETED} for task ${taskId}`);
  }

  get connectedCount() {
    return this.connectedClients.size;
  }
}
