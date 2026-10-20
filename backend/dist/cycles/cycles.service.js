var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { TaskStatus } from '@prisma/client';
let CyclesService = class CyclesService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async getCycles(workspaceId) {
        const cycles = await this.prisma.cycle.findMany({
            where: { workspaceId },
            include: {
                _count: {
                    select: { tasks: true },
                },
            },
            orderBy: { number: 'desc' },
        });
        return Promise.all(cycles.map(async (cycle) => {
            const stats = await this.getCycleStats(cycle.id);
            return {
                ...cycle,
                stats,
            };
        }));
    }
    async getActiveCycle(workspaceId) {
        const cycle = await this.prisma.cycle.findFirst({
            where: {
                workspaceId,
                status: 'ACTIVE',
            },
            orderBy: { number: 'desc' },
        });
        if (!cycle) {
            const latest = await this.prisma.cycle.findFirst({
                where: { workspaceId },
                orderBy: { number: 'desc' },
            });
            if (!latest)
                return null;
            const stats = await this.getCycleStats(latest.id);
            return { ...latest, stats };
        }
        const stats = await this.getCycleStats(cycle.id);
        return { ...cycle, stats };
    }
    async getCycleById(id) {
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
    async getCycleStats(cycleId) {
        const tasks = await this.prisma.task.findMany({
            where: { cycleId, isArchived: false },
            select: { status: true, estimate: true },
        });
        const totalTasks = tasks.length;
        const completedTasks = tasks.filter((t) => t.status === TaskStatus.DONE).length;
        const inProgressTasks = tasks.filter((t) => t.status === TaskStatus.IN_PROGRESS).length;
        const todoTasks = tasks.filter((t) => t.status === TaskStatus.TODO || t.status === TaskStatus.BACKLOG).length;
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
    async createCycle(data) {
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
    async updateCycle(id, data) {
        const cycle = await this.prisma.cycle.findUnique({ where: { id } });
        if (!cycle)
            throw new NotFoundException('Cycle not found');
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
    async rolloverCycle(cycleId, dto) {
        const cycle = await this.prisma.cycle.findUnique({ where: { id: cycleId } });
        if (!cycle)
            throw new NotFoundException('Cycle not found');
        const incompleteTasks = await this.prisma.task.findMany({
            where: {
                cycleId,
                status: { not: TaskStatus.DONE },
                isArchived: false,
            },
            select: { id: true },
        });
        const taskIds = incompleteTasks.map((t) => t.id);
        await this.prisma.task.updateMany({
            where: { id: { in: taskIds } },
            data: {
                cycleId: dto.targetCycleId || null,
            },
        });
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
};
CyclesService = __decorate([
    Injectable(),
    __metadata("design:paramtypes", [PrismaService])
], CyclesService);
export { CyclesService };
//# sourceMappingURL=cycles.service.js.map