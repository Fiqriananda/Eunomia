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
let ProjectsService = class ProjectsService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async getProjectsByWorkspace(workspaceId) {
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
    async createProject(workspaceId, data) {
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
    async updateProject(id, data) {
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
};
ProjectsService = __decorate([
    Injectable(),
    __metadata("design:paramtypes", [PrismaService])
], ProjectsService);
export { ProjectsService };
//# sourceMappingURL=projects.service.js.map