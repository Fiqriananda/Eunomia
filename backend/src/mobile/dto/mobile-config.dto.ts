import { ApiProperty } from '@nestjs/swagger';

export class MobileStatusMetaDto {
  @ApiProperty({ example: 'TODO' })
  key: string;

  @ApiProperty({ example: 'Todo' })
  label: string;

  @ApiProperty({ example: '#e2e8f0' })
  color: string;
}

export class MobilePriorityMetaDto {
  @ApiProperty({ example: 'URGENT' })
  key: string;

  @ApiProperty({ example: 'Urgent' })
  label: string;

  @ApiProperty({ example: 4 })
  level: number;

  @ApiProperty({ example: '#f43f5e' })
  color: string;
}

export class MobileFeaturesDto {
  @ApiProperty({ example: true })
  fileUploads: boolean;

  @ApiProperty({ example: true })
  subtasks: boolean;

  @ApiProperty({ example: true })
  relations: boolean;

  @ApiProperty({ example: true })
  cycles: boolean;

  @ApiProperty({ example: true })
  trash: boolean;

  @ApiProperty({ example: true })
  inbox: boolean;

  @ApiProperty({ example: true })
  hoverCard: boolean;

  @ApiProperty({ example: false })
  pushNotifications: boolean;
}

export class MobileConfigResponseDto {
  @ApiProperty({ example: '1.0.0' })
  apiVersion: string;

  @ApiProperty({ example: '1.0.0' })
  minSupportedAppVersion: string;

  @ApiProperty({ example: '2026-10-22T00:00:00.000Z' })
  serverTime: string;

  @ApiProperty({ type: () => [MobileStatusMetaDto] })
  statuses: MobileStatusMetaDto[];

  @ApiProperty({ type: () => [MobilePriorityMetaDto] })
  priorities: MobilePriorityMetaDto[];

  @ApiProperty({ example: ['BLOCKS', 'BLOCKED_BY', 'RELATES_TO', 'DUPLICATE'] })
  supportedRelations: string[];

  @ApiProperty({ example: ['👍', '❤️', '🎉', '🚀', '👀', '🔥', '💡', '👎', '👏', '✨', '🙏', '💯'] })
  supportedEmojis: string[];

  @ApiProperty({ type: () => MobileFeaturesDto })
  features: MobileFeaturesDto;
}
