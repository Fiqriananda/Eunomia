var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsEnum, IsNumber, Min, Max, IsArray, IsNotEmpty, } from 'class-validator';
import { Type } from 'class-transformer';
import { TaskStatus, TaskPriority } from '@prisma/client';
import { MobileCompactTaskDto } from './mobile-home.dto.js';
export var MobileTaskFilter;
(function (MobileTaskFilter) {
    MobileTaskFilter["ASSIGNED_TO_ME"] = "assigned_to_me";
    MobileTaskFilter["CREATED_BY_ME"] = "created_by_me";
    MobileTaskFilter["ALL"] = "all";
})(MobileTaskFilter || (MobileTaskFilter = {}));
export class MobileTasksQueryDto {
    workspaceId;
    projectId;
    filter;
    status;
    priority;
    search;
    page = 1;
    limit = 20;
}
__decorate([
    ApiPropertyOptional({
        description: 'Workspace ID (defaults to user primary workspace)',
    }),
    IsOptional(),
    IsString(),
    __metadata("design:type", String)
], MobileTasksQueryDto.prototype, "workspaceId", void 0);
__decorate([
    ApiPropertyOptional({
        description: 'Filter by specific Project ID',
    }),
    IsOptional(),
    IsString(),
    __metadata("design:type", String)
], MobileTasksQueryDto.prototype, "projectId", void 0);
__decorate([
    ApiPropertyOptional({
        enum: MobileTaskFilter,
        default: MobileTaskFilter.ASSIGNED_TO_ME,
        description: 'Filter scope: assigned_to_me, created_by_me, or all',
    }),
    IsOptional(),
    IsEnum(MobileTaskFilter),
    __metadata("design:type", String)
], MobileTasksQueryDto.prototype, "filter", void 0);
__decorate([
    ApiPropertyOptional({
        enum: TaskStatus,
        description: 'Filter by task status',
    }),
    IsOptional(),
    IsEnum(TaskStatus),
    __metadata("design:type", String)
], MobileTasksQueryDto.prototype, "status", void 0);
__decorate([
    ApiPropertyOptional({
        enum: TaskPriority,
        description: 'Filter by task priority',
    }),
    IsOptional(),
    IsEnum(TaskPriority),
    __metadata("design:type", String)
], MobileTasksQueryDto.prototype, "priority", void 0);
__decorate([
    ApiPropertyOptional({
        description: 'Search keyword matching title, description or identifier',
    }),
    IsOptional(),
    IsString(),
    __metadata("design:type", String)
], MobileTasksQueryDto.prototype, "search", void 0);
__decorate([
    ApiPropertyOptional({
        description: 'Page number for pagination',
        default: 1,
        minimum: 1,
    }),
    IsOptional(),
    Type(() => Number),
    IsNumber(),
    Min(1),
    __metadata("design:type", Number)
], MobileTasksQueryDto.prototype, "page", void 0);
__decorate([
    ApiPropertyOptional({
        description: 'Number of items per page',
        default: 20,
        minimum: 1,
        maximum: 100,
    }),
    IsOptional(),
    Type(() => Number),
    IsNumber(),
    Min(1),
    Max(100),
    __metadata("design:type", Number)
], MobileTasksQueryDto.prototype, "limit", void 0);
export class MobilePaginatedTasksResponseDto {
    items;
    total;
    page;
    totalPages;
    hasMore;
}
__decorate([
    ApiProperty({ type: () => [MobileCompactTaskDto] }),
    __metadata("design:type", Array)
], MobilePaginatedTasksResponseDto.prototype, "items", void 0);
__decorate([
    ApiProperty({ example: 45 }),
    __metadata("design:type", Number)
], MobilePaginatedTasksResponseDto.prototype, "total", void 0);
__decorate([
    ApiProperty({ example: 1 }),
    __metadata("design:type", Number)
], MobilePaginatedTasksResponseDto.prototype, "page", void 0);
__decorate([
    ApiProperty({ example: 3 }),
    __metadata("design:type", Number)
], MobilePaginatedTasksResponseDto.prototype, "totalPages", void 0);
__decorate([
    ApiProperty({ example: true }),
    __metadata("design:type", Boolean)
], MobilePaginatedTasksResponseDto.prototype, "hasMore", void 0);
export class MobileCreateTaskDto {
    title;
    description;
    workspaceId;
    projectId;
    status;
    priority;
    assigneeId;
    dueDate;
    labels;
    parentId;
}
__decorate([
    ApiProperty({
        description: 'Title of the task',
        example: 'Optimize mobile offline sync',
    }),
    IsNotEmpty(),
    IsString(),
    __metadata("design:type", String)
], MobileCreateTaskDto.prototype, "title", void 0);
__decorate([
    ApiPropertyOptional({
        description: 'Detailed description (Markdown supported)',
        example: 'Store tasks locally in SQLite and reconcile on reconnect.',
    }),
    IsOptional(),
    IsString(),
    __metadata("design:type", String)
], MobileCreateTaskDto.prototype, "description", void 0);
__decorate([
    ApiPropertyOptional({
        description: 'Workspace ID. Defaults to the user’s primary workspace if omitted.',
    }),
    IsOptional(),
    IsString(),
    __metadata("design:type", String)
], MobileCreateTaskDto.prototype, "workspaceId", void 0);
__decorate([
    ApiPropertyOptional({
        description: 'Project ID. Defaults to the first project in workspace if omitted.',
    }),
    IsOptional(),
    IsString(),
    __metadata("design:type", String)
], MobileCreateTaskDto.prototype, "projectId", void 0);
__decorate([
    ApiPropertyOptional({
        enum: TaskStatus,
        default: TaskStatus.TODO,
    }),
    IsOptional(),
    IsEnum(TaskStatus),
    __metadata("design:type", String)
], MobileCreateTaskDto.prototype, "status", void 0);
__decorate([
    ApiPropertyOptional({
        enum: TaskPriority,
        default: TaskPriority.NO_PRIORITY,
    }),
    IsOptional(),
    IsEnum(TaskPriority),
    __metadata("design:type", String)
], MobileCreateTaskDto.prototype, "priority", void 0);
__decorate([
    ApiPropertyOptional({
        description: 'Assignee user ID (defaults to unassigned or current user)',
    }),
    IsOptional(),
    IsString(),
    __metadata("design:type", String)
], MobileCreateTaskDto.prototype, "assigneeId", void 0);
__decorate([
    ApiPropertyOptional({
        description: 'Due date in ISO format',
        example: '2026-11-01T12:00:00Z',
    }),
    IsOptional(),
    IsString(),
    __metadata("design:type", String)
], MobileCreateTaskDto.prototype, "dueDate", void 0);
__decorate([
    ApiPropertyOptional({
        description: 'Array of tag strings',
        example: ['mobile', 'v2'],
    }),
    IsOptional(),
    IsArray(),
    __metadata("design:type", Array)
], MobileCreateTaskDto.prototype, "labels", void 0);
__decorate([
    ApiPropertyOptional({
        description: 'Parent task ID if creating as a subtask',
    }),
    IsOptional(),
    IsString(),
    __metadata("design:type", String)
], MobileCreateTaskDto.prototype, "parentId", void 0);
export class MobileUpdateTaskStatusDto {
    status;
    customStatus;
}
__decorate([
    ApiProperty({
        enum: TaskStatus,
        description: 'Target status (BACKLOG, TODO, IN_PROGRESS, DONE, CANCELED)',
        example: TaskStatus.DONE,
    }),
    IsNotEmpty(),
    IsEnum(TaskStatus),
    __metadata("design:type", String)
], MobileUpdateTaskStatusDto.prototype, "status", void 0);
__decorate([
    ApiPropertyOptional({
        description: 'Optional custom status column identifier',
    }),
    IsOptional(),
    IsString(),
    __metadata("design:type", String)
], MobileUpdateTaskStatusDto.prototype, "customStatus", void 0);
export class MobileUpdateTaskPriorityDto {
    priority;
}
__decorate([
    ApiProperty({
        enum: TaskPriority,
        description: 'Target priority (NO_PRIORITY, LOW, MEDIUM, HIGH, URGENT)',
        example: TaskPriority.HIGH,
    }),
    IsNotEmpty(),
    IsEnum(TaskPriority),
    __metadata("design:type", String)
], MobileUpdateTaskPriorityDto.prototype, "priority", void 0);
export class MobileAddCommentDto {
    content;
}
__decorate([
    ApiProperty({
        description: 'Comment body text',
        example: 'Working on this now from mobile.',
    }),
    IsNotEmpty(),
    IsString(),
    __metadata("design:type", String)
], MobileAddCommentDto.prototype, "content", void 0);
//# sourceMappingURL=mobile-tasks.dto.js.map