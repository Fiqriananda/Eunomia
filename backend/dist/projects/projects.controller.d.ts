import { ProjectsService } from './projects.service.js';
export declare class ProjectsController {
    private readonly projectsService;
    constructor(projectsService: ProjectsService);
    getProjects(workspaceId: string): Promise<({
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
    createProject(body: {
        workspaceId: string;
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
    updateProject(id: string, body: {
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
