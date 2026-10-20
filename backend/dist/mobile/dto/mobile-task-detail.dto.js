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
import { TaskStatus, TaskPriority } from '@prisma/client';
export class MobileUserDto {
    id;
    name;
    email;
    avatarUrl;
}
__decorate([
    ApiProperty({ example: 'usr_1' }),
    __metadata("design:type", String)
], MobileUserDto.prototype, "id", void 0);
__decorate([
    ApiProperty({ example: 'Alex Smith' }),
    __metadata("design:type", String)
], MobileUserDto.prototype, "name", void 0);
__decorate([
    ApiProperty({ example: 'alex@linear.app' }),
    __metadata("design:type", String)
], MobileUserDto.prototype, "email", void 0);
__decorate([
    ApiPropertyOptional({ example: null }),
    __metadata("design:type", Object)
], MobileUserDto.prototype, "avatarUrl", void 0);
export class MobileSubtaskItemDto {
    id;
    identifier;
    title;
    status;
    priority;
    assignee;
}
__decorate([
    ApiProperty({ example: 'sub_1' }),
    __metadata("design:type", String)
], MobileSubtaskItemDto.prototype, "id", void 0);
__decorate([
    ApiProperty({ example: 'LIN-15' }),
    __metadata("design:type", String)
], MobileSubtaskItemDto.prototype, "identifier", void 0);
__decorate([
    ApiProperty({ example: 'Configure Keychain on iOS' }),
    __metadata("design:type", String)
], MobileSubtaskItemDto.prototype, "title", void 0);
__decorate([
    ApiProperty({ enum: TaskStatus, example: TaskStatus.DONE }),
    __metadata("design:type", String)
], MobileSubtaskItemDto.prototype, "status", void 0);
__decorate([
    ApiProperty({ enum: TaskPriority, example: TaskPriority.MEDIUM }),
    __metadata("design:type", String)
], MobileSubtaskItemDto.prototype, "priority", void 0);
__decorate([
    ApiPropertyOptional({ type: () => MobileUserDto }),
    __metadata("design:type", Object)
], MobileSubtaskItemDto.prototype, "assignee", void 0);
export class MobileCommentDto {
    id;
    content;
    user;
    createdAt;
}
__decorate([
    ApiProperty({ example: 'comment_1' }),
    __metadata("design:type", String)
], MobileCommentDto.prototype, "id", void 0);
__decorate([
    ApiProperty({ example: 'I tested the biometric build on iPhone 15 Pro, worked smoothly.' }),
    __metadata("design:type", String)
], MobileCommentDto.prototype, "content", void 0);
__decorate([
    ApiProperty({ type: () => MobileUserDto }),
    __metadata("design:type", MobileUserDto)
], MobileCommentDto.prototype, "user", void 0);
__decorate([
    ApiProperty({ example: '2026-10-19T09:15:00.000Z' }),
    __metadata("design:type", Date)
], MobileCommentDto.prototype, "createdAt", void 0);
export class MobileAttachmentDto {
    id;
    filename;
    originalName;
    mimeType;
    size;
    url;
    createdAt;
}
__decorate([
    ApiProperty({ example: 'att_1' }),
    __metadata("design:type", String)
], MobileAttachmentDto.prototype, "id", void 0);
__decorate([
    ApiProperty({ example: 'screenshot.png' }),
    __metadata("design:type", String)
], MobileAttachmentDto.prototype, "filename", void 0);
__decorate([
    ApiProperty({ example: 'screenshot.png' }),
    __metadata("design:type", String)
], MobileAttachmentDto.prototype, "originalName", void 0);
__decorate([
    ApiProperty({ example: 'image/png' }),
    __metadata("design:type", String)
], MobileAttachmentDto.prototype, "mimeType", void 0);
__decorate([
    ApiProperty({ example: 450120 }),
    __metadata("design:type", Number)
], MobileAttachmentDto.prototype, "size", void 0);
__decorate([
    ApiProperty({ example: 'http://localhost:4000/uploads/screenshot.png' }),
    __metadata("design:type", String)
], MobileAttachmentDto.prototype, "url", void 0);
__decorate([
    ApiProperty({ example: '2026-10-19T09:10:00.000Z' }),
    __metadata("design:type", Date)
], MobileAttachmentDto.prototype, "createdAt", void 0);
export class MobileTaskDetailDto {
    id;
    identifier;
    title;
    description;
    status;
    customStatus;
    priority;
    dueDate;
    labels;
    workspace;
    project;
    creator;
    assignee;
    parent;
    subtasks;
    comments;
    attachments;
    createdAt;
    updatedAt;
}
__decorate([
    ApiProperty({ example: 'task_1' }),
    __metadata("design:type", String)
], MobileTaskDetailDto.prototype, "id", void 0);
__decorate([
    ApiProperty({ example: 'LIN-14' }),
    __metadata("design:type", String)
], MobileTaskDetailDto.prototype, "identifier", void 0);
__decorate([
    ApiProperty({ example: 'Implement mobile biometric login' }),
    __metadata("design:type", String)
], MobileTaskDetailDto.prototype, "title", void 0);
__decorate([
    ApiPropertyOptional({ example: 'Add FaceID and Fingerprint support for iOS and Android' }),
    __metadata("design:type", Object)
], MobileTaskDetailDto.prototype, "description", void 0);
__decorate([
    ApiProperty({ enum: TaskStatus, example: TaskStatus.IN_PROGRESS }),
    __metadata("design:type", String)
], MobileTaskDetailDto.prototype, "status", void 0);
__decorate([
    ApiPropertyOptional({ example: null }),
    __metadata("design:type", Object)
], MobileTaskDetailDto.prototype, "customStatus", void 0);
__decorate([
    ApiProperty({ enum: TaskPriority, example: TaskPriority.HIGH }),
    __metadata("design:type", String)
], MobileTaskDetailDto.prototype, "priority", void 0);
__decorate([
    ApiPropertyOptional({ example: '2026-10-25T12:00:00.000Z' }),
    __metadata("design:type", Object)
], MobileTaskDetailDto.prototype, "dueDate", void 0);
__decorate([
    ApiProperty({ example: ['mobile', 'auth'] }),
    __metadata("design:type", Array)
], MobileTaskDetailDto.prototype, "labels", void 0);
__decorate([
    ApiProperty({
        example: { id: 'ws_1', name: 'Linear Corp', slug: 'linear-corp' },
    }),
    __metadata("design:type", Object)
], MobileTaskDetailDto.prototype, "workspace", void 0);
__decorate([
    ApiProperty({
        example: { id: 'proj_1', name: 'Mobile App', key: 'LIN', color: '#6366f1' },
    }),
    __metadata("design:type", Object)
], MobileTaskDetailDto.prototype, "project", void 0);
__decorate([
    ApiProperty({ type: () => MobileUserDto }),
    __metadata("design:type", MobileUserDto)
], MobileTaskDetailDto.prototype, "creator", void 0);
__decorate([
    ApiPropertyOptional({ type: () => MobileUserDto }),
    __metadata("design:type", Object)
], MobileTaskDetailDto.prototype, "assignee", void 0);
__decorate([
    ApiPropertyOptional({
        example: { id: 'parent_1', identifier: 'LIN-10', title: 'Mobile Client v1' },
    }),
    __metadata("design:type", Object)
], MobileTaskDetailDto.prototype, "parent", void 0);
__decorate([
    ApiProperty({ type: () => [MobileSubtaskItemDto] }),
    __metadata("design:type", Array)
], MobileTaskDetailDto.prototype, "subtasks", void 0);
__decorate([
    ApiProperty({ type: () => [MobileCommentDto] }),
    __metadata("design:type", Array)
], MobileTaskDetailDto.prototype, "comments", void 0);
__decorate([
    ApiProperty({ type: () => [MobileAttachmentDto] }),
    __metadata("design:type", Array)
], MobileTaskDetailDto.prototype, "attachments", void 0);
__decorate([
    ApiProperty({ example: '2026-10-18T10:00:00.000Z' }),
    __metadata("design:type", Date)
], MobileTaskDetailDto.prototype, "createdAt", void 0);
__decorate([
    ApiProperty({ example: '2026-10-19T08:30:00.000Z' }),
    __metadata("design:type", Date)
], MobileTaskDetailDto.prototype, "updatedAt", void 0);
//# sourceMappingURL=mobile-task-detail.dto.js.map