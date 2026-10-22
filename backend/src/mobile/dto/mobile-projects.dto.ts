import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsOptional, MaxLength } from 'class-validator';
import { MobileCompactTaskDto } from './mobile-home.dto.js';

export class MobileProjectStatusBreakdownDto {
  @ApiProperty({ example: 4 })
  backlog: number;

  @ApiProperty({ example: 6 })
  todo: number;

  @ApiProperty({ example: 3 })
  inProgress: number;

  @ApiProperty({ example: 8 })
  done: number;

  @ApiProperty({ example: 1 })
  canceled: number;
}

export class MobileProjectDto {
  @ApiProperty({ example: 'proj_123' })
  id: string;

  @ApiProperty({ example: 'Core Platform' })
  name: string;

  @ApiProperty({ example: 'TJAR' })
  key: string;

  @ApiPropertyOptional({ example: '#5e6ad2' })
  color?: string | null;

  @ApiPropertyOptional({ example: 'Core architecture and foundation components' })
  description?: string | null;

  @ApiProperty({ example: 22 })
  totalTasks: number;

  @ApiProperty({ example: 8 })
  completedTasks: number;

  @ApiProperty({ example: 36, description: 'Percentage completion (0-100)' })
  progressPercentage: number;

  @ApiProperty({ example: '2026-10-10T00:00:00.000Z' })
  createdAt: Date;
}

export class MobileCreateProjectDto {
  @ApiPropertyOptional({ description: 'Workspace ID (defaults to active user workspace)' })
  @IsOptional()
  @IsString()
  workspaceId?: string;

  @ApiProperty({ example: 'Mobile App', description: 'Name of the project' })
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiProperty({ example: 'MOB', description: 'Identifier prefix key for issues (e.g. MOB-1)' })
  @IsNotEmpty()
  @IsString()
  @MaxLength(10)
  key: string;

  @ApiPropertyOptional({ example: 'React Native & Flutter mobile app development' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ example: '#06b6d4', description: 'Hex color code for project theme' })
  @IsOptional()
  @IsString()
  color?: string;
}

export class MobileUpdateProjectDto {
  @ApiPropertyOptional({ example: 'Mobile App Redesign' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ example: 'MOB' })
  @IsOptional()
  @IsString()
  @MaxLength(10)
  key?: string;

  @ApiPropertyOptional({ example: 'Updated project description' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ example: '#8b5cf6' })
  @IsOptional()
  @IsString()
  color?: string;
}

export class MobileProjectDetailDto extends MobileProjectDto {
  @ApiProperty({ type: () => MobileProjectStatusBreakdownDto })
  statusBreakdown: MobileProjectStatusBreakdownDto;

  @ApiProperty({ type: () => [MobileCompactTaskDto] })
  recentTasks: MobileCompactTaskDto[];
}
