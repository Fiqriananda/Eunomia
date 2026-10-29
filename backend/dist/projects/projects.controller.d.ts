import { ProjectsService } from './projects.service.js';
export declare class ProjectsController {
    private readonly projectsService;
    constructor(projectsService: ProjectsService);
    getProjects(workspaceId: string): Promise<({
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
    createProject(body: {
        workspaceId: string;
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
    updateProject(id: string, body: {
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
