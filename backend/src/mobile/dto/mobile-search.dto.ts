import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsOptional } from 'class-validator';
import { MobileCompactTaskDto } from './mobile-home.dto.js';
import { MobileProjectDto } from './mobile-projects.dto.js';
import { MobileWorkspaceMemberDto } from './mobile-workspaces.dto.js';

export class MobileSearchQueryDto {
  @ApiProperty({ example: 'auth bug', description: 'Search keyword across tasks, projects, and teammates' })
  @IsNotEmpty()
  @IsString()
  q: string;

  @ApiPropertyOptional({ description: 'Workspace ID (defaults to active user workspace)' })
  @IsOptional()
  @IsString()
  workspaceId?: string;
}

export class MobileSearchResultDto {
  @ApiProperty({ type: () => [MobileCompactTaskDto] })
  tasks: MobileCompactTaskDto[];

  @ApiProperty({ type: () => [MobileProjectDto] })
  projects: MobileProjectDto[];

  @ApiProperty({ type: () => [MobileWorkspaceMemberDto] })
  members: MobileWorkspaceMemberDto[];
}
