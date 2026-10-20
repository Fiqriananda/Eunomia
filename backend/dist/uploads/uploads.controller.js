var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
import { Controller, Post, Delete, Param, UseInterceptors, UploadedFile, UseGuards, Query, BadRequestException, } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiParam, ApiQuery, ApiConsumes, ApiBody, } from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import * as fs from 'fs';
import { UploadsService } from './uploads.service.js';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';
import { CurrentUser } from '../auth/current-user.decorator.js';
const uploadDir = process.env.UPLOAD_DEST || './uploads';
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}
let UploadsController = class UploadsController {
    uploadsService;
    constructor(uploadsService) {
        this.uploadsService = uploadsService;
    }
    async uploadFile(file, userId, taskId) {
        if (!file) {
            throw new BadRequestException('File is required');
        }
        return this.uploadsService.createAttachment(file, userId, taskId);
    }
    async linkToTask(attachmentId, taskId) {
        return this.uploadsService.linkAttachmentToTask(attachmentId, taskId);
    }
    async deleteFile(id) {
        return this.uploadsService.deleteAttachment(id);
    }
};
__decorate([
    Post(),
    ApiOperation({ summary: 'Upload file attachment' }),
    ApiConsumes('multipart/form-data'),
    ApiQuery({ name: 'taskId', required: false, description: 'Optional task ID to associate immediately' }),
    ApiBody({
        schema: {
            type: 'object',
            properties: {
                file: {
                    type: 'string',
                    format: 'binary',
                },
            },
        },
    }),
    UseInterceptors(FileInterceptor('file', {
        storage: diskStorage({
            destination: uploadDir,
            filename: (req, file, cb) => {
                const randomName = Array(32)
                    .fill(null)
                    .map(() => Math.round(Math.random() * 16).toString(16))
                    .join('');
                return cb(null, `${randomName}${extname(file.originalname)}`);
            },
        }),
        limits: {
            fileSize: 25 * 1024 * 1024,
        },
    })),
    __param(0, UploadedFile()),
    __param(1, CurrentUser('id')),
    __param(2, Query('taskId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String]),
    __metadata("design:returntype", Promise)
], UploadsController.prototype, "uploadFile", null);
__decorate([
    Post(':id/link'),
    ApiOperation({ summary: 'Link an existing attachment to a task' }),
    ApiParam({ name: 'id', description: 'Attachment ID' }),
    ApiQuery({ name: 'taskId', required: true, description: 'Task ID' }),
    __param(0, Param('id')),
    __param(1, Query('taskId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], UploadsController.prototype, "linkToTask", null);
__decorate([
    Delete(':id'),
    ApiOperation({ summary: 'Delete an attachment' }),
    ApiParam({ name: 'id', description: 'Attachment ID' }),
    __param(0, Param('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], UploadsController.prototype, "deleteFile", null);
UploadsController = __decorate([
    ApiTags('Uploads'),
    ApiBearerAuth('JWT-auth'),
    UseGuards(JwtAuthGuard),
    Controller('uploads'),
    __metadata("design:paramtypes", [UploadsService])
], UploadsController);
export { UploadsController };
//# sourceMappingURL=uploads.controller.js.map