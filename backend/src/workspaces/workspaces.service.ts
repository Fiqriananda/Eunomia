import { Injectable, NotFoundException, ForbiddenException, ConflictException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { WorkspaceRole, InvitationStatus } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import { randomUUID } from 'crypto';
import { EmailService } from '../email/email.service.js';
import { EventsGateway } from '../events/events.gateway.js';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class WorkspacesService {
  constructor(
    private prisma: PrismaService,
    private emailService: EmailService,
    private eventsGateway: EventsGateway,
    private jwtService: JwtService,
  ) {}

  async getUserWorkspaces(userId: string) {
    const memberships = await this.prisma.workspaceMember.findMany({
      where: { userId },
      include: {
        workspace: {
          include: {
            projects: true,
            members: {
              include: {
                user: {
                  select: { id: true, name: true, email: true, avatarUrl: true },
                },
              },
            },
          },
        },
      },
    });

    return memberships.map((m) => ({
      ...m.workspace,
      role: m.role,
    }));
  }

  async getWorkspaceById(workspaceId: string, userId: string) {
    const membership = await this.prisma.workspaceMember.findUnique({
      where: {
        workspaceId_userId: {
          workspaceId,
          userId,
        },
      },
      include: {
        workspace: {
          include: {
            projects: true,
            divisions: {
              include: {
                members: {
                  include: {
                    user: {
                      select: { id: true, name: true, email: true, avatarUrl: true },
                    },
                  },
                },
              },
              orderBy: [{ isTechnical: 'desc' }, { name: 'asc' }],
            },
            members: {
              include: {
                user: {
                  select: { id: true, name: true, email: true, avatarUrl: true },
                },
              },
            },
          },
        },
      },
    });

    if (!membership) {
      throw new ForbiddenException('You do not have access to this workspace');
    }

    if (!membership.workspace.divisions || membership.workspace.divisions.length === 0) {
      await this.ensureDefaultDivisions(workspaceId);
      const updatedDivisions = await this.prisma.division.findMany({
        where: { workspaceId },
        include: {
          members: {
            include: {
              user: {
                select: { id: true, name: true, email: true, avatarUrl: true },
              },
            },
          },
        },
        orderBy: [{ isTechnical: 'desc' }, { name: 'asc' }],
      });
      membership.workspace.divisions = updatedDivisions;
    }

    return {
      ...membership.workspace,
      role: membership.role,
    };
  }

  async createWorkspace(userId: string, data: { name: string }) {
    const slug = `${data.name.toLowerCase().replace(/[^a-z0-9]/g, '')}-${Date.now().toString(36)}`;
    return this.prisma.workspace.create({
      data: {
        name: data.name,
        slug,
        members: {
          create: {
            userId,
            role: 'OWNER',
          },
        },
        projects: {
          create: {
            name: 'General',
            key: data.name.substring(0, 3).toUpperCase() || 'GEN',
            description: 'Default project',
          },
        },
      },
      include: {
        projects: true,
      },
    });
  }

  async inviteMember(
    workspaceId: string,
    currentUserId: string,
    data: { email: string; name?: string; role?: WorkspaceRole },
  ) {
    const email = data.email.toLowerCase().trim();
    const name = data.name?.trim() || email.split('@')[0];
    const role = data.role || WorkspaceRole.MEMBER;

    // Check workspace existence
    const workspace = await this.prisma.workspace.findUnique({
      where: { id: workspaceId },
    });
    if (!workspace) {
      throw new NotFoundException('Workspace not found');
    }

    // 1. Enforce that only OWNER or ADMIN can invite
    const currentMembership = await this.prisma.workspaceMember.findUnique({
      where: {
        workspaceId_userId: {
          workspaceId,
          userId: currentUserId,
        },
      },
    });

    if (!currentMembership || (currentMembership.role !== WorkspaceRole.OWNER && currentMembership.role !== WorkspaceRole.ADMIN)) {
      throw new ForbiddenException('Only workspace owners and admins can invite new members');
    }

    // 2. Check if already an active member of this workspace
    const existingMember = await this.prisma.workspaceMember.findFirst({
      where: {
        workspaceId,
        user: { email },
      },
      include: {
        user: { select: { id: true, name: true, email: true, avatarUrl: true } },
      },
    });

    if (existingMember) {
      throw new ConflictException('This user is already an active member of this workspace');
    }

    // 3. Find or register user placeholder
    let targetUser = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!targetUser) {
      const defaultPassword = await bcrypt.hash('password123', 10);
      targetUser = await this.prisma.user.create({
        data: {
          email,
          name,
          password: defaultPassword,
          avatarUrl: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(name)}`,
        },
      });
    }

    // 4. Create or update pending WorkspaceInvitation
    const token = randomUUID();
    const invitation = await this.prisma.workspaceInvitation.upsert({
      where: {
        workspaceId_email: {
          workspaceId,
          email,
        },
      },
      update: {
        role,
        status: InvitationStatus.PENDING,
        token,
        invitedById: currentUserId,
      },
      create: {
        workspaceId,
        email,
        role,
        status: InvitationStatus.PENDING,
        token,
        invitedById: currentUserId,
      },
      include: {
        workspace: {
          select: { id: true, name: true, slug: true },
        },
        invitedBy: {
          select: { id: true, name: true, email: true, avatarUrl: true },
        },
      },
    });

    // 5. Create Inbox Notification for the invited user
    if (targetUser) {
      const inviter = await this.prisma.user.findUnique({
        where: { id: currentUserId },
        select: { name: true },
      });

      const notif = await this.prisma.inboxNotification.create({
        data: {
          type: 'WORKSPACE_INVITATION',
          title: `Invitation to join ${workspace.name}`,
          body: `${inviter?.name || 'A team manager'} invited you to join ${workspace.name} as ${role}. Accept to collaborate with the team.`,
          userId: targetUser.id,
          actorId: currentUserId,
          workspaceId: workspace.id,
          invitationId: invitation.id,
        },
        include: {
          actor: { select: { id: true, name: true, email: true, avatarUrl: true } },
          workspace: { select: { id: true, name: true, slug: true } },
          invitation: { select: { id: true, token: true, role: true, status: true } },
        },
      });

      // Broadcast live notification via websocket
      this.eventsGateway.emitNotification(targetUser.id, notif);
    }

    // 6. Send Invitation Email via EmailService
    const inviter = await this.prisma.user.findUnique({
      where: { id: currentUserId },
      select: { name: true },
    });

    this.emailService
      .sendWorkspaceInvitationEmail({
        recipientEmail: email,
        recipientName: name,
        actorName: inviter?.name || 'A team manager',
        workspaceName: workspace.name,
        role,
        token: invitation.token,
      })
      .catch((err) => console.error('Failed to send invite email:', err));

    return {
      message: 'Invitation sent successfully. The recipient must accept via email or inbox.',
      invitation,
    };
  }

  async getWorkspaceMembers(workspaceId: string) {
    return this.prisma.workspaceMember.findMany({
      where: { workspaceId },
      include: {
        user: {
          select: { id: true, name: true, email: true, avatarUrl: true },
        },
      },
      orderBy: { createdAt: 'asc' },
    });
  }

  async getWorkspaceSections(workspaceId: string) {
    return this.prisma.workflowSection.findMany({
      where: { workspaceId },
      orderBy: { order: 'asc' },
    });
  }

  async createWorkspaceSection(
    workspaceId: string,
    data: { name: string; key?: string; color?: string; category?: any },
  ) {
    const rawKey = data.key || data.name.toUpperCase().replace(/[^A-Z0-9]/g, '_');
    const key = rawKey.trim().toUpperCase() || `SECTION_${Date.now()}`;

    // Get highest order
    const lastSection = await this.prisma.workflowSection.findFirst({
      where: { workspaceId },
      orderBy: { order: 'desc' },
    });
    const order = lastSection ? lastSection.order + 1000 : 1000;

    return this.prisma.workflowSection.create({
      data: {
        workspaceId,
        name: data.name.trim(),
        key,
        color: data.color || '#8b5cf6',
        category: data.category || 'IN_PROGRESS',
        order,
      },
    });
  }

  async deleteWorkspaceSection(workspaceId: string, sectionId: string) {
    const section = await this.prisma.workflowSection.findUnique({
      where: { id: sectionId },
    });
    if (!section || section.workspaceId !== workspaceId) {
      throw new NotFoundException('Section not found');
    }

    // Reset any tasks with this customStatus to the base category
    await this.prisma.task.updateMany({
      where: { workspaceId, customStatus: section.key },
      data: { customStatus: null, status: section.category },
    });

    return this.prisma.workflowSection.delete({
      where: { id: sectionId },
    });
  }

  async updateColumnOrder(workspaceId: string, columnOrder: string[]) {
    return this.prisma.workspace.update({
      where: { id: workspaceId },
      data: { columnOrder },
    });
  }

  async updateWorkspace(
    workspaceId: string,
    userId: string,
    data: { name?: string; cyclesEnabled?: boolean; logoUrl?: string | null },
  ) {
    const membership = await this.prisma.workspaceMember.findUnique({
      where: {
        workspaceId_userId: {
          workspaceId,
          userId,
        },
      },
    });

    if (!membership) {
      throw new ForbiddenException('You are not a member of this workspace');
    }

    if (membership.role !== 'OWNER' && membership.role !== 'ADMIN') {
      throw new ForbiddenException('Only workspace owners or admins can update workspace settings');
    }

    const updateData: any = {};
    if (data.name !== undefined) updateData.name = data.name.trim();
    if (data.cyclesEnabled !== undefined) updateData.cyclesEnabled = data.cyclesEnabled;
    if (data.logoUrl !== undefined) updateData.logoUrl = data.logoUrl;

    const updated = await this.prisma.workspace.update({
      where: { id: workspaceId },
      data: updateData,
      include: {
        projects: true,
        members: {
          include: {
            user: {
              select: { id: true, name: true, email: true, avatarUrl: true },
            },
          },
        },
      },
    });

    return {
      ...updated,
      role: membership.role,
    };
  }

  async updateMemberRole(workspaceId: string, memberId: string, role: WorkspaceRole) {
    const member = await this.prisma.workspaceMember.findUnique({
      where: { id: memberId },
    });
    if (!member || member.workspaceId !== workspaceId) {
      throw new NotFoundException('Member not found in workspace');
    }
    return this.prisma.workspaceMember.update({
      where: { id: memberId },
      data: { role },
      include: {
        user: {
          select: { id: true, name: true, email: true, avatarUrl: true },
        },
      },
    });
  }

  async removeMember(workspaceId: string, memberId: string) {
    const member = await this.prisma.workspaceMember.findUnique({
      where: { id: memberId },
    });
    if (!member || member.workspaceId !== workspaceId) {
      throw new NotFoundException('Member not found in workspace');
    }
    if (member.role === WorkspaceRole.OWNER) {
      throw new BadRequestException('Cannot remove the workspace owner');
    }
    await this.prisma.workspaceMember.delete({
      where: { id: memberId },
    });
    return { success: true, message: 'Member removed from workspace' };
  }

  async getWorkspaceInvitations(workspaceId: string, currentUserId: string) {
    const membership = await this.prisma.workspaceMember.findUnique({
      where: {
        workspaceId_userId: {
          workspaceId,
          userId: currentUserId,
        },
      },
    });
    if (!membership || (membership.role !== WorkspaceRole.OWNER && membership.role !== WorkspaceRole.ADMIN)) {
      throw new ForbiddenException('Only workspace owners and admins can view pending invitations');
    }

    return this.prisma.workspaceInvitation.findMany({
      where: {
        workspaceId,
        status: InvitationStatus.PENDING,
      },
      include: {
        invitedBy: {
          select: { id: true, name: true, email: true, avatarUrl: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async cancelInvitation(workspaceId: string, invitationId: string, currentUserId: string) {
    const membership = await this.prisma.workspaceMember.findUnique({
      where: {
        workspaceId_userId: {
          workspaceId,
          userId: currentUserId,
        },
      },
    });
    if (!membership || (membership.role !== WorkspaceRole.OWNER && membership.role !== WorkspaceRole.ADMIN)) {
      throw new ForbiddenException('Only workspace owners and admins can cancel invitations');
    }

    const invitation = await this.prisma.workspaceInvitation.findUnique({
      where: { id: invitationId },
    });
    if (!invitation || invitation.workspaceId !== workspaceId) {
      throw new NotFoundException('Invitation not found');
    }

    await this.prisma.workspaceInvitation.delete({
      where: { id: invitationId },
    });

    return { success: true, message: 'Invitation canceled' };
  }

  async getInvitationByToken(token: string) {
    const invitation = await this.prisma.workspaceInvitation.findUnique({
      where: { token },
      include: {
        workspace: {
          select: { id: true, name: true, slug: true },
        },
        invitedBy: {
          select: { id: true, name: true, email: true, avatarUrl: true },
        },
      },
    });
    if (!invitation) {
      throw new NotFoundException('Invitation not found or has expired');
    }
    return invitation;
  }

  async acceptInvitation(tokenOrId: string, currentUserId: string) {
    const invitation = await this.prisma.workspaceInvitation.findFirst({
      where: {
        OR: [{ token: tokenOrId }, { id: tokenOrId }],
      },
      include: {
        workspace: true,
      },
    });

    if (!invitation) {
      throw new NotFoundException('Invitation not found or has expired');
    }

    if (invitation.status !== InvitationStatus.PENDING) {
      throw new BadRequestException(`Invitation has already been ${invitation.status.toLowerCase()}`);
    }

    const currentUser = await this.prisma.user.findUnique({
      where: { id: currentUserId },
    });
    if (!currentUser) {
      throw new NotFoundException('User not found');
    }

    if (currentUser.email.toLowerCase() !== invitation.email.toLowerCase()) {
      throw new ForbiddenException(
        `This invitation was sent to ${invitation.email}. You are logged in as ${currentUser.email}.`,
      );
    }

    // Add user as WorkspaceMember (or update role if existing)
    const membership = await this.prisma.workspaceMember.upsert({
      where: {
        workspaceId_userId: {
          workspaceId: invitation.workspaceId,
          userId: currentUserId,
        },
      },
      update: {
        role: invitation.role,
      },
      create: {
        workspaceId: invitation.workspaceId,
        userId: currentUserId,
        role: invitation.role,
      },
      include: {
        user: { select: { id: true, name: true, email: true, avatarUrl: true } },
      },
    });

    // Update invitation status to ACCEPTED
    await this.prisma.workspaceInvitation.update({
      where: { id: invitation.id },
      data: { status: InvitationStatus.ACCEPTED },
    });

    // Mark related inbox notification as read
    await this.prisma.inboxNotification.updateMany({
      where: { invitationId: invitation.id },
      data: { isRead: true, readAt: new Date() },
    });

    return {
      success: true,
      message: `You have successfully joined ${invitation.workspace.name}!`,
      workspace: invitation.workspace,
      membership,
    };
  }

  async declineInvitation(tokenOrId: string, currentUserId: string) {
    const invitation = await this.prisma.workspaceInvitation.findFirst({
      where: {
        OR: [{ token: tokenOrId }, { id: tokenOrId }],
      },
    });

    if (!invitation) {
      throw new NotFoundException('Invitation not found');
    }

    const currentUser = await this.prisma.user.findUnique({
      where: { id: currentUserId },
    });
    if (currentUser && currentUser.email.toLowerCase() !== invitation.email.toLowerCase()) {
      throw new ForbiddenException('You are not authorized to decline this invitation');
    }

    await this.prisma.workspaceInvitation.update({
      where: { id: invitation.id },
      data: { status: InvitationStatus.DECLINED },
    });

    await this.prisma.inboxNotification.updateMany({
      where: { invitationId: invitation.id },
      data: { isRead: true, readAt: new Date() },
    });

    return {
      success: true,
      message: 'Invitation declined',
    };
  }

  async acceptInvitationPublic(token: string, data?: { name?: string; password?: string }) {
    const invitation = await this.prisma.workspaceInvitation.findUnique({
      where: { token },
      include: { workspace: true },
    });

    if (!invitation) {
      throw new NotFoundException('Invitation not found or has expired');
    }

    if (invitation.status !== InvitationStatus.PENDING) {
      throw new BadRequestException(`Invitation has already been ${invitation.status.toLowerCase()}`);
    }

    let user = await this.prisma.user.findUnique({
      where: { email: invitation.email.toLowerCase() },
    });

    const hashedPassword = data?.password ? await bcrypt.hash(data.password, 10) : undefined;
    const userName = data?.name?.trim() || invitation.email.split('@')[0];

    if (!user) {
      user = await this.prisma.user.create({
        data: {
          email: invitation.email.toLowerCase(),
          name: userName,
          password: hashedPassword || (await bcrypt.hash('password123', 10)),
          avatarUrl: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(userName)}`,
        },
      });
    } else {
      const updateData: any = {};
      if (hashedPassword) updateData.password = hashedPassword;
      if (data?.name?.trim()) updateData.name = data.name.trim();

      if (Object.keys(updateData).length > 0) {
        user = await this.prisma.user.update({
          where: { id: user.id },
          data: updateData,
        });
      }
    }

    // Add user as WorkspaceMember
    const membership = await this.prisma.workspaceMember.upsert({
      where: {
        workspaceId_userId: {
          workspaceId: invitation.workspaceId,
          userId: user.id,
        },
      },
      update: {
        role: invitation.role,
      },
      create: {
        workspaceId: invitation.workspaceId,
        userId: user.id,
        role: invitation.role,
      },
      include: {
        user: { select: { id: true, name: true, email: true, avatarUrl: true } },
      },
    });

    // Mark invitation accepted
    await this.prisma.workspaceInvitation.update({
      where: { id: invitation.id },
      data: { status: InvitationStatus.ACCEPTED },
    });

    // Mark related inbox notification as read
    await this.prisma.inboxNotification.updateMany({
      where: { invitationId: invitation.id },
      data: { isRead: true, readAt: new Date() },
    });

    // Generate JWT Access Token so the user is instantly logged in
    const accessToken = this.jwtService.sign({ sub: user.id, email: user.email });

    return {
      success: true,
      message: `You have successfully joined ${invitation.workspace.name}!`,
      accessToken,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        avatarUrl: user.avatarUrl,
      },
      workspace: invitation.workspace,
      membership,
    };
  }

  // --- Division / Teams Management ---

  async ensureDefaultDivisions(workspaceId: string) {
    const existing = await this.prisma.division.count({ where: { workspaceId } });
    if (existing > 0) return;

    const defaults = [
      { name: 'Core Tech & Dev', slug: 'core-dev', isTechnical: true, description: 'Engineering, software development, and technical backlog' },
      { name: 'Event & Operational', slug: 'event-ops', isTechnical: false, description: 'Event planning, workshop logistics, and equipment' },
      { name: 'PR & Media', slug: 'pr-media', isTechnical: false, description: 'Creative branding, publication, and external relations' },
      { name: 'Human Resources (HR)', slug: 'hr', isTechnical: false, description: 'Talent recruitment, internal affairs, and member growth' },
    ];

    for (const d of defaults) {
      await this.prisma.division.create({
        data: {
          ...d,
          workspaceId,
        },
      });
    }
  }

  async getWorkspaceDivisions(workspaceId: string) {
    await this.ensureDefaultDivisions(workspaceId);
    return this.prisma.division.findMany({
      where: { workspaceId },
      include: {
        members: {
          include: {
            user: { select: { id: true, name: true, email: true, avatarUrl: true } },
          },
        },
        _count: {
          select: {
            requestedTasks: true,
            assignedTasks: true,
          },
        },
      },
      orderBy: [{ isTechnical: 'desc' }, { name: 'asc' }],
    });
  }

  async createDivision(
    workspaceId: string,
    userId: string,
    data: { name: string; slug?: string; description?: string; isTechnical?: boolean },
  ) {
    const membership = await this.prisma.workspaceMember.findUnique({
      where: { workspaceId_userId: { workspaceId, userId } },
    });
    if (!membership || (membership.role !== WorkspaceRole.OWNER && membership.role !== WorkspaceRole.ADMIN)) {
      throw new ForbiddenException('Only workspace admins or owners can create divisions');
    }

    const baseSlug = (data.slug || data.name).toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-');
    const slug = `${baseSlug}-${Date.now().toString(36)}`;
    return this.prisma.division.create({
      data: {
        name: data.name,
        slug,
        description: data.description,
        isTechnical: data.isTechnical ?? false,
        workspaceId,
      },
      include: {
        members: {
          include: {
            user: { select: { id: true, name: true, email: true, avatarUrl: true } },
          },
        },
      },
    });
  }

  async updateDivision(
    divisionId: string,
    userId: string,
    data: { name?: string; slug?: string; description?: string; isTechnical?: boolean },
  ) {
    const division = await this.prisma.division.findUnique({ where: { id: divisionId } });
    if (!division) throw new NotFoundException('Division not found');

    const membership = await this.prisma.workspaceMember.findUnique({
      where: { workspaceId_userId: { workspaceId: division.workspaceId, userId } },
    });
    if (!membership || (membership.role !== WorkspaceRole.OWNER && membership.role !== WorkspaceRole.ADMIN)) {
      throw new ForbiddenException('Only workspace admins or owners can update divisions');
    }

    return this.prisma.division.update({
      where: { id: divisionId },
      data,
      include: {
        members: {
          include: {
            user: { select: { id: true, name: true, email: true, avatarUrl: true } },
          },
        },
      },
    });
  }

  async deleteDivision(divisionId: string, userId: string) {
    const division = await this.prisma.division.findUnique({ where: { id: divisionId } });
    if (!division) throw new NotFoundException('Division not found');

    const membership = await this.prisma.workspaceMember.findUnique({
      where: { workspaceId_userId: { workspaceId: division.workspaceId, userId } },
    });
    if (!membership || (membership.role !== WorkspaceRole.OWNER && membership.role !== WorkspaceRole.ADMIN)) {
      throw new ForbiddenException('Only workspace admins or owners can delete divisions');
    }

    return this.prisma.division.delete({ where: { id: divisionId } });
  }

  async addDivisionMember(
    divisionId: string,
    userId: string,
    targetUserId: string,
    role: string = 'MEMBER',
  ) {
    const division = await this.prisma.division.findUnique({ where: { id: divisionId } });
    if (!division) throw new NotFoundException('Division not found');

    const membership = await this.prisma.workspaceMember.findUnique({
      where: { workspaceId_userId: { workspaceId: division.workspaceId, userId } },
    });
    if (!membership || (membership.role !== WorkspaceRole.OWNER && membership.role !== WorkspaceRole.ADMIN)) {
      throw new ForbiddenException('Only workspace admins or owners can assign division members');
    }

    return this.prisma.divisionMember.upsert({
      where: { divisionId_userId: { divisionId, userId: targetUserId } },
      create: { divisionId, userId: targetUserId, role },
      update: { role },
      include: {
        user: { select: { id: true, name: true, email: true, avatarUrl: true } },
        division: true,
      },
    });
  }

  async removeDivisionMember(divisionId: string, userId: string, targetUserId: string) {
    const division = await this.prisma.division.findUnique({ where: { id: divisionId } });
    if (!division) throw new NotFoundException('Division not found');

    const membership = await this.prisma.workspaceMember.findUnique({
      where: { workspaceId_userId: { workspaceId: division.workspaceId, userId } },
    });
    if (!membership || (membership.role !== WorkspaceRole.OWNER && membership.role !== WorkspaceRole.ADMIN)) {
      throw new ForbiddenException('Only workspace admins or owners can remove division members');
    }

    return this.prisma.divisionMember.delete({
      where: { divisionId_userId: { divisionId, userId: targetUserId } },
    });
  }
}
