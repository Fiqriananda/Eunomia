import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class UploadsService {
  constructor(private prisma: PrismaService) {}

  async createAttachment(
    file: Express.Multer.File,
    userId: string,
    taskId?: string,
  ) {
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

  async linkAttachmentToTask(attachmentId: string, taskId: string) {
    return this.prisma.attachment.update({
      where: { id: attachmentId },
      data: { taskId },
    });
  }

  async deleteAttachment(id: string) {
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
      } catch (err) {
        console.error('Failed to remove physical file:', err);
      }
    }

    return this.prisma.attachment.delete({
      where: { id },
    });
  }
}
