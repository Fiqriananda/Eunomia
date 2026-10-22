import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { TaskStatus, TaskPriority } from '@prisma/client';

export class MobileTrashedTaskDto {
  @ApiProperty({ example: 'task_123' })
  id: string;

  @ApiProperty({ example: 'TJAR-45' })
  identifier: string;

  @ApiProperty({ example: 'Fix memory leak on login' })
  title: string;

  @ApiProperty({ example: 'TODO', enum: TaskStatus })
  status: TaskStatus;

  @ApiProperty({ example: 'HIGH', enum: TaskPriority })
  priority: TaskPriority;

  @ApiPropertyOptional({ example: 'Core Platform' })
  projectName?: string | null;

  @ApiPropertyOptional({ example: 'Alex Vance' })
  assigneeName?: string | null;

  @ApiProperty({ example: '2026-10-21T18:00:00.000Z' })
  deletedAt: Date;
}

export class MobileTrashListResponseDto {
  @ApiProperty({ type: () => [MobileTrashedTaskDto] })
  items: MobileTrashedTaskDto[];

  @ApiProperty({ example: 5 })
  total: number;
}
