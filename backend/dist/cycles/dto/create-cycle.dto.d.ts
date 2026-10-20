export declare class CreateCycleDto {
    workspaceId: string;
    name?: string;
    description?: string;
    startDate: string;
    endDate: string;
}
export declare class UpdateCycleDto {
    name?: string;
    description?: string;
    status?: string;
    startDate?: string;
    endDate?: string;
}
export declare class RolloverCycleDto {
    targetCycleId?: string;
}
