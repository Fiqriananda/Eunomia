var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import * as fs from 'fs';
import * as path from 'path';
let UploadsService = class UploadsService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async createAttachment(file, userId, taskId) {
        const baseUrl = process.env.BASE_URL || 'http://localhost:4000';
        const fileUrl = `${baseUrl}/uploads/${file.filename}`;
        return this.prisma.attachment.create({
            data: {
                filename: file.filename,
                originalName: file.originalname,
                mimeType: file.mimetype,
                size: file.size,
                url: fileUrl,
                taskId: taskId || null,
                uploaderId: userId,
            },
        });
    }
    async linkAttachmentToTask(attachmentId, taskId) {
        return this.prisma.attachment.update({
            where: { id: attachmentId },
            data: { taskId },
        });
    }
    async deleteAttachment(id) {
        const attachment = await this.prisma.attachment.findUnique({
            where: { id },
        });
        if (!attachment) {
            throw new NotFoundException('Attachment not found');
        }
        const uploadDir = process.env.UPLOAD_DEST || './uploads';
        const filePath = path.join(uploadDir, attachment.filename);
        if (fs.existsSync(filePath)) {
            try {
                fs.unlinkSync(filePath);
            }
            catch (err) {
                console.error('Failed to remove physical file:', err);
            }
        }
        return this.prisma.attachment.delete({
            where: { id },
        });
    }
};
UploadsService = __decorate([
    Injectable(),
    __metadata("design:paramtypes", [PrismaService])
], UploadsService);
export { UploadsService };
//# sourceMappingURL=uploads.service.js.map