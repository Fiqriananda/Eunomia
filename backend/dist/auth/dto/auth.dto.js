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
import { IsEmail, IsNotEmpty, IsOptional, IsString, MinLength } from 'class-validator';
export class RegisterDto {
    email;
    password;
    name;
    fcmToken;
    deviceToken;
    platform;
    deviceModel;
}
__decorate([
    ApiProperty({ example: 'alex@company.com', description: 'User email address' }),
    IsEmail(),
    __metadata("design:type", String)
], RegisterDto.prototype, "email", void 0);
__decorate([
    ApiProperty({ example: 'securePassword123', minLength: 6, description: 'User password' }),
    IsString(),
    MinLength(6),
    __metadata("design:type", String)
], RegisterDto.prototype, "password", void 0);
__decorate([
    ApiProperty({ example: 'Alex Vance', description: 'Full name' }),
    IsNotEmpty(),
    IsString(),
    __metadata("design:type", String)
], RegisterDto.prototype, "name", void 0);
__decorate([
    ApiPropertyOptional({ example: 'dK5a...token', description: 'FCM push notification token' }),
    IsOptional(),
    IsString(),
    __metadata("design:type", String)
], RegisterDto.prototype, "fcmToken", void 0);
__decorate([
    ApiPropertyOptional({ example: 'dK5a...token', description: 'Alias for fcmToken' }),
    IsOptional(),
    IsString(),
    __metadata("design:type", String)
], RegisterDto.prototype, "deviceToken", void 0);
__decorate([
    ApiPropertyOptional({ example: 'android', enum: ['android', 'ios', 'web'] }),
    IsOptional(),
    IsString(),
    __metadata("design:type", String)
], RegisterDto.prototype, "platform", void 0);
__decorate([
    ApiPropertyOptional({ example: 'Pixel 8' }),
    IsOptional(),
    IsString(),
    __metadata("design:type", String)
], RegisterDto.prototype, "deviceModel", void 0);
export class LoginDto {
    email;
    password;
    fcmToken;
    deviceToken;
    platform;
    deviceModel;
}
__decorate([
    ApiProperty({ example: 'alex@company.com', description: 'User email address' }),
    IsEmail(),
    __metadata("design:type", String)
], LoginDto.prototype, "email", void 0);
__decorate([
    ApiProperty({ example: 'securePassword123', description: 'User password' }),
    IsNotEmpty(),
    IsString(),
    __metadata("design:type", String)
], LoginDto.prototype, "password", void 0);
__decorate([
    ApiPropertyOptional({ example: 'dK5a...token', description: 'FCM push notification token' }),
    IsOptional(),
    IsString(),
    __metadata("design:type", String)
], LoginDto.prototype, "fcmToken", void 0);
__decorate([
    ApiPropertyOptional({ example: 'dK5a...token', description: 'Alias for fcmToken' }),
    IsOptional(),
    IsString(),
    __metadata("design:type", String)
], LoginDto.prototype, "deviceToken", void 0);
__decorate([
    ApiPropertyOptional({ example: 'android', enum: ['android', 'ios', 'web'] }),
    IsOptional(),
    IsString(),
    __metadata("design:type", String)
], LoginDto.prototype, "platform", void 0);
__decorate([
    ApiPropertyOptional({ example: 'Pixel 8' }),
    IsOptional(),
    IsString(),
    __metadata("design:type", String)
], LoginDto.prototype, "deviceModel", void 0);
export class UpdateProfileDto {
    name;
    avatarUrl;
    email;
    currentPassword;
    newPassword;
}
__decorate([
    ApiPropertyOptional({ example: 'Alex Vance' }),
    IsOptional(),
    IsString(),
    __metadata("design:type", String)
], UpdateProfileDto.prototype, "name", void 0);
__decorate([
    ApiPropertyOptional({ example: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb' }),
    IsOptional(),
    IsString(),
    __metadata("design:type", String)
], UpdateProfileDto.prototype, "avatarUrl", void 0);
__decorate([
    ApiPropertyOptional({ example: 'newemail@company.com' }),
    IsOptional(),
    IsEmail(),
    __metadata("design:type", String)
], UpdateProfileDto.prototype, "email", void 0);
__decorate([
    ApiPropertyOptional({ example: 'password123' }),
    IsOptional(),
    IsString(),
    __metadata("design:type", String)
], UpdateProfileDto.prototype, "currentPassword", void 0);
__decorate([
    ApiPropertyOptional({ example: 'newpassword123' }),
    IsOptional(),
    IsString(),
    MinLength(6),
    __metadata("design:type", String)
], UpdateProfileDto.prototype, "newPassword", void 0);
//# sourceMappingURL=auth.dto.js.map