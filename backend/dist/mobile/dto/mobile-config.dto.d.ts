export declare class MobileStatusMetaDto {
    key: string;
    label: string;
    color: string;
}
export declare class MobilePriorityMetaDto {
    key: string;
    label: string;
    level: number;
    color: string;
}
export declare class MobileFeaturesDto {
    fileUploads: boolean;
    subtasks: boolean;
    relations: boolean;
    inbox: boolean;
    pushNotifications: boolean;
}
export declare class MobileConfigResponseDto {
    apiVersion: string;
    minSupportedAppVersion: string;
    serverTime: string;
    statuses: MobileStatusMetaDto[];
    priorities: MobilePriorityMetaDto[];
    features: MobileFeaturesDto;
}
