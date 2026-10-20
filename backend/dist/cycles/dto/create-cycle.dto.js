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
import { IsNotEmpty, IsString, IsOptional, IsDateString } from 'class-validator';
export class CreateCycleDto {
    workspaceId;
    name;
    description;
    startDate;
    endDate;
}
__decorate([
    ApiProperty({ description: 'Workspace ID', example: 'd55b1cc7-9eb7-4678-9c1a-761d6817ddd9' }),
    IsNotEmpty(),
    IsString(),
    __metadata("design:type", String)
], CreateCycleDto.prototype, "workspaceId", void 0);
__decorate([
    ApiPropertyOptional({ description: 'Cycle / Sprint Name', example: 'Cycle 2 (Feature Freeze)' }),
    IsOptional(),
    IsString(),
    __metadata("design:type", String)
], CreateCycleDto.prototype, "name", void 0);
__decorate([
    ApiPropertyOptional({ description: 'Cycle goal or description' }),
    IsOptional(),
    IsString(),
    __metadata("design:type", String)
], CreateCycleDto.prototype, "description", void 0);
__decorate([
    ApiProperty({ description: 'Start date (ISO)', example: '2026-10-20T00:00:00.000Z' }),
    IsNotEmpty(),
    IsDateString(),
    __metadata("design:type", String)
], CreateCycleDto.prototype, "startDate", void 0);
__decorate([
    ApiProperty({ description: 'End date (ISO)', example: '2026-11-03T00:00:00.000Z' }),
    IsNotEmpty(),
    IsDateString(),
    __metadata("design:type", String)
], CreateCycleDto.prototype, "endDate", void 0);
export class UpdateCycleDto {
    name;
    description;
    status;
    startDate;
    endDate;
}
__decorate([
    ApiPropertyOptional({ example: 'Cycle 2 (Q4 Final)' }),
    IsOptional(),
    IsString(),
    __metadata("design:type", String)
], UpdateCycleDto.prototype, "name", void 0);
__decorate([
    ApiPropertyOptional(),
    IsOptional(),
    IsString(),
    __metadata("design:type", String)
], UpdateCycleDto.prototype, "description", void 0);
__decorate([
    ApiPropertyOptional({ enum: ['UPCOMING', 'ACTIVE', 'COMPLETED'] }),
    IsOptional(),
    IsString(),
    __metadata("design:type", String)
], UpdateCycleDto.prototype, "status", void 0);
__decorate([
    ApiPropertyOptional(),
    IsOptional(),
    IsDateString(),
    __metadata("design:type", String)
], UpdateCycleDto.prototype, "startDate", void 0);
__decorate([
    ApiPropertyOptional(),
    IsOptional(),
    IsDateString(),
    __metadata("design:type", String)
], UpdateCycleDto.prototype, "endDate", void 0);
export class RolloverCycleDto {
    targetCycleId;
}
__decorate([
    ApiPropertyOptional({
        description: 'Target cycle ID to move incomplete tasks to. If omitted, tasks move to backlog.',
    }),
    IsOptional(),
    IsString(),
    __metadata("design:type", String)
], RolloverCycleDto.prototype, "targetCycleId", void 0);
//# sourceMappingURL=create-cycle.dto.js.map