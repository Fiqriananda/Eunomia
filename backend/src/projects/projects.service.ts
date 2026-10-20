import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';

@Injectable()
export class ProjectsService {
  constructor(private prisma: PrismaService) {}

  async getProjectsByWorkspace(workspaceId: string) {
    return this.prisma.project.findMany({
      where: { workspaceId },
      include: {
        _count: {
          select: { tasks: true },
        },
      },
      orderBy: { createdAt: 'asc' },
    });
  }

  async createProject(workspaceId: string, data: { name: string; key: string; description?: string; color?: string }) {
    return this.prisma.project.create({
      data: {
        name: data.name,
        key: data.key.toUpperCase(),
        description: data.description,
        color: data.color || '#6366f1',
        workspaceId,
      },
    });
  }

  async updateProject(
    id: string,
    data: { name?: string; key?: string; description?: string; color?: string },
  ) {
    const existing = await this.prisma.project.findUnique({
      where: { id },
      include: { tasks: true },
    });

    if (!existing) {
      throw new NotFoundException('Project not found');
    }

    const newKey = data.key ? data.key.trim().toUpperCase() : existing.key;
    const keyChanged = newKey !== existing.key;

    const updatedProject = await this.prisma.project.update({
      where: { id },
      data: {
        name: data.name !== undefined ? data.name : existing.name,
        key: newKey,
        description: data.description !== undefined ? data.description : existing.description,
        color: data.color !== undefined ? data.color : existing.color,
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
}
