import { OnGatewayConnection, OnGatewayDisconnect } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
export declare class EventsGateway implements OnGatewayConnection, OnGatewayDisconnect {
    server: Server;
    private readonly logger;
    handleConnection(client: Socket): void;
    handleDisconnect(client: Socket): void;
    handleJoinWorkspace(client: Socket, payload: string | {
        workspaceId: string;
    }): {
        event: string;
        data: string;
    } | undefined;
    handleLeaveWorkspace(client: Socket, payload: string | {
        workspaceId: string;
    }): {
        event: string;
        data: string;
    } | undefined;
    handleJoinUser(client: Socket, payload: string | {
        userId: string;
    }): {
        event: string;
        data: string;
    } | undefined;
    handleJoinTask(client: Socket, payload: string | {
        taskId: string;
    }): {
        event: string;
        data: string;
    } | undefined;
    handleLeaveTask(client: Socket, payload: string | {
        taskId: string;
    }): {
        event: string;
        data: string;
    } | undefined;
    handleTaskTyping(client: Socket, payload: {
        workspaceId?: string;
        taskId: string;
        field: 'title' | 'description';
        value: string;
        userId: string;
        userName: string;
        senderSocketId?: string;
    }): void;
    emitTaskCreated(workspaceId: string, task: any): void;
    emitTaskUpdated(workspaceId: string, task: any): void;
    emitTaskMoved(workspaceId: string, payload: any): void;
    emitTaskArchived(workspaceId: string, payload: {
        taskId: string;
        userId?: string;
    }): void;
    emitTaskRestored(workspaceId: string, task: any): void;
    emitTaskDeleted(workspaceId: string, payload: {
        taskId: string;
        userId?: string;
    }): void;
    emitCommentCreated(workspaceId: string, payload: {
        taskId: string;
        comment: any;
    }): void;
    emitNotification(userId: string, notification: any): void;
}
