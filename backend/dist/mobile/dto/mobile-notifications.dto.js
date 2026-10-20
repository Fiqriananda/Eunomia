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
import { MobileUserDto } from './mobile-task-detail.dto.js';
export class MobileNotificationDto {
    id;
    type;
    title;
    body;
    isRead;
    readAt;
    taskId;
    task;
    actor;
    createdAt;
}
__decorate([
    ApiProperty({ example: 'notif_1' }),
    __metadata("design:type", String)
], MobileNotificationDto.prototype, "id", void 0);
__decorate([
    ApiProperty({ example: 'ASSIGNED' }),
    __metadata("design:type", String)
], MobileNotificationDto.prototype, "type", void 0);
__decorate([
    ApiProperty({ example: 'Assigned to LIN-14' }),
    __metadata("design:type", String)
], MobileNotificationDto.prototype, "title", void 0);
__decorate([
    ApiPropertyOptional({ example: 'You were assigned to "Implement mobile biometric login"' }),
    __metadata("design:type", Object)
], MobileNotificationDto.prototype, "body", void 0);
__decorate([
    ApiProperty({ example: false }),
    __metadata("design:type", Boolean)
], MobileNotificationDto.prototype, "isRead", void 0);
__decorate([
    ApiPropertyOptional({ example: null }),
    __metadata("design:type", Object)
], MobileNotificationDto.prototype, "readAt", void 0);
__decorate([
    ApiProperty({ example: 'task_1' }),
    __metadata("design:type", String)
], MobileNotificationDto.prototype, "taskId", void 0);
__decorate([
    ApiPropertyOptional({
        example: { id: 'task_1', identifier: 'LIN-14', title: 'Implement mobile biometric login' },
    }),
    __metadata("design:type", Object)
], MobileNotificationDto.prototype, "task", void 0);
__decorate([
    ApiPropertyOptional({ type: () => MobileUserDto }),
    __metadata("design:type", MobileUserDto)
], MobileNotificationDto.prototype, "actor", void 0);
__decorate([
    ApiProperty({ example: '2026-10-19T08:00:00.000Z' }),
    __metadata("design:type", Date)
], MobileNotificationDto.prototype, "createdAt", void 0);
export class MobileNotificationsResponseDto {
    notifications;
    unreadCount;
}
__decorate([
    ApiProperty({ type: () => [MobileNotificationDto] }),
    __metadata("design:type", Array)
], MobileNotificationsResponseDto.prototype, "notifications", void 0);
__decorate([
    ApiProperty({ example: 4 }),
    __metadata("design:type", Number)
], MobileNotificationsResponseDto.prototype, "unreadCount", void 0);
//# sourceMappingURL=mobile-notifications.dto.js.map