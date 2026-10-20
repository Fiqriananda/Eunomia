import {
  Controller,
  Post,
  Delete,
  Param,
  UseInterceptors,
  UploadedFile,
  UseGuards,
  Query,
  BadRequestException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiConsumes,
  ApiBody,
} from '@nestjs/swagger';
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

@ApiTags('Uploads')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard)
@Controller('uploads')
export class UploadsController {
  constructor(private readonly uploadsService: UploadsService) {}

  @Post()
  @ApiOperation({ summary: 'Upload file attachment' })
  @ApiConsumes('multipart/form-data')
  @ApiQuery({ name: 'taskId', required: false, description: 'Optional task ID to associate immediately' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  @UseInterceptors(
    FileInterceptor('file', {
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
        fileSize: 25 * 1024 * 1024, // 25 MB limit
      },
    }),
  )
  async uploadFile(
    @UploadedFile() file: Express.Multer.File,
    @CurrentUser('id') userId: string,
    @Query('taskId') taskId?: string,
  ) {
    if (!file) {
      throw new BadRequestException('File is required');
    }

    return this.uploadsService.createAttachment(file, userId, taskId);
  }

  @Post(':id/link')
  @ApiOperation({ summary: 'Link an existing attachment to a task' })
  @ApiParam({ name: 'id', description: 'Attachment ID' })
  @ApiQuery({ name: 'taskId', required: true, description: 'Task ID' })
  async linkToTask(
    @Param('id') attachmentId: string,
    @Query('taskId') taskId: string,
  ) {
    return this.uploadsService.linkAttachmentToTask(attachmentId, taskId);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete an attachment' })
  @ApiParam({ name: 'id', description: 'Attachment ID' })
  async deleteFile(@Param('id') id: string) {
    return this.uploadsService.deleteAttachment(id);
  }
}
