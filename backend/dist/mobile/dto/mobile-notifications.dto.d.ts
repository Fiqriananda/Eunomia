import { MobileUserDto } from './mobile-task-detail.dto.js';
export declare class MobileNotificationDto {
    id: string;
    type: string;
    title: string;
    body?: string | null;
    isRead: boolean;
    readAt?: Date | null;
    taskId: string;
    task?: {
        id: string;
        identifier: string;
        title: string;
    };
    actor?: MobileUserDto;
    createdAt: Date;
}
export declare class MobileNotificationsResponseDto {
    notifications: MobileNotificationDto[];
    unreadCount: number;
}
