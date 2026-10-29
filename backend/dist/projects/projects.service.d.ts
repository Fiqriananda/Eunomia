import { PrismaService } from '../prisma/prisma.service.js';
export declare class ProjectsService {
    private prisma;
    constructor(prisma: PrismaService);
    getProjectsByWorkspace(workspaceId: string): Promise<({
        _count: {
            tasks: number;
        };
    } & {
        description: string | null;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        key: string;
        color: string | null;
        workspaceId: string;
    })[]>;
    createProject(workspaceId: string, data: {
        name: string;
        key: string;
        description?: string;
        color?: string;
    }): Promise<{
        description: string | null;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        key: string;
        color: string | null;
        workspaceId: string;
    }>;
    updateProject(id: string, data: {
        name?: string;
        key?: string;
        description?: string;
        color?: string;
    }): Promise<{
        description: string | null;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        key: string;
        color: string | null;
        workspaceId: string;
    }>;
}
