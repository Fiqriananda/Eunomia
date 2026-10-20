import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { MobileUserDto } from './mobile-task-detail.dto.js';

export class MobileNotificationDto {
  @ApiProperty({ example: 'notif_1' })
  id: string;

  @ApiProperty({ example: 'ASSIGNED' })
  type: string;

  @ApiProperty({ example: 'Assigned to LIN-14' })
  title: string;

  @ApiPropertyOptional({ example: 'You were assigned to "Implement mobile biometric login"' })
  body?: string | null;

  @ApiProperty({ example: false })
  isRead: boolean;

  @ApiPropertyOptional({ example: null })
  readAt?: Date | null;

  @ApiProperty({ example: 'task_1' })
  taskId: string;

  @ApiPropertyOptional({
    example: { id: 'task_1', identifier: 'LIN-14', title: 'Implement mobile biometric login' },
  })
  task?: {
    id: string;
    identifier: string;
    title: string;
  };

  @ApiPropertyOptional({ type: () => MobileUserDto })
  actor?: MobileUserDto;

  @ApiProperty({ example: '2026-10-19T08:00:00.000Z' })
  createdAt: Date;
}

export class MobileNotificationsResponseDto {
  @ApiProperty({ type: () => [MobileNotificationDto] })
  notifications: MobileNotificationDto[];

  @ApiProperty({ example: 4 })
  unreadCount: number;
}
