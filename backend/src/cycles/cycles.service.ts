import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { CreateCycleDto, UpdateCycleDto, RolloverCycleDto } from './dto/create-cycle.dto.js';
import { TaskStatus } from '@prisma/client';

@Injectable()
export class CyclesService {
  constructor(private prisma: PrismaService) {}

  async getCycles(workspaceId: string) {
    const cycles = await this.prisma.cycle.findMany({
      where: { workspaceId },
      include: {
        _count: {
          select: { tasks: true },
        },
      },
      orderBy: { number: 'desc' },
    });

    return Promise.all(
      cycles.map(async (cycle) => {
        const stats = await this.getCycleStats(cycle.id);
        return {
          ...cycle,
          stats,
        };
      }),
    );
  }

  async getActiveCycle(workspaceId: string) {
    const cycle = await this.prisma.cycle.findFirst({
      where: {
        workspaceId,
        status: 'ACTIVE',
      },
      orderBy: { number: 'desc' },
    });

    if (!cycle) {
      // Fallback to latest cycle
      const latest = await this.prisma.cycle.findFirst({
        where: { workspaceId },
        orderBy: { number: 'desc' },
      });
      if (!latest) return null;
      const stats = await this.getCycleStats(latest.id);
      return { ...latest, stats };
    }

    const stats = await this.getCycleStats(cycle.id);
    return { ...cycle, stats };
  }

  async getCycleById(id: string) {
    const cycle = await this.prisma.cycle.findUnique({
      where: { id },
      include: {
        tasks: {
          where: { isArchived: false },
          include: {
            assignee: { select: { id: true, name: true, avatarUrl: true } },
            project: { select: { id: true, name: true, key: true, color: true } },
          },
          orderBy: [{ priority: 'desc' }, { order: 'asc' }],
        },
      },
    });

    if (!cycle) {
      throw new NotFoundException(`Cycle with ID ${id} not found`);
    }

    const stats = await this.getCycleStats(id);
    return {
      ...cycle,
      stats,
    };
  }

  private async getCycleStats(cycleId: string) {
    const tasks = await this.prisma.task.findMany({
      where: { cycleId, isArchived: false },
      select: { status: true, estimate: true },
    });

    const totalTasks = tasks.length;
    const completedTasks = tasks.filter((t) => t.status === TaskStatus.DONE).length;
    const inProgressTasks = tasks.filter((t) => t.status === TaskStatus.IN_PROGRESS).length;
    const todoTasks = tasks.filter(
      (t) => t.status === TaskStatus.TODO || t.status === TaskStatus.BACKLOG,
    ).length;

    const totalPoints = tasks.reduce((sum, t) => sum + (t.estimate || 1), 0);
    const completedPoints = tasks
      .filter((t) => t.status === TaskStatus.DONE)
      .reduce((sum, t) => sum + (t.estimate || 1), 0);
    const remainingPoints = totalPoints - completedPoints;
    const completionPercentage = totalPoints > 0 ? Math.round((completedPoints / totalPoints) * 100) : 0;

    return {
      totalTasks,
      completedTasks,
      inProgressTasks,
      todoTasks,
      totalPoints,
      completedPoints,
      remainingPoints,
      completionPercentage,
    };
  }

  async createCycle(data: CreateCycleDto) {
    const lastCycle = await this.prisma.cycle.findFirst({
      where: { workspaceId: data.workspaceId },
      orderBy: { number: 'desc' },
    });

    const nextNumber = lastCycle ? lastCycle.number + 1 : 1;
    const name = data.name || `Cycle ${nextNumber}`;

    return this.prisma.cycle.create({
      data: {
        workspaceId: data.workspaceId,
        number: nextNumber,
        name,
        description: data.description,
        startDate: new Date(data.startDate),
        endDate: new Date(data.endDate),
        status: 'ACTIVE',
      },
    });
  }

  async updateCycle(id: string, data: UpdateCycleDto) {
    const cycle = await this.prisma.cycle.findUnique({ where: { id } });
    if (!cycle) throw new NotFoundException('Cycle not found');

    return this.prisma.cycle.update({
      where: { id },
      data: {
        name: data.name,
        description: data.description,
        status: data.status,
        startDate: data.startDate ? new Date(data.startDate) : undefined,
        endDate: data.endDate ? new Date(data.endDate) : undefined,
      },
    });
  }

  async rolloverCycle(cycleId: string, dto: RolloverCycleDto) {
    const cycle = await this.prisma.cycle.findUnique({ where: { id: cycleId } });
    if (!cycle) throw new NotFoundException('Cycle not found');

    // Incomplete tasks in this cycle
    const incompleteTasks = await this.prisma.task.findMany({
      where: {
        cycleId,
        status: { not: TaskStatus.DONE },
        isArchived: false,
      },
      select: { id: true },
    });

    const taskIds = incompleteTasks.map((t) => t.id);

    // Reassign incomplete tasks to targetCycle or null (backlog)
    await this.prisma.task.updateMany({
      where: { id: { in: taskIds } },
      data: {
        cycleId: dto.targetCycleId || null,
      },
    });

    // Mark current cycle as completed
    await this.prisma.cycle.update({
      where: { id: cycleId },
      data: { status: 'COMPLETED' },
    });

    return {
      message: `Rolled over ${taskIds.length} incomplete tasks`,
      rolledOverCount: taskIds.length,
      targetCycleId: dto.targetCycleId || null,
    };
  }
}
