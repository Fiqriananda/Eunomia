import { UploadsService } from './uploads.service.js';
export declare class UploadsController {
    private readonly uploadsService;
    constructor(uploadsService: UploadsService);
    uploadFile(file: Express.Multer.File, userId: string, taskId?: string): Promise<{
        id: string;
        createdAt: Date;
        url: string;
        taskId: string | null;
        filename: string;
        originalName: string;
        mimeType: string;
        size: number;
        uploaderId: string;
    }>;
    linkToTask(attachmentId: string, taskId: string): Promise<{
        id: string;
        createdAt: Date;
        url: string;
        taskId: string | null;
        filename: string;
        originalName: string;
        mimeType: string;
        size: number;
        uploaderId: string;
    }>;
    deleteFile(id: string): Promise<{
        id: string;
        createdAt: Date;
        url: string;
        taskId: string | null;
        filename: string;
        originalName: string;
        mimeType: string;
        size: number;
        uploaderId: string;
    }>;
}
