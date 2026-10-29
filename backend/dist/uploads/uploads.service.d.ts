import { PrismaService } from '../prisma/prisma.service.js';
export declare class UploadsService {
    private prisma;
    constructor(prisma: PrismaService);
    createAttachment(file: Express.Multer.File, userId: string, taskId?: string): Promise<{
        id: string;
        createdAt: Date;
        taskId: string | null;
        url: string;
        filename: string;
        originalName: string;
        mimeType: string;
        size: number;
        uploaderId: string;
    }>;
    linkAttachmentToTask(attachmentId: string, taskId: string): Promise<{
        id: string;
        createdAt: Date;
        taskId: string | null;
        url: string;
        filename: string;
        originalName: string;
        mimeType: string;
        size: number;
        uploaderId: string;
    }>;
    deleteAttachment(id: string): Promise<{
        id: string;
        createdAt: Date;
        taskId: string | null;
        url: string;
        filename: string;
        originalName: string;
        mimeType: string;
        size: number;
        uploaderId: string;
    }>;
}
