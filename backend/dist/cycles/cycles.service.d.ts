import { PrismaService } from '../prisma/prisma.service.js';
import { CreateCycleDto, UpdateCycleDto, RolloverCycleDto } from './dto/create-cycle.dto.js';
export declare class CyclesService {
    private prisma;
    constructor(prisma: PrismaService);
    getCycles(workspaceId: string): Promise<{
        stats: {
            totalTasks: number;
            completedTasks: number;
            inProgressTasks: number;
            todoTasks: number;
            totalPoints: number;
            completedPoints: number;
            remainingPoints: number;
            completionPercentage: number;
        };
        _count: {
            tasks: number;
        };
        number: number;
        description: string | null;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        name: string | null;
        workspaceId: string;
        status: string;
        startDate: Date;
        endDate: Date;
    }[]>;
    getActiveCycle(workspaceId: string): Promise<{
        stats: {
            totalTasks: number;
            completedTasks: number;
            inProgressTasks: number;
            todoTasks: number;
            totalPoints: number;
            completedPoints: number;
            remainingPoints: number;
            completionPercentage: number;
        };
        number: number;
        description: string | null;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        name: string | null;
        workspaceId: string;
        status: string;
        startDate: Date;
        endDate: Date;
    } | null>;
    getCycleById(id: string): Promise<{
        stats: {
            totalTasks: number;
            completedTasks: number;
            inProgressTasks: number;
            todoTasks: number;
            totalPoints: number;
            completedPoints: number;
            remainingPoints: number;
            completionPercentage: number;
        };
        tasks: ({
            project: {
                id: string;
                name: string;
                key: string;
                color: string | null;
            };
            assignee: {
                id: string;
                name: string;
                avatarUrl: string | null;
            } | null;
        } & {
            description: string | null;
            title: string;
            id: string;
            createdAt: Date;
            updatedAt: Date;
            priority: import("@prisma/client").$Enums.TaskPriority;
            identifier: string;
            assigneeId: string | null;
            workspaceId: string;
            status: import("@prisma/client").$Enums.TaskStatus;
            order: number;
            customStatus: string | null;
            dueDate: Date | null;
            labels: string[];
            estimate: number | null;
            isArchived: boolean;
            deletedAt: Date | null;
            triageStatus: import("@prisma/client").$Enums.TriageStatus | null;
            externalMetadata: import("@prisma/client/runtime/library").JsonValue | null;
            projectId: string;
            cycleId: string | null;
            creatorId: string;
            requesterDivisionId: string | null;
            assignedDivisionId: string | null;
            parentId: string | null;
        })[];
        number: number;
        description: string | null;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        name: string | null;
        workspaceId: string;
        status: string;
        startDate: Date;
        endDate: Date;
    }>;
    private getCycleStats;
    createCycle(data: CreateCycleDto): Promise<{
        number: number;
        description: string | null;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        name: string | null;
        workspaceId: string;
        status: string;
        startDate: Date;
        endDate: Date;
    }>;
    updateCycle(id: string, data: UpdateCycleDto): Promise<{
        number: number;
        description: string | null;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        name: string | null;
        workspaceId: string;
        status: string;
        startDate: Date;
        endDate: Date;
    }>;
    rolloverCycle(cycleId: string, dto: RolloverCycleDto): Promise<{
        message: string;
        rolledOverCount: number;
        targetCycleId: string | null;
    }>;
}
