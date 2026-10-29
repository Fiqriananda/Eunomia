import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { App, cert, getApps, initializeApp } from 'firebase-admin/app';
import { getMessaging, Messaging, MulticastMessage } from 'firebase-admin/messaging';
import * as fs from 'fs';
import * as path from 'path';
import { PrismaService } from '../prisma/prisma.service.js';
import { RegisterDeviceTokenDto } from './dto/device-token.dto.js';

export interface PushNotificationPayload {
  title: string;
  body: string;
  data?: Record<string, string>;
  imageUrl?: string;
}

@Injectable()
export class NotificationsService implements OnModuleInit {
  private readonly logger = new Logger(NotificationsService.name);
  private firebaseApp: App | null = null;
  private messaging: Messaging | null = null;

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {}

  onModuleInit() {
    this.initializeFirebase();
  }

  private initializeFirebase() {
    try {
      const configuredPath =
        this.configService.get<string>('FIREBASE_CREDENTIALS_PATH') ||
        './eunomia-20e00-firebase-adminsdk-fbsvc-c0ebff3423.json';

      const candidatePaths = [
        path.isAbsolute(configuredPath)
          ? configuredPath
          : path.resolve(process.cwd(), configuredPath),
        path.resolve(process.cwd(), 'eunomia-20e00-firebase-adminsdk-fbsvc-c0ebff3423.json'),
        path.resolve(process.cwd(), 'backend', 'eunomia-20e00-firebase-adminsdk-fbsvc-c0ebff3423.json'),
      ];

      let credentialsPath: string | null = null;
      for (const p of candidatePaths) {
        if (fs.existsSync(p)) {
          credentialsPath = p;
          break;
        }
      }

      if (!credentialsPath) {
        this.logger.warn(
          `Firebase service account file not found in candidates: ${candidatePaths.join(', ')}. Push notifications will be bypassed.`,
        );
        return;
      }

      const fileContent = fs.readFileSync(credentialsPath, 'utf8');
      const serviceAccount = JSON.parse(fileContent);

      const existingApps = getApps();
      if (existingApps.length > 0) {
        this.firebaseApp = existingApps[0];
      } else {
        this.firebaseApp = initializeApp({
          credential: cert(serviceAccount),
        });
      }

      this.messaging = getMessaging(this.firebaseApp);
      this.logger.log(
        `Firebase Admin SDK initialized successfully for project: ${serviceAccount.project_id || 'unknown'}`,
      );
    } catch (err: any) {
      this.logger.error(
        `Failed to initialize Firebase Admin SDK: ${err?.message || err}`,
        err?.stack,
      );
    }
  }

  isReady(): boolean {
    return this.messaging !== null;
  }

  async registerDeviceToken(userId: string, dto: RegisterDeviceTokenDto) {
    const cleanToken = dto.token.trim();
    if (!cleanToken) return null;

    return this.prisma.deviceToken.upsert({
      where: { token: cleanToken },
      create: {
        token: cleanToken,
        platform: dto.platform || 'android',
        deviceModel: dto.deviceModel || null,
        userId,
      },
      update: {
        userId,
        platform: dto.platform || 'android',
        deviceModel: dto.deviceModel || null,
        updatedAt: new Date(),
      },
    });
  }

  async unregisterDeviceToken(userId: string, token: string) {
    const cleanToken = token.trim();
    if (!cleanToken) return { success: true };

    await this.prisma.deviceToken.deleteMany({
      where: {
        token: cleanToken,
        userId,
      },
    });

    return { success: true };
  }

  async getUserDeviceTokens(userId: string): Promise<string[]> {
    const records = await this.prisma.deviceToken.findMany({
      where: { userId },
      select: { token: true },
    });
    return records.map((r) => r.token);
  }

  async sendToUser(userId: string, payload: PushNotificationPayload) {
    const tokens = await this.getUserDeviceTokens(userId);
    if (!tokens.length) return;
    await this.sendMulticast(tokens, payload);
  }

  async sendToUsers(userIds: string[], payload: PushNotificationPayload) {
    const uniqueUserIds = Array.from(new Set(userIds.filter(Boolean)));
    if (!uniqueUserIds.length) return;

    const records = await this.prisma.deviceToken.findMany({
      where: { userId: { in: uniqueUserIds } },
      select: { token: true },
    });

    const tokens = records.map((r) => r.token);
    if (!tokens.length) return;

    await this.sendMulticast(tokens, payload);
  }

  async sendMulticast(tokens: string[], payload: PushNotificationPayload) {
    if (!this.messaging) {
      this.logger.debug(
        `Firebase Messaging is not configured. Push notification skipped: "${payload.title}"`,
      );
      return;
    }

    const uniqueTokens = Array.from(new Set(tokens.filter(Boolean)));
    if (!uniqueTokens.length) return;

    const safeData: Record<string, string> = {
      click_action: 'FLUTTER_NOTIFICATION_CLICK',
      title: payload.title,
      body: payload.body,
    };

    if (payload.data) {
      for (const [key, val] of Object.entries(payload.data)) {
        if (val !== undefined && val !== null) {
          safeData[key] = String(val);
        }
      }
    }

    const chunkSize = 500;
    const deadTokens: string[] = [];

    for (let i = 0; i < uniqueTokens.length; i += chunkSize) {
      const slice = uniqueTokens.slice(i, i + chunkSize);

      const message: MulticastMessage = {
        tokens: slice,
        notification: {
          title: payload.title,
          body: payload.body,
          imageUrl: payload.imageUrl,
        },
        data: safeData,
        android: {
          priority: 'high',
          notification: {
            channelId: 'eunomia_default_channel',
            sound: 'default',
            clickAction: 'FLUTTER_NOTIFICATION_CLICK',
          },
        },
        apns: {
          headers: {
            'apns-priority': '10',
          },
          payload: {
            aps: {
              alert: {
                title: payload.title,
                body: payload.body,
              },
              sound: 'default',
              badge: 1,
            },
          },
        },
      };

      try {
        const response = await this.messaging.sendEachForMulticast(message);
        this.logger.log(
          `FCM sent multicast: ${response.successCount} success, ${response.failureCount} failed of ${slice.length} devices`,
        );

        response.responses.forEach((resp, idx) => {
          if (!resp.success && resp.error) {
            const errCode = resp.error.code;
            if (
              errCode === 'messaging/registration-token-not-registered' ||
              errCode === 'messaging/invalid-registration-token'
            ) {
              deadTokens.push(slice[idx]);
            }
          }
        });
      } catch (err: any) {
        this.logger.error(
          `Failed sending multicast push notification: ${err?.message || err}`,
        );
      }
    }

    if (deadTokens.length > 0) {
      this.logger.log(
        `Cleaning up ${deadTokens.length} stale/invalid FCM device tokens from database`,
      );
      this.prisma.deviceToken
        .deleteMany({
          where: { token: { in: deadTokens } },
        })
        .catch((err) =>
          this.logger.error(`Failed to clean up stale device tokens: ${err}`),
        );
    }
  }

  async notifyTaskUpdated(params: {
    taskId: string;
    identifier: string;
    taskTitle: string;
    actorName: string;
    changesText: string;
    recipientUserIds: string[];
  }) {
    const { taskId, identifier, taskTitle, actorName, changesText, recipientUserIds } =
      params;
    if (!recipientUserIds.length) return;

    await this.sendToUsers(recipientUserIds, {
      title: `${actorName} updated ${identifier}`,
      body: changesText ? `${changesText} on "${taskTitle}"` : taskTitle,
      data: {
        type: 'TASK_UPDATE',
        taskId,
        identifier,
      },
    });
  }

  async notifyCommentAdded(params: {
    taskId: string;
    identifier: string;
    actorName: string;
    content: string;
    recipientUserIds: string[];
    type?: 'COMMENT' | 'COMMENT_REPLY' | 'MENTIONED';
  }) {
    const {
      taskId,
      identifier,
      actorName,
      content,
      recipientUserIds,
      type = 'COMMENT',
    } = params;
    if (!recipientUserIds.length) return;

    let title = `New comment on ${identifier}`;
    if (type === 'COMMENT_REPLY') {
      title = `${actorName} replied to your comment on ${identifier}`;
    } else if (type === 'MENTIONED') {
      title = `${actorName} mentioned you on ${identifier}`;
    }

    const truncated =
      content.length > 120 ? content.slice(0, 120) + '...' : content;

    await this.sendToUsers(recipientUserIds, {
      title,
      body: type === 'COMMENT' ? `${actorName}: ${truncated}` : truncated,
      data: {
        type,
        taskId,
        identifier,
      },
    });
  }

  async notifyTaskAssigned(params: {
    taskId: string;
    identifier: string;
    taskTitle: string;
    actorName: string;
    assigneeId: string;
  }) {
    const { taskId, identifier, taskTitle, actorName, assigneeId } = params;
    if (!assigneeId) return;

    await this.sendToUser(assigneeId, {
      title: `Assigned to ${identifier}`,
      body: `${actorName} assigned you to "${taskTitle}"`,
      data: {
        type: 'ASSIGNED',
        taskId,
        identifier,
      },
    });
  }
}
