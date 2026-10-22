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
    cycles: boolean;
    trash: boolean;
    inbox: boolean;
    hoverCard: boolean;
    pushNotifications: boolean;
}
export declare class MobileConfigResponseDto {
    apiVersion: string;
    minSupportedAppVersion: string;
    serverTime: string;
    statuses: MobileStatusMetaDto[];
    priorities: MobilePriorityMetaDto[];
    supportedRelations: string[];
    supportedEmojis: string[];
    features: MobileFeaturesDto;
}
