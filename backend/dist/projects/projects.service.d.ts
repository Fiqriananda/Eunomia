import { PrismaService } from '../prisma/prisma.service.js';
export declare class ProjectsService {
    private prisma;
    constructor(prisma: PrismaService);
    getProjectsByWorkspace(workspaceId: string): Promise<({
        _count: {
            tasks: number;
        };
    } & {
        id: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        key: string;
        description: string | null;
        color: string | null;
        workspaceId: string;
    })[]>;
    createProject(workspaceId: string, data: {
        name: string;
        key: string;
        description?: string;
        color?: string;
    }): Promise<{
        id: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        key: string;
        description: string | null;
        color: string | null;
        workspaceId: string;
    }>;
    updateProject(id: string, data: {
        name?: string;
        key?: string;
        description?: string;
        color?: string;
    }): Promise<{
        id: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        key: string;
        description: string | null;
        color: string | null;
        workspaceId: string;
    }>;
}
