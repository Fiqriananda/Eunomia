var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var EventsGateway_1;
import { WebSocketGateway, WebSocketServer, SubscribeMessage, } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';
let EventsGateway = EventsGateway_1 = class EventsGateway {
    server;
    logger = new Logger(EventsGateway_1.name);
    handleConnection(client) {
        this.logger.log(`Client connected: ${client.id}`);
    }
    handleDisconnect(client) {
        this.logger.log(`Client disconnected: ${client.id}`);
    }
    handleJoinWorkspace(client, payload) {
        const wsId = typeof payload === 'string' ? payload : payload?.workspaceId;
        if (wsId) {
            const room = `workspace_${wsId}`;
            client.join(room);
            this.logger.log(`Client ${client.id} joined room ${room}`);
            return { event: 'joined_workspace', data: wsId };
        }
    }
    handleLeaveWorkspace(client, payload) {
        const wsId = typeof payload === 'string' ? payload : payload?.workspaceId;
        if (wsId) {
            const room = `workspace_${wsId}`;
            client.leave(room);
            this.logger.log(`Client ${client.id} left room ${room}`);
            return { event: 'left_workspace', data: wsId };
        }
    }
    handleJoinUser(client, payload) {
        const uId = typeof payload === 'string' ? payload : payload?.userId;
        if (uId) {
            const room = `user_${uId}`;
            client.join(room);
            this.logger.log(`Client ${client.id} joined personal room ${room}`);
            return { event: 'joined_user', data: uId };
        }
    }
    handleJoinTask(client, payload) {
        const tId = typeof payload === 'string' ? payload : payload?.taskId;
        if (tId) {
            const room = `task_${tId}`;
            client.join(room);
            this.logger.log(`Client ${client.id} joined task room ${room}`);
            return { event: 'joined_task', data: tId };
        }
    }
    handleLeaveTask(client, payload) {
        const tId = typeof payload === 'string' ? payload : payload?.taskId;
        if (tId) {
            const room = `task_${tId}`;
            client.leave(room);
            this.logger.log(`Client ${client.id} left task room ${room}`);
            return { event: 'left_task', data: tId };
        }
    }
    handleTaskTyping(client, payload) {
        const dataWithSender = { ...payload, senderSocketId: client.id };
        const rooms = [];
        if (payload?.taskId)
            rooms.push(`task_${payload.taskId}`);
        if (payload?.workspaceId)
            rooms.push(`workspace_${payload.workspaceId}`);
        if (rooms.length > 0) {
            client.to(rooms).emit('task:typing', dataWithSender);
        }
    }
    emitTaskCreated(workspaceId, task) {
        this.server.to(`workspace_${workspaceId}`).emit('task:created', task);
    }
    emitTaskUpdated(workspaceId, task) {
        const rooms = [`workspace_${workspaceId}`];
        if (task?.id)
            rooms.push(`task_${task.id}`);
        this.server.to(rooms).emit('task:updated', task);
    }
    emitTaskMoved(workspaceId, payload) {
        this.server.to(`workspace_${workspaceId}`).emit('task:moved', payload);
    }
    emitTaskArchived(workspaceId, payload) {
        this.server.to(`workspace_${workspaceId}`).emit('task:archived', payload);
    }
    emitTaskRestored(workspaceId, task) {
        this.server.to(`workspace_${workspaceId}`).emit('task:restored', task);
    }
    emitTaskDeleted(workspaceId, payload) {
        this.server.to(`workspace_${workspaceId}`).emit('task:deleted', payload);
    }
    emitCommentCreated(workspaceId, payload) {
        this.server.to(`workspace_${workspaceId}`).emit('comment:created', payload);
    }
    emitNotification(userId, notification) {
        this.server.to(`user_${userId}`).emit('notification:new', notification);
    }
};
__decorate([
    WebSocketServer(),
    __metadata("design:type", Server)
], EventsGateway.prototype, "server", void 0);
__decorate([
    SubscribeMessage('join_workspace'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Socket, Object]),
    __metadata("design:returntype", void 0)
], EventsGateway.prototype, "handleJoinWorkspace", null);
__decorate([
    SubscribeMessage('leave_workspace'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Socket, Object]),
    __metadata("design:returntype", void 0)
], EventsGateway.prototype, "handleLeaveWorkspace", null);
__decorate([
    SubscribeMessage('join_user'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Socket, Object]),
    __metadata("design:returntype", void 0)
], EventsGateway.prototype, "handleJoinUser", null);
__decorate([
    SubscribeMessage('join_task'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Socket, Object]),
    __metadata("design:returntype", void 0)
], EventsGateway.prototype, "handleJoinTask", null);
__decorate([
    SubscribeMessage('leave_task'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Socket, Object]),
    __metadata("design:returntype", void 0)
], EventsGateway.prototype, "handleLeaveTask", null);
__decorate([
    SubscribeMessage('task:typing'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Socket, Object]),
    __metadata("design:returntype", void 0)
], EventsGateway.prototype, "handleTaskTyping", null);
EventsGateway = EventsGateway_1 = __decorate([
    WebSocketGateway({
        cors: {
            origin: '*',
            credentials: true,
        },
    })
], EventsGateway);
export { EventsGateway };
//# sourceMappingURL=events.gateway.js.map