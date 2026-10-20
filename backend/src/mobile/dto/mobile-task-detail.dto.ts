import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { TaskStatus, TaskPriority } from '@prisma/client';

export class MobileUserDto {
  @ApiProperty({ example: 'usr_1' })
  id: string;

  @ApiProperty({ example: 'Alex Smith' })
  name: string;

  @ApiProperty({ example: 'alex@linear.app' })
  email: string;

  @ApiPropertyOptional({ example: null })
  avatarUrl?: string | null;
}

export class MobileSubtaskItemDto {
  @ApiProperty({ example: 'sub_1' })
  id: string;

  @ApiProperty({ example: 'LIN-15' })
  identifier: string;

  @ApiProperty({ example: 'Configure Keychain on iOS' })
  title: string;

  @ApiProperty({ enum: TaskStatus, example: TaskStatus.DONE })
  status: TaskStatus;

  @ApiProperty({ enum: TaskPriority, example: TaskPriority.MEDIUM })
  priority: TaskPriority;

  @ApiPropertyOptional({ type: () => MobileUserDto })
  assignee?: MobileUserDto | null;
}

export class MobileCommentDto {
  @ApiProperty({ example: 'comment_1' })
  id: string;

  @ApiProperty({ example: 'I tested the biometric build on iPhone 15 Pro, worked smoothly.' })
  content: string;

  @ApiProperty({ type: () => MobileUserDto })
  user: MobileUserDto;

  @ApiProperty({ example: '2026-10-19T09:15:00.000Z' })
  createdAt: Date;
}

export class MobileAttachmentDto {
  @ApiProperty({ example: 'att_1' })
  id: string;

  @ApiProperty({ example: 'screenshot.png' })
  filename: string;

  @ApiProperty({ example: 'screenshot.png' })
  originalName: string;

  @ApiProperty({ example: 'image/png' })
  mimeType: string;

  @ApiProperty({ example: 450120 })
  size: number;

  @ApiProperty({ example: 'http://localhost:4000/uploads/screenshot.png' })
  url: string;

  @ApiProperty({ example: '2026-10-19T09:10:00.000Z' })
  createdAt: Date;
}

export class MobileTaskDetailDto {
  @ApiProperty({ example: 'task_1' })
  id: string;

  @ApiProperty({ example: 'LIN-14' })
  identifier: string;

  @ApiProperty({ example: 'Implement mobile biometric login' })
  title: string;

  @ApiPropertyOptional({ example: 'Add FaceID and Fingerprint support for iOS and Android' })
  description?: string | null;

  @ApiProperty({ enum: TaskStatus, example: TaskStatus.IN_PROGRESS })
  status: TaskStatus;

  @ApiPropertyOptional({ example: null })
  customStatus?: string | null;

  @ApiProperty({ enum: TaskPriority, example: TaskPriority.HIGH })
  priority: TaskPriority;

  @ApiPropertyOptional({ example: '2026-10-25T12:00:00.000Z' })
  dueDate?: Date | null;

  @ApiProperty({ example: ['mobile', 'auth'] })
  labels: string[];

  @ApiProperty({
    example: { id: 'ws_1', name: 'Linear Corp', slug: 'linear-corp' },
  })
  workspace: {
    id: string;
    name: string;
    slug: string;
  };

  @ApiProperty({
    example: { id: 'proj_1', name: 'Mobile App', key: 'LIN', color: '#6366f1' },
  })
  project: {
    id: string;
    name: string;
    key: string;
    color: string | null;
  };

  @ApiProperty({ type: () => MobileUserDto })
  creator: MobileUserDto;

  @ApiPropertyOptional({ type: () => MobileUserDto })
  assignee?: MobileUserDto | null;

  @ApiPropertyOptional({
    example: { id: 'parent_1', identifier: 'LIN-10', title: 'Mobile Client v1' },
  })
  parent?: {
    id: string;
    identifier: string;
    title: string;
  } | null;

  @ApiProperty({ type: () => [MobileSubtaskItemDto] })
  subtasks: MobileSubtaskItemDto[];

  @ApiProperty({ type: () => [MobileCommentDto] })
  comments: MobileCommentDto[];

  @ApiProperty({ type: () => [MobileAttachmentDto] })
  attachments: MobileAttachmentDto[];

  @ApiProperty({ example: '2026-10-18T10:00:00.000Z' })
  createdAt: Date;

  @ApiProperty({ example: '2026-10-19T08:30:00.000Z' })
  updatedAt: Date;
}
