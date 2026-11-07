import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';

@Injectable()
export class ProjectsService {
  constructor(private prisma: PrismaService) {}

  async getProjectsByWorkspace(workspaceId: string) {
    return this.prisma.project.findMany({
      where: { workspaceId },
      include: {
        lead: {
          select: { id: true, name: true, email: true, avatarUrl: true },
        },
        _count: {
          select: { tasks: true },
        },
        tasks: {
          select: {
            id: true,
            identifier: true,
            title: true,
            status: true,
            priority: true,
            estimate: true,
            isArchived: true,
            dueDate: true,
            assignee: {
              select: { id: true, name: true, avatarUrl: true },
            },
          },
          orderBy: { createdAt: 'desc' },
        },
      },
      orderBy: { createdAt: 'asc' },
    });
  }

  async getProjectById(id: string) {
    const project = await this.prisma.project.findUnique({
      where: { id },
      include: {
        lead: {
          select: { id: true, name: true, email: true, avatarUrl: true },
        },
        _count: {
          select: { tasks: true },
        },
        tasks: {
          include: {
            assignee: { select: { id: true, name: true, email: true, avatarUrl: true } },
            cycle: { select: { id: true, name: true, number: true, status: true } },
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!project) {
      throw new NotFoundException('Project not found');
    }

    return project;
  }

  async createProject(
    workspaceId: string,
    data: {
      name: string;
      key?: string;
      description?: string;
      color?: string;
      status?: string;
      targetDate?: string;
      leadId?: string;
    },
  ) {
    // Auto-generate key if not explicitly given
    let key = data.key?.trim().toUpperCase();
    if (!key) {
      const words = data.name.trim().split(/\s+/).filter(Boolean);
      if (words.length >= 2) {
        key = words.map((w) => w[0]).join('').substring(0, 4).toUpperCase();
      } else {
        key = data.name.substring(0, 3).toUpperCase();
      }
    }
    key = key.replace(/[^A-Z0-9]/g, '');
    if (!key) key = 'PRJ';

    // Ensure key uniqueness in workspace
    let uniqueKey = key;
    let counter = 1;
    while (
      await this.prisma.project.findUnique({
        where: { workspaceId_key: { workspaceId, key: uniqueKey } },
      })
    ) {
      uniqueKey = `${key}${counter}`;
      counter++;
    }

    return this.prisma.project.create({
      data: {
        name: data.name.trim(),
        key: uniqueKey,
        description: data.description?.trim() || null,
        color: data.color || '#6366f1',
        status: data.status || 'IN_PROGRESS',
        targetDate: data.targetDate ? new Date(data.targetDate) : null,
        leadId: data.leadId || null,
        workspaceId,
      },
      include: {
        lead: {
          select: { id: true, name: true, email: true, avatarUrl: true },
        },
        _count: {
          select: { tasks: true },
        },
        tasks: true,
      },
    });
  }

  async updateProject(
    id: string,
    data: {
      name?: string;
      key?: string;
      description?: string;
      color?: string;
      status?: string;
      targetDate?: string | null;
      leadId?: string | null;
    },
  ) {
    const existing = await this.prisma.project.findUnique({
      where: { id },
      include: { tasks: true },
    });

    if (!existing) {
      throw new NotFoundException('Project not found');
    }

    let newKey = existing.key;
    if (data.key) {
      const cleaned = data.key.trim().toUpperCase().replace(/[^A-Z0-9]/g, '');
      if (cleaned && cleaned !== existing.key) {
        const duplicate = await this.prisma.project.findUnique({
          where: { workspaceId_key: { workspaceId: existing.workspaceId, key: cleaned } },
        });
        if (duplicate && duplicate.id !== id) {
          throw new BadRequestException(`Project key "${cleaned}" already in use`);
        }
        newKey = cleaned;
      }
    }
    const keyChanged = newKey !== existing.key;

    const updatedProject = await this.prisma.project.update({
      where: { id },
      data: {
        name: data.name !== undefined ? data.name.trim() : existing.name,
        key: newKey,
        description: data.description !== undefined ? data.description : existing.description,
        color: data.color !== undefined ? data.color : existing.color,
        status: data.status !== undefined ? data.status : existing.status,
        targetDate:
          data.targetDate !== undefined
            ? data.targetDate
              ? new Date(data.targetDate)
              : null
            : existing.targetDate,
        leadId: data.leadId !== undefined ? data.leadId : existing.leadId,
      },
      include: {
        lead: {
          select: { id: true, name: true, email: true, avatarUrl: true },
        },
        _count: {
          select: { tasks: true },
        },
        tasks: true,
      },
    });

    // If key changed, update all existing tasks under this project to match the new prefix
    if (keyChanged && existing.tasks.length > 0) {
      for (const t of existing.tasks) {
        let suffix = '1';
        const match = t.identifier.match(/-(\d+)$/);
        if (match) {
          suffix = match[1];
        }
        const newIdentifier = `${newKey}-${suffix}`;
        await this.prisma.task.update({
          where: { id: t.id },
          data: { identifier: newIdentifier },
        });
      }
    }

    return updatedProject;
  }

  async deleteProject(id: string) {
    const existing = await this.prisma.project.findUnique({
      where: { id },
      include: {
        _count: { select: { tasks: true } },
      },
    });

    if (!existing) {
      throw new NotFoundException('Project not found');
    }

    return this.prisma.project.delete({
      where: { id },
    });
  }
}

