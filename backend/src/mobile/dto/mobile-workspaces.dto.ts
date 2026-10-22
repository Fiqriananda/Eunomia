import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsOptional, IsEnum, IsEmail } from 'class-validator';
import { WorkspaceRole } from '@prisma/client';

export class MobileWorkspaceItemDto {
  @ApiProperty({ example: 'ws_123' })
  id: string;

  @ApiProperty({ example: 'Eunomia Team' })
  name: string;

  @ApiProperty({ example: 'eunomia-team' })
  slug: string;

  @ApiProperty({ example: 'OWNER', enum: WorkspaceRole })
  role: WorkspaceRole;

  @ApiProperty({ example: 8 })
  membersCount: number;

  @ApiProperty({ example: 4 })
  projectsCount: number;

  @ApiProperty({ example: true })
  cyclesEnabled: boolean;

  @ApiProperty({ example: true })
  isCurrent: boolean;

  @ApiProperty({ example: '2026-10-01T00:00:00.000Z' })
  createdAt: Date;
}

export class MobileWorkspaceListResponseDto {
  @ApiProperty({ type: () => [MobileWorkspaceItemDto] })
  items: MobileWorkspaceItemDto[];

  @ApiProperty({ example: 3 })
  total: number;
}

export class MobileCreateWorkspaceDto {
  @ApiProperty({ example: 'Acme Mobile Workspace', description: 'Name of the new workspace' })
  @IsNotEmpty()
  @IsString()
  name: string;
}

export class MobileWorkspaceMemberUserDto {
  @ApiProperty({ example: 'usr_123' })
  id: string;

  @ApiProperty({ example: 'Sarah Connor' })
  name: string;

  @ApiProperty({ example: 'sarah@linear.app' })
  email: string;

  @ApiPropertyOptional({ example: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330' })
  avatarUrl?: string | null;
}

export class MobileWorkspaceMemberDto {
  @ApiProperty({ example: 'mem_123' })
  id: string;

  @ApiProperty({ example: 'usr_123' })
  userId: string;

  @ApiProperty({ example: 'MEMBER', enum: WorkspaceRole })
  role: WorkspaceRole;

  @ApiProperty({ type: () => MobileWorkspaceMemberUserDto })
  user: MobileWorkspaceMemberUserDto;

  @ApiProperty({ example: 'offline', enum: ['online', 'offline', 'away'] })
  status: 'online' | 'offline' | 'away';

  @ApiProperty({ example: '2026-10-15T10:00:00.000Z' })
  createdAt: Date;
}

export class MobileInviteMemberDto {
  @ApiProperty({ example: 'colleague@company.com', description: 'Email address of member to invite' })
  @IsNotEmpty()
  @IsEmail()
  email: string;

  @ApiPropertyOptional({
    enum: WorkspaceRole,
    default: WorkspaceRole.MEMBER,
    description: 'Assigned role in workspace',
  })
  @IsOptional()
  @IsEnum(WorkspaceRole)
  role?: WorkspaceRole = WorkspaceRole.MEMBER;
}
