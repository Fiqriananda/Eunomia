import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';

@WebSocketGateway({
  cors: {
    origin: '*',
    credentials: true,
  },
})
export class EventsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(EventsGateway.name);

  handleConnection(client: Socket) {
    this.logger.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
  }

  @SubscribeMessage('join_workspace')
  handleJoinWorkspace(client: Socket, payload: string | { workspaceId: string }) {
    const wsId = typeof payload === 'string' ? payload : payload?.workspaceId;
    if (wsId) {
      const room = `workspace_${wsId}`;
      client.join(room);
      this.logger.log(`Client ${client.id} joined room ${room}`);
      return { event: 'joined_workspace', data: wsId };
    }
  }

  @SubscribeMessage('leave_workspace')
  handleLeaveWorkspace(client: Socket, payload: string | { workspaceId: string }) {
    const wsId = typeof payload === 'string' ? payload : payload?.workspaceId;
    if (wsId) {
      const room = `workspace_${wsId}`;
      client.leave(room);
      this.logger.log(`Client ${client.id} left room ${room}`);
      return { event: 'left_workspace', data: wsId };
    }
  }

  @SubscribeMessage('join_user')
  handleJoinUser(client: Socket, payload: string | { userId: string }) {
    const uId = typeof payload === 'string' ? payload : payload?.userId;
    if (uId) {
      const room = `user_${uId}`;
      client.join(room);
      this.logger.log(`Client ${client.id} joined personal room ${room}`);
      return { event: 'joined_user', data: uId };
    }
  }

  @SubscribeMessage('join_task')
  handleJoinTask(client: Socket, payload: string | { taskId: string }) {
    const tId = typeof payload === 'string' ? payload : payload?.taskId;
    if (tId) {
      const room = `task_${tId}`;
      client.join(room);
      this.logger.log(`Client ${client.id} joined task room ${room}`);
      return { event: 'joined_task', data: tId };
    }
  }

  @SubscribeMessage('leave_task')
  handleLeaveTask(client: Socket, payload: string | { taskId: string }) {
    const tId = typeof payload === 'string' ? payload : payload?.taskId;
    if (tId) {
      const room = `task_${tId}`;
      client.leave(room);
      this.logger.log(`Client ${client.id} left task room ${room}`);
      return { event: 'left_task', data: tId };
    }
  }

  @SubscribeMessage('task:typing')
  handleTaskTyping(
    client: Socket,
    payload: {
      workspaceId?: string;
      taskId: string;
      field: 'title' | 'description';
      value: string;
      userId: string;
      userName: string;
      senderSocketId?: string;
    },
  ) {
    const dataWithSender = { ...payload, senderSocketId: client.id };
    const rooms: string[] = [];
    if (payload?.taskId) rooms.push(`task_${payload.taskId}`);
    if (payload?.workspaceId) rooms.push(`workspace_${payload.workspaceId}`);

    if (rooms.length > 0) {
      client.to(rooms).emit('task:typing', dataWithSender);
    }
  }

  // Broadcast events
  emitTaskCreated(workspaceId: string, task: any) {
    this.server.to(`workspace_${workspaceId}`).emit('task:created', task);
  }

  emitTaskUpdated(workspaceId: string, task: any) {
    const rooms = [`workspace_${workspaceId}`];
    if (task?.id) rooms.push(`task_${task.id}`);
    this.server.to(rooms).emit('task:updated', task);
  }

  emitTaskMoved(workspaceId: string, payload: any) {
    this.server.to(`workspace_${workspaceId}`).emit('task:moved', payload);
  }

  emitTaskArchived(workspaceId: string, payload: { taskId: string; userId?: string }) {
    this.server.to(`workspace_${workspaceId}`).emit('task:archived', payload);
  }

  emitTaskRestored(workspaceId: string, task: any) {
    this.server.to(`workspace_${workspaceId}`).emit('task:restored', task);
  }

  emitTaskDeleted(workspaceId: string, payload: { taskId: string; userId?: string }) {
    this.server.to(`workspace_${workspaceId}`).emit('task:deleted', payload);
  }

  emitCommentCreated(workspaceId: string, payload: { taskId: string; comment: any }) {
    this.server.to(`workspace_${workspaceId}`).emit('comment:created', payload);
  }

  emitCommentUpdated(workspaceId: string, payload: { taskId: string; comment: any }) {
    this.server.to(`workspace_${workspaceId}`).emit('comment:updated', payload);
  }

  emitCommentDeleted(workspaceId: string, payload: { taskId: string; commentId: string }) {
    this.server.to(`workspace_${workspaceId}`).emit('comment:deleted', payload);
  }

  emitNotification(userId: string, notification: any) {
    this.server.to(`user_${userId}`).emit('notification:new', notification);
  }
}
