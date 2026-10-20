import { TaskStatus, TaskPriority } from '@prisma/client';
export declare class MobileUserDto {
    id: string;
    name: string;
    email: string;
    avatarUrl?: string | null;
}
export declare class MobileSubtaskItemDto {
    id: string;
    identifier: string;
    title: string;
    status: TaskStatus;
    priority: TaskPriority;
    assignee?: MobileUserDto | null;
}
export declare class MobileCommentDto {
    id: string;
    content: string;
    user: MobileUserDto;
    createdAt: Date;
}
export declare class MobileAttachmentDto {
    id: string;
    filename: string;
    originalName: string;
    mimeType: string;
    size: number;
    url: string;
    createdAt: Date;
}
export declare class MobileTaskDetailDto {
    id: string;
    identifier: string;
    title: string;
    description?: string | null;
    status: TaskStatus;
    customStatus?: string | null;
    priority: TaskPriority;
    dueDate?: Date | null;
    labels: string[];
    workspace: {
        id: string;
        name: string;
        slug: string;
    };
    project: {
        id: string;
        name: string;
        key: string;
        color: string | null;
    };
    creator: MobileUserDto;
    assignee?: MobileUserDto | null;
    parent?: {
        id: string;
        identifier: string;
        title: string;
    } | null;
    subtasks: MobileSubtaskItemDto[];
    comments: MobileCommentDto[];
    attachments: MobileAttachmentDto[];
    createdAt: Date;
    updatedAt: Date;
}
