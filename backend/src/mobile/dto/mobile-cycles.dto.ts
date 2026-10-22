import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsOptional, IsDateString } from 'class-validator';
import { MobileCompactTaskDto } from './mobile-home.dto.js';

export class MobileCycleDto {
  @ApiProperty({ example: 'cyc_123' })
  id: string;

  @ApiProperty({ example: 14 })
  number: number;

  @ApiPropertyOptional({ example: 'Cycle 14 - Mobile Launch' })
  name?: string | null;

  @ApiProperty({ example: 'ACTIVE', enum: ['ACTIVE', 'UPCOMING', 'COMPLETED'] })
  status: string;

  @ApiProperty({ example: '2026-10-15T00:00:00.000Z' })
  startDate: Date;

  @ApiProperty({ example: '2026-10-29T23:59:59.000Z' })
  endDate: Date;

  @ApiProperty({ example: 15 })
  totalTasks: number;

  @ApiProperty({ example: 6 })
  completedTasks: number;

  @ApiProperty({ example: 40, description: 'Percentage completion (0-100)' })
  progressPercentage: number;
}

export class MobileCreateCycleDto {
  @ApiPropertyOptional({ description: 'Workspace ID (defaults to active user workspace)' })
  @IsOptional()
  @IsString()
  workspaceId?: string;

  @ApiPropertyOptional({ example: 'Sprint 15', description: 'Custom cycle name' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiProperty({ example: '2026-10-23T00:00:00.000Z', description: 'ISO start date' })
  @IsNotEmpty()
  @IsDateString()
  startDate: string;

  @ApiProperty({ example: '2026-11-06T23:59:59.000Z', description: 'ISO end date' })
  @IsNotEmpty()
  @IsDateString()
  endDate: string;
}

export class MobileUpdateCycleDto {
  @ApiPropertyOptional({ example: 'Cycle 15 Sprint' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ example: '2026-10-23T00:00:00.000Z' })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({ example: '2026-11-06T23:59:59.000Z' })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiPropertyOptional({ example: 'ACTIVE', enum: ['ACTIVE', 'UPCOMING', 'COMPLETED'] })
  @IsOptional()
  @IsString()
  status?: string;
}

export class MobileCycleDetailDto extends MobileCycleDto {
  @ApiProperty({ type: () => [MobileCompactTaskDto] })
  tasks: MobileCompactTaskDto[];
}
