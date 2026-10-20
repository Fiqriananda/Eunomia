var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
import { Controller, Get, Patch, Post, Delete, Param, Query, UseGuards, HttpCode, HttpStatus, } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse, ApiParam, ApiQuery } from '@nestjs/swagger';
import { InboxService } from './inbox.service.js';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';
import { CurrentUser } from '../auth/current-user.decorator.js';
let InboxController = class InboxController {
    inboxService;
    constructor(inboxService) {
        this.inboxService = inboxService;
    }
    async getNotifications(userId, unreadOnly) {
        return this.inboxService.getNotifications(userId, unreadOnly === 'true');
    }
    async markAsRead(id, userId) {
        return this.inboxService.markAsRead(id, userId);
    }
    async markAllAsRead(userId) {
        return this.inboxService.markAllAsRead(userId);
    }
    async deleteNotification(id, userId) {
        return this.inboxService.deleteNotification(id, userId);
    }
};
__decorate([
    Get(),
    ApiOperation({ summary: 'Get user notifications stream' }),
    ApiQuery({ name: 'unreadOnly', required: false, type: Boolean, description: 'Return only unread notifications' }),
    ApiResponse({ status: 200, description: 'List of notifications' }),
    __param(0, CurrentUser('id')),
    __param(1, Query('unreadOnly')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], InboxController.prototype, "getNotifications", null);
__decorate([
    Patch(':id/read'),
    ApiOperation({ summary: 'Mark single notification as read' }),
    ApiParam({ name: 'id', description: 'Notification ID' }),
    ApiResponse({ status: 200, description: 'Notification updated' }),
    __param(0, Param('id')),
    __param(1, CurrentUser('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], InboxController.prototype, "markAsRead", null);
__decorate([
    Post('read-all'),
    HttpCode(HttpStatus.OK),
    ApiOperation({ summary: 'Mark all notifications as read' }),
    ApiResponse({ status: 200, description: 'All notifications marked as read' }),
    __param(0, CurrentUser('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], InboxController.prototype, "markAllAsRead", null);
__decorate([
    Delete(':id'),
    ApiOperation({ summary: 'Delete a notification' }),
    ApiParam({ name: 'id', description: 'Notification ID' }),
    ApiResponse({ status: 200, description: 'Notification deleted' }),
    __param(0, Param('id')),
    __param(1, CurrentUser('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], InboxController.prototype, "deleteNotification", null);
InboxController = __decorate([
    ApiTags('Inbox'),
    ApiBearerAuth('JWT-auth'),
    UseGuards(JwtAuthGuard),
    Controller('inbox'),
    __metadata("design:paramtypes", [InboxService])
], InboxController);
export { InboxController };
//# sourceMappingURL=inbox.controller.js.map