import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsOptional, IsDateString, IsNumber } from 'class-validator';

export class CreateCycleDto {
  @ApiProperty({ description: 'Workspace ID', example: 'd55b1cc7-9eb7-4678-9c1a-761d6817ddd9' })
  @IsNotEmpty()
  @IsString()
  workspaceId: string;

  @ApiPropertyOptional({ description: 'Cycle / Sprint Name', example: 'Cycle 2 (Feature Freeze)' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ description: 'Cycle goal or description' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ description: 'Start date (ISO)', example: '2026-10-20T00:00:00.000Z' })
  @IsNotEmpty()
  @IsDateString()
  startDate: string;

  @ApiProperty({ description: 'End date (ISO)', example: '2026-11-03T00:00:00.000Z' })
  @IsNotEmpty()
  @IsDateString()
  endDate: string;
}

export class UpdateCycleDto {
  @ApiPropertyOptional({ example: 'Cycle 2 (Q4 Final)' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ enum: ['UPCOMING', 'ACTIVE', 'COMPLETED'] })
  @IsOptional()
  @IsString()
  status?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  endDate?: string;
}

export class RolloverCycleDto {
  @ApiPropertyOptional({
    description: 'Target cycle ID to move incomplete tasks to. If omitted, tasks move to backlog.',
  })
  @IsOptional()
  @IsString()
  targetCycleId?: string;
}
