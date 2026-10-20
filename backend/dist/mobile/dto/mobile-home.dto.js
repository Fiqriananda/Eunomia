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
import { IsOptional, IsString } from 'class-validator';
import { TaskStatus, TaskPriority } from '@prisma/client';
export class MobileHomeQueryDto {
    workspaceId;
}
__decorate([
    ApiPropertyOptional({
        description: 'Specific workspace ID. If omitted, uses the user’s default/first workspace.',
        example: 'd3b07384-d113-4f9e-9d8a-81a6c0c5bf1a',
    }),
    IsOptional(),
    IsString(),
    __metadata("design:type", String)
], MobileHomeQueryDto.prototype, "workspaceId", void 0);
export class MobileUserProfileDto {
    id;
    name;
    email;
    avatarUrl;
}
__decorate([
    ApiProperty({ example: 'usr_123' }),
    __metadata("design:type", String)
], MobileUserProfileDto.prototype, "id", void 0);
__decorate([
    ApiProperty({ example: 'Alex Vance' }),
    __metadata("design:type", String)
], MobileUserProfileDto.prototype, "name", void 0);
__decorate([
    ApiProperty({ example: 'alex@company.com' }),
    __metadata("design:type", String)
], MobileUserProfileDto.prototype, "email", void 0);
__decorate([
    ApiPropertyOptional({ example: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb' }),
    __metadata("design:type", Object)
], MobileUserProfileDto.prototype, "avatarUrl", void 0);
export class MobileWorkspaceSummaryDto {
    id;
    name;
    slug;
    role;
}
__decorate([
    ApiProperty({ example: 'ws_123' }),
    __metadata("design:type", String)
], MobileWorkspaceSummaryDto.prototype, "id", void 0);
__decorate([
    ApiProperty({ example: 'Linear Corp' }),
    __metadata("design:type", String)
], MobileWorkspaceSummaryDto.prototype, "name", void 0);
__decorate([
    ApiProperty({ example: 'linear-corp' }),
    __metadata("design:type", String)
], MobileWorkspaceSummaryDto.prototype, "slug", void 0);
__decorate([
    ApiPropertyOptional({ example: 'OWNER' }),
    __metadata("design:type", String)
], MobileWorkspaceSummaryDto.prototype, "role", void 0);
export class MobileHomeStatsDto {
    assignedCount;
    inProgressCount;
    dueSoonCount;
    urgentCount;
    completedThisWeekCount;
    unreadNotificationsCount;
}
__decorate([
    ApiProperty({ description: 'Total tasks assigned to user', example: 5 }),
    __metadata("design:type", Number)
], MobileHomeStatsDto.prototype, "assignedCount", void 0);
__decorate([
    ApiProperty({ description: 'Tasks currently in progress for user', example: 2 }),
    __metadata("design:type", Number)
], MobileHomeStatsDto.prototype, "inProgressCount", void 0);
__decorate([
    ApiProperty({ description: 'Tasks due today or overdue', example: 1 }),
    __metadata("design:type", Number)
], MobileHomeStatsDto.prototype, "dueSoonCount", void 0);
__decorate([
    ApiProperty({ description: 'High or Urgent tasks assigned to user', example: 3 }),
    __metadata("design:type", Number)
], MobileHomeStatsDto.prototype, "urgentCount", void 0);
__decorate([
    ApiProperty({ description: 'Tasks completed by user this week', example: 8 }),
    __metadata("design:type", Number)
], MobileHomeStatsDto.prototype, "completedThisWeekCount", void 0);
__decorate([
    ApiProperty({ description: 'Unread inbox notifications count', example: 4 }),
    __metadata("design:type", Number)
], MobileHomeStatsDto.prototype, "unreadNotificationsCount", void 0);
export class MobileCompactTaskDto {
    id;
    identifier;
    title;
    description;
    status;
    customStatus;
    priority;
    dueDate;
    labels;
    project;
    assignee;
    subtasksCount;
    subtasksCompletedCount;
    commentsCount;
    attachmentsCount;
    createdAt;
    updatedAt;
}
__decorate([
    ApiProperty({ example: 'task_123' }),
    __metadata("design:type", String)
], MobileCompactTaskDto.prototype, "id", void 0);
__decorate([
    ApiProperty({ example: 'LIN-14' }),
    __metadata("design:type", String)
], MobileCompactTaskDto.prototype, "identifier", void 0);
__decorate([
    ApiProperty({ example: 'Implement mobile biometric login' }),
    __metadata("design:type", String)
], MobileCompactTaskDto.prototype, "title", void 0);
__decorate([
    ApiPropertyOptional({ example: 'Add FaceID and Fingerprint support for iOS and Android' }),
    __metadata("design:type", Object)
], MobileCompactTaskDto.prototype, "description", void 0);
__decorate([
    ApiProperty({ enum: TaskStatus, example: TaskStatus.IN_PROGRESS }),
    __metadata("design:type", String)
], MobileCompactTaskDto.prototype, "status", void 0);
__decorate([
    ApiPropertyOptional({ example: null }),
    __metadata("design:type", Object)
], MobileCompactTaskDto.prototype, "customStatus", void 0);
__decorate([
    ApiProperty({ enum: TaskPriority, example: TaskPriority.HIGH }),
    __metadata("design:type", String)
], MobileCompactTaskDto.prototype, "priority", void 0);
__decorate([
    ApiPropertyOptional({ example: '2026-10-25T12:00:00.000Z' }),
    __metadata("design:type", Object)
], MobileCompactTaskDto.prototype, "dueDate", void 0);
__decorate([
    ApiProperty({ example: ['mobile', 'auth'] }),
    __metadata("design:type", Array)
], MobileCompactTaskDto.prototype, "labels", void 0);
__decorate([
    ApiPropertyOptional({
        example: { id: 'proj_1', name: 'Mobile App', key: 'LIN', color: '#6366f1' },
    }),
    __metadata("design:type", Object)
], MobileCompactTaskDto.prototype, "project", void 0);
__decorate([
    ApiPropertyOptional({
        example: { id: 'usr_1', name: 'Jane Doe', avatarUrl: null },
    }),
    __metadata("design:type", Object)
], MobileCompactTaskDto.prototype, "assignee", void 0);
__decorate([
    ApiProperty({ example: 3 }),
    __metadata("design:type", Number)
], MobileCompactTaskDto.prototype, "subtasksCount", void 0);
__decorate([
    ApiProperty({ example: 1 }),
    __metadata("design:type", Number)
], MobileCompactTaskDto.prototype, "subtasksCompletedCount", void 0);
__decorate([
    ApiProperty({ example: 5 }),
    __metadata("design:type", Number)
], MobileCompactTaskDto.prototype, "commentsCount", void 0);
__decorate([
    ApiProperty({ example: 2 }),
    __metadata("design:type", Number)
], MobileCompactTaskDto.prototype, "attachmentsCount", void 0);
__decorate([
    ApiProperty({ example: '2026-10-18T10:00:00.000Z' }),
    __metadata("design:type", Date)
], MobileCompactTaskDto.prototype, "createdAt", void 0);
__decorate([
    ApiProperty({ example: '2026-10-19T08:30:00.000Z' }),
    __metadata("design:type", Date)
], MobileCompactTaskDto.prototype, "updatedAt", void 0);
export class MobileProjectSummaryDto {
    id;
    name;
    key;
    color;
    taskCount;
}
__decorate([
    ApiProperty({ example: 'proj_1' }),
    __metadata("design:type", String)
], MobileProjectSummaryDto.prototype, "id", void 0);
__decorate([
    ApiProperty({ example: 'Core Platform' }),
    __metadata("design:type", String)
], MobileProjectSummaryDto.prototype, "name", void 0);
__decorate([
    ApiProperty({ example: 'COR' }),
    __metadata("design:type", String)
], MobileProjectSummaryDto.prototype, "key", void 0);
__decorate([
    ApiPropertyOptional({ example: '#6366f1' }),
    __metadata("design:type", Object)
], MobileProjectSummaryDto.prototype, "color", void 0);
__decorate([
    ApiProperty({ example: 18 }),
    __metadata("design:type", Number)
], MobileProjectSummaryDto.prototype, "taskCount", void 0);
export class MobileStatusCountDto {
    status;
    label;
    count;
}
__decorate([
    ApiProperty({ enum: TaskStatus, example: TaskStatus.TODO }),
    __metadata("design:type", String)
], MobileStatusCountDto.prototype, "status", void 0);
__decorate([
    ApiProperty({ example: 'Todo' }),
    __metadata("design:type", String)
], MobileStatusCountDto.prototype, "label", void 0);
__decorate([
    ApiProperty({ example: 12 }),
    __metadata("design:type", Number)
], MobileStatusCountDto.prototype, "count", void 0);
export class MobileHomeResponseDto {
    user;
    currentWorkspace;
    availableWorkspaces;
    stats;
    myAssignedTasks;
    projects;
    statusBreakdown;
}
__decorate([
    ApiProperty({ type: () => MobileUserProfileDto }),
    __metadata("design:type", MobileUserProfileDto)
], MobileHomeResponseDto.prototype, "user", void 0);
__decorate([
    ApiProperty({ type: () => MobileWorkspaceSummaryDto }),
    __metadata("design:type", MobileWorkspaceSummaryDto)
], MobileHomeResponseDto.prototype, "currentWorkspace", void 0);
__decorate([
    ApiProperty({ type: () => [MobileWorkspaceSummaryDto] }),
    __metadata("design:type", Array)
], MobileHomeResponseDto.prototype, "availableWorkspaces", void 0);
__decorate([
    ApiProperty({ type: () => MobileHomeStatsDto }),
    __metadata("design:type", MobileHomeStatsDto)
], MobileHomeResponseDto.prototype, "stats", void 0);
__decorate([
    ApiProperty({ type: () => [MobileCompactTaskDto], description: 'High priority & urgent tasks assigned to current user' }),
    __metadata("design:type", Array)
], MobileHomeResponseDto.prototype, "myAssignedTasks", void 0);
__decorate([
    ApiProperty({ type: () => [MobileProjectSummaryDto] }),
    __metadata("design:type", Array)
], MobileHomeResponseDto.prototype, "projects", void 0);
__decorate([
    ApiProperty({ type: () => [MobileStatusCountDto] }),
    __metadata("design:type", Array)
], MobileHomeResponseDto.prototype, "statusBreakdown", void 0);
//# sourceMappingURL=mobile-home.dto.js.map