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
import { Controller, Get, Post, Patch, Body, Param, Query, UseGuards, } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiQuery, ApiParam } from '@nestjs/swagger';
import { CyclesService } from './cycles.service.js';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';
import { CreateCycleDto, UpdateCycleDto, RolloverCycleDto } from './dto/create-cycle.dto.js';
let CyclesController = class CyclesController {
    cyclesService;
    constructor(cyclesService) {
        this.cyclesService = cyclesService;
    }
    async getCycles(workspaceId) {
        return this.cyclesService.getCycles(workspaceId);
    }
    async getActiveCycle(workspaceId) {
        return this.cyclesService.getActiveCycle(workspaceId);
    }
    async getCycleById(id) {
        return this.cyclesService.getCycleById(id);
    }
    async createCycle(body) {
        return this.cyclesService.createCycle(body);
    }
    async updateCycle(id, body) {
        return this.cyclesService.updateCycle(id, body);
    }
    async rolloverCycle(id, body) {
        return this.cyclesService.rolloverCycle(id, body);
    }
};
__decorate([
    Get(),
    ApiOperation({ summary: 'Get all cycles for a workspace with velocity & burndown stats' }),
    ApiQuery({ name: 'workspaceId', required: true }),
    __param(0, Query('workspaceId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], CyclesController.prototype, "getCycles", null);
__decorate([
    Get('active'),
    ApiOperation({ summary: 'Get currently active cycle for workspace' }),
    ApiQuery({ name: 'workspaceId', required: true }),
    __param(0, Query('workspaceId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], CyclesController.prototype, "getActiveCycle", null);
__decorate([
    Get(':id'),
    ApiOperation({ summary: 'Get cycle detail with tasks and burn-down metrics' }),
    ApiParam({ name: 'id', description: 'Cycle ID' }),
    __param(0, Param('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], CyclesController.prototype, "getCycleById", null);
__decorate([
    Post(),
    ApiOperation({ summary: 'Create new cycle / sprint' }),
    __param(0, Body()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [CreateCycleDto]),
    __metadata("design:returntype", Promise)
], CyclesController.prototype, "createCycle", null);
__decorate([
    Patch(':id'),
    ApiOperation({ summary: 'Update cycle details or status' }),
    ApiParam({ name: 'id', description: 'Cycle ID' }),
    __param(0, Param('id')),
    __param(1, Body()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, UpdateCycleDto]),
    __metadata("design:returntype", Promise)
], CyclesController.prototype, "updateCycle", null);
__decorate([
    Post(':id/rollover'),
    ApiOperation({
        summary: 'Rollover incomplete tasks from completed cycle into next cycle or backlog',
    }),
    ApiParam({ name: 'id', description: 'Cycle ID' }),
    __param(0, Param('id')),
    __param(1, Body()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, RolloverCycleDto]),
    __metadata("design:returntype", Promise)
], CyclesController.prototype, "rolloverCycle", null);
CyclesController = __decorate([
    ApiTags('Cycles'),
    ApiBearerAuth('JWT-auth'),
    UseGuards(JwtAuthGuard),
    Controller('cycles'),
    __metadata("design:paramtypes", [CyclesService])
], CyclesController);
export { CyclesController };
//# sourceMappingURL=cycles.controller.js.map