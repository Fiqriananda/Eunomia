var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
import { ApiProperty } from '@nestjs/swagger';
export class MobileStatusMetaDto {
    key;
    label;
    color;
}
__decorate([
    ApiProperty({ example: 'TODO' }),
    __metadata("design:type", String)
], MobileStatusMetaDto.prototype, "key", void 0);
__decorate([
    ApiProperty({ example: 'Todo' }),
    __metadata("design:type", String)
], MobileStatusMetaDto.prototype, "label", void 0);
__decorate([
    ApiProperty({ example: '#e2e8f0' }),
    __metadata("design:type", String)
], MobileStatusMetaDto.prototype, "color", void 0);
export class MobilePriorityMetaDto {
    key;
    label;
    level;
    color;
}
__decorate([
    ApiProperty({ example: 'URGENT' }),
    __metadata("design:type", String)
], MobilePriorityMetaDto.prototype, "key", void 0);
__decorate([
    ApiProperty({ example: 'Urgent' }),
    __metadata("design:type", String)
], MobilePriorityMetaDto.prototype, "label", void 0);
__decorate([
    ApiProperty({ example: 4 }),
    __metadata("design:type", Number)
], MobilePriorityMetaDto.prototype, "level", void 0);
__decorate([
    ApiProperty({ example: '#f43f5e' }),
    __metadata("design:type", String)
], MobilePriorityMetaDto.prototype, "color", void 0);
export class MobileFeaturesDto {
    fileUploads;
    subtasks;
    relations;
    inbox;
    pushNotifications;
}
__decorate([
    ApiProperty({ example: true }),
    __metadata("design:type", Boolean)
], MobileFeaturesDto.prototype, "fileUploads", void 0);
__decorate([
    ApiProperty({ example: true }),
    __metadata("design:type", Boolean)
], MobileFeaturesDto.prototype, "subtasks", void 0);
__decorate([
    ApiProperty({ example: true }),
    __metadata("design:type", Boolean)
], MobileFeaturesDto.prototype, "relations", void 0);
__decorate([
    ApiProperty({ example: true }),
    __metadata("design:type", Boolean)
], MobileFeaturesDto.prototype, "inbox", void 0);
__decorate([
    ApiProperty({ example: false }),
    __metadata("design:type", Boolean)
], MobileFeaturesDto.prototype, "pushNotifications", void 0);
export class MobileConfigResponseDto {
    apiVersion;
    minSupportedAppVersion;
    serverTime;
    statuses;
    priorities;
    features;
}
__decorate([
    ApiProperty({ example: '1.0.0' }),
    __metadata("design:type", String)
], MobileConfigResponseDto.prototype, "apiVersion", void 0);
__decorate([
    ApiProperty({ example: '1.0.0' }),
    __metadata("design:type", String)
], MobileConfigResponseDto.prototype, "minSupportedAppVersion", void 0);
__decorate([
    ApiProperty({ example: '2026-10-19T12:00:00.000Z' }),
    __metadata("design:type", String)
], MobileConfigResponseDto.prototype, "serverTime", void 0);
__decorate([
    ApiProperty({ type: () => [MobileStatusMetaDto] }),
    __metadata("design:type", Array)
], MobileConfigResponseDto.prototype, "statuses", void 0);
__decorate([
    ApiProperty({ type: () => [MobilePriorityMetaDto] }),
    __metadata("design:type", Array)
], MobileConfigResponseDto.prototype, "priorities", void 0);
__decorate([
    ApiProperty({ type: () => MobileFeaturesDto }),
    __metadata("design:type", MobileFeaturesDto)
], MobileConfigResponseDto.prototype, "features", void 0);
//# sourceMappingURL=mobile-config.dto.js.map