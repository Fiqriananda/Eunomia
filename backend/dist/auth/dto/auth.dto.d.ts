export declare class RegisterDto {
    email: string;
    password: string;
    name: string;
    fcmToken?: string;
    deviceToken?: string;
    platform?: string;
    deviceModel?: string;
}
export declare class LoginDto {
    email: string;
    password: string;
    fcmToken?: string;
    deviceToken?: string;
    platform?: string;
    deviceModel?: string;
}
export declare class UpdateProfileDto {
    name?: string;
    avatarUrl?: string;
    email?: string;
    currentPassword?: string;
    newPassword?: string;
}
