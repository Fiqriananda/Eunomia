import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsOptional, MinLength } from 'class-validator';

export class MobileProfileStatsDto {
  @ApiProperty({ example: 3 })
  workspacesCount: number;

  @ApiProperty({ example: 12 })
  assignedTasksCount: number;

  @ApiProperty({ example: 45 })
  completedTasksCount: number;
}

export class MobileProfileResponseDto {
  @ApiProperty({ example: 'usr_123' })
  id: string;

  @ApiProperty({ example: 'Mohab Mamdouh' })
  name: string;

  @ApiProperty({ example: 'mohab@linear.app' })
  email: string;

  @ApiPropertyOptional({ example: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb' })
  avatarUrl?: string | null;

  @ApiProperty({ type: () => MobileProfileStatsDto })
  stats: MobileProfileStatsDto;

  @ApiProperty({ example: '2026-10-01T00:00:00.000Z' })
  createdAt: Date;
}

export class MobileUpdateProfileDto {
  @ApiPropertyOptional({ example: 'Mohab Mamdouh' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ example: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb' })
  @IsOptional()
  @IsString()
  avatarUrl?: string;
}

export class MobileChangePasswordDto {
  @ApiProperty({ example: 'password123', description: 'Current password' })
  @IsNotEmpty()
  @IsString()
  currentPassword: string;

  @ApiProperty({ example: 'newSecurePassword456', minLength: 6, description: 'New password (min 6 characters)' })
  @IsNotEmpty()
  @IsString()
  @MinLength(6)
  newPassword: string;
}

export class MobileUserHoverCardDto {
  @ApiProperty({ example: 'usr_123' })
  id: string;

  @ApiProperty({ example: 'Mohab Mamdouh' })
  name: string;

  @ApiProperty({ example: 'mohab • ...' })
  handle: string;

  @ApiPropertyOptional({ example: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb' })
  avatarUrl?: string | null;

  @ApiProperty({ example: 'MM' })
  initials: string;

  @ApiProperty({ example: '#00b4d8' })
  avatarColor: string;

  @ApiProperty({ example: 'offline', enum: ['online', 'offline', 'away'] })
  status: 'online' | 'offline' | 'away';

  @ApiProperty({ example: '11:10 PM local time' })
  localTime: string;

  @ApiProperty({ example: 'Tjar' })
  roleOrTitle: string;

  @ApiProperty({ example: 'Tjar' })
  workspaceName: string;
}
