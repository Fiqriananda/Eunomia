import { OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
export interface MentionEmailData {
    recipientEmail: string;
    recipientName: string;
    actorName: string;
    actorAvatar?: string | null;
    taskIdentifier: string;
    taskTitle: string;
    taskId: string;
    commentContent: string;
}
export interface AssignEmailData {
    recipientEmail: string;
    recipientName: string;
    actorName: string;
    actorAvatar?: string | null;
    taskIdentifier: string;
    taskTitle: string;
    taskId: string;
    taskDescription?: string | null;
    taskStatus?: string | null;
    taskPriority?: string | null;
    projectName?: string | null;
    projectKey?: string | null;
    cycleName?: string | null;
    dueDate?: string | Date | null;
    labels?: string[];
    estimate?: number | null;
}
export interface WorkspaceInvitationEmailData {
    recipientEmail: string;
    recipientName: string;
    actorName: string;
    workspaceName: string;
    role: string;
    token: string;
}
export declare class EmailService implements OnModuleInit {
    private configService;
    private readonly logger;
    private transporter;
    private readonly fromAddress;
    private readonly frontendUrl;
    private isSmtpConfigured;
    constructor(configService: ConfigService);
    onModuleInit(): Promise<void>;
    private initTransporter;
    private saveLocalEmailPreview;
    sendMentionNotification(data: MentionEmailData): Promise<boolean>;
    sendAssignmentNotification(data: AssignEmailData): Promise<boolean>;
    sendWorkspaceInvitationEmail(data: WorkspaceInvitationEmailData): Promise<boolean>;
}
