import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class RegisterDeviceTokenDto {
  @ApiProperty({
    description: 'FCM device token received from Firebase Messaging SDK',
    example: 'dK5a...token',
  })
  @IsString()
  @IsNotEmpty()
  token: string;

  @ApiPropertyOptional({
    description: 'Operating system platform',
    example: 'android',
    enum: ['android', 'ios', 'web'],
  })
  @IsOptional()
  @IsString()
  platform?: string;

  @ApiPropertyOptional({
    description: 'Device model or manufacturer',
    example: 'Google Pixel 8',
  })
  @IsOptional()
  @IsString()
  deviceModel?: string;
}

export class UnregisterDeviceTokenDto {
  @ApiProperty({
    description: 'FCM device token to remove',
    example: 'dK5a...token',
  })
  @IsString()
  @IsNotEmpty()
  token: string;
}

export class SendTestNotificationDto {
  @ApiPropertyOptional({
    description: 'Custom test title',
    example: 'Test Notification',
  })
  @IsOptional()
  @IsString()
  title?: string;

  @ApiPropertyOptional({
    description: 'Custom test message body',
    example: 'Firebase Cloud Messaging is working perfectly!',
  })
  @IsOptional()
  @IsString()
  body?: string;
}
