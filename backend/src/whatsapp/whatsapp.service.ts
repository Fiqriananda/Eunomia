import {
  Injectable,
  Logger,
  ForbiddenException,
  NotFoundException,
  BadRequestException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { WorkspaceRole } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service.js';

export type WahaSessionStatus =
  | 'STOPPED'
  | 'STARTING'
  | 'SCAN_QR_CODE'
  | 'WORKING'
  | 'FAILED'
  | 'UNREACHABLE';

export interface WhatsappStatusResult {
  enabled: boolean;
  sessionName: string;
  status: WahaSessionStatus;
  me: { id?: string; phone?: string; pushName?: string } | null;
  qrDataUrl: string | null;
  error?: string;
}

export function normalizeWhatsappNumber(raw?: string | null): string | null {
  if (raw === undefined || raw === null) return null;
  const digits = raw.replace(/\D/g, '');
  if (!digits) return null;
  const normalized = digits.startsWith('0') ? `62${digits.slice(1)}` : digits;
  if (normalized.length < 8 || normalized.length > 15) {
    throw new BadRequestException(
      'Invalid WhatsApp number. Use 8-15 digits (e.g. 081234567890 or 6281234567890).',
    );
  }
  return normalized;
}

export function summarizeMarkdownForWhatsapp(
  raw?: string | null,
  maxLen = 220,
): string | null {
  if (!raw || !raw.trim()) return null;
  const cleaned = raw
    .replace(/```[\s\S]*?```/g, '[code]')
    .replace(/!\[[^\]]*\]\([^)]*\)/g, '')
    .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
    .replace(/^\s*\|?\s*:?-{1,}:?\s*(\|\s*:?-{1,}:?\s*)+\|?\s*$/gm, ' ')
    .replace(/^\s{0,3}#{1,6}\s+/gm, '')
    .replace(/^\s*>\s?/gm, '')
    .replace(/[*_~`]/g, '')
    .replace(/\|/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  if (!cleaned) return null;
  return cleaned.length > maxLen ? `${cleaned.slice(0, maxLen).trimEnd()}...` : cleaned;
}

@Injectable()
export class WhatsappService {
  private readonly logger = new Logger(WhatsappService.name);
  private readonly wahaUrl: string;
  private readonly wahaApiKey: string;
  private readonly frontendUrl: string;
  private readonly mentionCooldownMs: number;
  private readonly mentionBurstDelayMs: number;
  // shortcut: in-memory cooldown map resets on backend restart, move to Redis if running multiple replicas
  private readonly mentionCooldowns = new Map<string, number>();

  constructor(
    private prisma: PrismaService,
    private configService: ConfigService,
  ) {
    this.wahaUrl = (this.configService.get<string>('WAHA_URL') || 'http://localhost:3000').replace(
      /\/+$/,
      '',
    );
    this.wahaApiKey = this.configService.get<string>('WAHA_API_KEY') || '';
    this.frontendUrl = (
      this.configService.get<string>('FRONTEND_URL') || 'http://localhost:3002'
    ).replace(/\/+$/, '');
    this.mentionCooldownMs = Number(
      this.configService.get<string>('WAHA_MENTION_COOLDOWN_MS') || 5 * 60 * 1000,
    );
    this.mentionBurstDelayMs = Number(
      this.configService.get<string>('WAHA_MENTION_BURST_DELAY_MS') ?? 1200,
    );
  }

  private getHeaders(extra: Record<string, string> = {}): Record<string, string> {
    const headers: Record<string, string> = { ...extra };
    if (this.wahaApiKey) {
      headers['X-Api-Key'] = this.wahaApiKey;
    }
    return headers;
  }

  private buildSessionName(workspaceId: string, existing?: string | null): string {
    if (existing && existing.trim()) return existing.trim();
    return `ws_${workspaceId.replace(/[^a-zA-Z0-9]/g, '').slice(0, 16)}`;
  }

  private async assertWorkspaceAccess(
    workspaceId: string,
    userId: string,
    requireAdmin: boolean,
  ) {
    const membership = await this.prisma.workspaceMember.findUnique({
      where: { workspaceId_userId: { workspaceId, userId } },
    });
    if (!membership) {
      throw new ForbiddenException('You do not have access to this workspace');
    }
    if (
      requireAdmin &&
      membership.role !== WorkspaceRole.OWNER &&
      membership.role !== WorkspaceRole.ADMIN
    ) {
      throw new ForbiddenException(
        'Only workspace owners and administrators can manage WhatsApp bot settings',
      );
    }
    const workspace = await this.prisma.workspace.findUnique({
      where: { id: workspaceId },
      select: {
        id: true,
        name: true,
        whatsappEnabled: true,
        whatsappSessionName: true,
      },
    });
    if (!workspace) {
      throw new NotFoundException('Workspace not found');
    }
    return workspace;
  }

  private async wahaFetch(path: string, init: RequestInit = {}): Promise<Response> {
    return fetch(`${this.wahaUrl}${path}`, {
      ...init,
      headers: this.getHeaders(init.headers as Record<string, string>),
      signal: AbortSignal.timeout(10000),
    });
  }

  private async fetchQrDataUrl(sessionName: string): Promise<string | null> {
    try {
      const res = await this.wahaFetch(`/api/${encodeURIComponent(sessionName)}/auth/qr`, {
        method: 'GET',
        headers: { Accept: 'image/png' },
      });
      if (!res.ok) return null;

      const contentType = res.headers.get('content-type') || '';
      if (contentType.includes('application/json')) {
        const json = (await res.json()) as { data?: string; mimetype?: string };
        if (!json?.data) return null;
        return json.data.startsWith('data:')
          ? json.data
          : `data:${json.mimetype || 'image/png'};base64,${json.data}`;
      }

      const buf = Buffer.from(await res.arrayBuffer());
      if (buf.length === 0) return null;
      const mime = contentType.split(';')[0].trim() || 'image/png';
      return `data:${mime};base64,${buf.toString('base64')}`;
    } catch (err) {
      this.logger.warn(`Failed to fetch WAHA QR for ${sessionName}: ${String(err)}`);
      return null;
    }
  }

  private extractMe(me?: { id?: string; pushName?: string } | null) {
    if (!me) return null;
    const phone = me.id ? me.id.replace(/@.*$/, '') : undefined;
    return { id: me.id, phone, pushName: me.pushName };
  }

  async getStatus(workspaceId: string, userId: string): Promise<WhatsappStatusResult> {
    const workspace = await this.assertWorkspaceAccess(workspaceId, userId, false);
    const sessionName = this.buildSessionName(workspace.id, workspace.whatsappSessionName);

    try {
      const res = await this.wahaFetch(`/api/sessions/${encodeURIComponent(sessionName)}`, {
        method: 'GET',
      });

      if (res.status === 404) {
        return {
          enabled: workspace.whatsappEnabled,
          sessionName,
          status: 'STOPPED',
          me: null,
          qrDataUrl: null,
        };
      }

      if (!res.ok) {
        return {
          enabled: workspace.whatsappEnabled,
          sessionName,
          status: 'UNREACHABLE',
          me: null,
          qrDataUrl: null,
          error: `WAHA returned HTTP ${res.status}`,
        };
      }

      const data = (await res.json()) as {
        status?: WahaSessionStatus;
        me?: { id?: string; pushName?: string } | null;
      };
      const status: WahaSessionStatus = data.status || 'STOPPED';
      const qrDataUrl =
        status === 'SCAN_QR_CODE' ? await this.fetchQrDataUrl(sessionName) : null;

      return {
        enabled: workspace.whatsappEnabled,
        sessionName,
        status,
        me: this.extractMe(data.me),
        qrDataUrl,
      };
    } catch (err: any) {
      this.logger.warn(`WAHA unreachable for session ${sessionName}: ${err?.message || err}`);
      return {
        enabled: workspace.whatsappEnabled,
        sessionName,
        status: 'UNREACHABLE',
        me: null,
        qrDataUrl: null,
        error: 'Cannot connect to WAHA server. Make sure the WAHA container is running.',
      };
    }
  }

  async connect(workspaceId: string, userId: string): Promise<WhatsappStatusResult> {
    const workspace = await this.assertWorkspaceAccess(workspaceId, userId, true);
    const sessionName = this.buildSessionName(workspace.id, workspace.whatsappSessionName);

    await this.prisma.workspace.update({
      where: { id: workspaceId },
      data: {
        whatsappSessionName: sessionName,
        whatsappEnabled: true,
      },
    });

    try {
      const createRes = await this.wahaFetch('/api/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: sessionName, start: true }),
      });

      if (!createRes.ok && createRes.status !== 200 && createRes.status !== 201) {
        const startRes = await this.wahaFetch(
          `/api/sessions/${encodeURIComponent(sessionName)}/start`,
          { method: 'POST' },
        );
        if (!startRes.ok && startRes.status !== 422) {
          throw new ServiceUnavailableException(
            `Failed to start WAHA session (HTTP ${startRes.status})`,
          );
        }
      }
    } catch (err) {
      if (err instanceof ServiceUnavailableException) throw err;
      throw new ServiceUnavailableException(
        'Cannot connect to WAHA server. Make sure the WAHA container is running.',
      );
    }

    return this.getStatus(workspaceId, userId);
  }

  async disconnect(workspaceId: string, userId: string): Promise<WhatsappStatusResult> {
    const workspace = await this.assertWorkspaceAccess(workspaceId, userId, true);
    const sessionName = this.buildSessionName(workspace.id, workspace.whatsappSessionName);

    try {
      await this.wahaFetch(`/api/sessions/${encodeURIComponent(sessionName)}/logout`, {
        method: 'POST',
      });
      await this.wahaFetch(`/api/sessions/${encodeURIComponent(sessionName)}/stop`, {
        method: 'POST',
      }).catch(() => undefined);
    } catch (err: any) {
      this.logger.warn(`WAHA logout warning for ${sessionName}: ${err?.message || err}`);
    }

    await this.prisma.workspace.update({
      where: { id: workspaceId },
      data: { whatsappEnabled: false },
    });

    return this.getStatus(workspaceId, userId);
  }

  async toggle(workspaceId: string, userId: string, enabled: boolean) {
    await this.assertWorkspaceAccess(workspaceId, userId, true);
    const updated = await this.prisma.workspace.update({
      where: { id: workspaceId },
      data: { whatsappEnabled: enabled },
      select: { id: true, whatsappEnabled: true, whatsappSessionName: true },
    });
    return updated;
  }

  async sendText(sessionName: string, phoneNumber: string, text: string): Promise<boolean> {
    const normalized = normalizeWhatsappNumber(phoneNumber);
    if (!normalized) return false;

    const res = await this.wahaFetch('/api/sendText', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        session: sessionName,
        chatId: `${normalized}@c.us`,
        text,
      }),
    });

    if (!res.ok) {
      const body = await res.text().catch(() => '');
      throw new Error(`WAHA sendText failed (HTTP ${res.status}): ${body}`);
    }

    return true;
  }

  async sendTestMessage(workspaceId: string, userId: string, phone?: string) {
    const workspace = await this.assertWorkspaceAccess(workspaceId, userId, true);
    const sessionName = this.buildSessionName(workspace.id, workspace.whatsappSessionName);

    let targetPhone = phone;
    if (!targetPhone) {
      const me = await this.prisma.user.findUnique({
        where: { id: userId },
        select: { whatsappNumber: true },
      });
      targetPhone = me?.whatsappNumber || undefined;
    }

    const normalized = normalizeWhatsappNumber(targetPhone);
    if (!normalized) {
      throw new BadRequestException(
        'Please provide a WhatsApp number or set one in your Profile first.',
      );
    }

    try {
      await this.sendText(
        sessionName,
        normalized,
        `*[${workspace.name}]* WhatsApp Bot terhubung!\nNotifikasi task dari Eunomia siap dikirim ke nomor ini.`,
      );
      return { success: true, to: normalized };
    } catch (err: any) {
      throw new ServiceUnavailableException(
        err?.message || 'Failed to send test WhatsApp message. Ensure the bot is connected.',
      );
    }
  }

  async notifyTaskAssigned(params: {
    workspaceId: string;
    assigneeId: string;
    taskId: string;
    identifier: string;
    taskTitle: string;
    actorName: string;
    description?: string | null;
    status?: string | null;
    projectName?: string | null;
    cycleName?: string | null;
    priority?: string | null;
    labels?: string[] | null;
    estimate?: number | null;
    dueDate?: Date | string | null;
  }): Promise<void> {
    try {
      const [workspace, assignee] = await Promise.all([
        this.prisma.workspace.findUnique({
          where: { id: params.workspaceId },
          select: {
            id: true,
            name: true,
            whatsappEnabled: true,
            whatsappSessionName: true,
          },
        }),
        this.prisma.user.findUnique({
          where: { id: params.assigneeId },
          select: {
            name: true,
            whatsappNumber: true,
            whatsappNotifications: true,
          },
        }),
      ]);

      if (!workspace?.whatsappEnabled) return;
      if (!assignee?.whatsappNumber || assignee.whatsappNotifications === false) return;

      const sessionName = this.buildSessionName(workspace.id, workspace.whatsappSessionName);
      const taskUrl = `${this.frontendUrl}/issue/${params.taskId}`;

      const lines = [
        `*[${workspace.name}] Task Baru Masuk*`,
        ``,
        `*${params.identifier}* — ${params.taskTitle}`,
        `Ditugaskan oleh: ${params.actorName}`,
      ];

      const row1 = [
        params.projectName ? `Project: ${params.projectName}` : null,
        params.status ? `Status: ${params.status}` : null,
      ].filter(Boolean);
      if (row1.length > 0) lines.push(row1.join(' • '));

      const row2 = [
        params.priority && params.priority !== 'NO_PRIORITY'
          ? `Priority: ${params.priority}`
          : null,
        params.cycleName ? `Cycle: ${params.cycleName}` : null,
        params.estimate ? `Estimate: ${params.estimate} pts` : null,
      ].filter(Boolean);
      if (row2.length > 0) lines.push(row2.join(' • '));

      if (params.dueDate) {
        const formattedDate = new Date(params.dueDate).toLocaleDateString('id-ID', {
          day: 'numeric',
          month: 'short',
          year: 'numeric',
        });
        lines.push(`Due: ${formattedDate}`);
      }

      if (params.labels && params.labels.length > 0) {
        lines.push(`Label: ${params.labels.join(', ')}`);
      }

      const summary = summarizeMarkdownForWhatsapp(params.description, 220);
      if (summary) {
        lines.push(``, `Detail:`, summary);
      }

      lines.push(``, `Buka task: ${taskUrl}`);

      await this.sendText(sessionName, assignee.whatsappNumber, lines.join('\n'));
    } catch (err: any) {
      this.logger.warn(
        `Failed to send WhatsApp assignment reminder for ${params.identifier}: ${err?.message || err}`,
      );
    }
  }

  private isMentionRateLimited(workspaceId: string, userId: string, taskId: string): boolean {
    const now = Date.now();
    if (this.mentionCooldowns.size > 500) {
      for (const [k, ts] of this.mentionCooldowns.entries()) {
        if (now - ts >= this.mentionCooldownMs) {
          this.mentionCooldowns.delete(k);
        }
      }
    }
    const key = `${workspaceId}:${userId}:${taskId}`;
    const lastSent = this.mentionCooldowns.get(key);
    if (lastSent !== undefined && now - lastSent < this.mentionCooldownMs) {
      return true;
    }
    this.mentionCooldowns.set(key, now);
    return false;
  }

  async notifyMentioned(params: {
    workspaceId: string;
    recipientUserIds: string[];
    taskId: string;
    identifier: string;
    taskTitle: string;
    actorName: string;
    commentContent: string;
  }): Promise<void> {
    if (!params.recipientUserIds || params.recipientUserIds.length === 0) return;

    try {
      const workspace = await this.prisma.workspace.findUnique({
        where: { id: params.workspaceId },
        select: {
          id: true,
          name: true,
          whatsappEnabled: true,
          whatsappSessionName: true,
        },
      });

      if (!workspace?.whatsappEnabled) return;

      const uniqueIds = Array.from(new Set(params.recipientUserIds));
      const eligibleIds = uniqueIds.filter(
        (uid) => !this.isMentionRateLimited(params.workspaceId, uid, params.taskId),
      );
      if (eligibleIds.length === 0) return;

      const recipients = await this.prisma.user.findMany({
        where: {
          id: { in: eligibleIds },
          whatsappNotifications: true,
          whatsappNumber: { not: null },
        },
        select: {
          id: true,
          whatsappNumber: true,
        },
      });

      if (recipients.length === 0) return;

      const sessionName = this.buildSessionName(workspace.id, workspace.whatsappSessionName);
      const taskUrl = `${this.frontendUrl}/issue/${params.taskId}`;
      const snippet = summarizeMarkdownForWhatsapp(params.commentContent, 160) || '';

      const text = [
        `*[${workspace.name}] Kamu di-mention*`,
        ``,
        `*${params.identifier}* — ${params.taskTitle}`,
        `Dari: ${params.actorName}`,
        `"${snippet}"`,
        ``,
        `Buka task: ${taskUrl}`,
      ].join('\n');

      for (let idx = 0; idx < recipients.length; idx++) {
        const recipient = recipients[idx];
        if (!recipient.whatsappNumber) continue;
        if (idx > 0 && this.mentionBurstDelayMs > 0) {
          await new Promise((resolve) => setTimeout(resolve, this.mentionBurstDelayMs));
        }
        await this.sendText(sessionName, recipient.whatsappNumber, text).catch((err: any) => {
          this.logger.warn(
            `Failed to send WhatsApp mention to user ${recipient.id} for ${params.identifier}: ${err?.message || err}`,
          );
        });
      }
    } catch (err: any) {
      this.logger.warn(
        `Failed to send WhatsApp mention reminders for ${params.identifier}: ${err?.message || err}`,
      );
    }
  }
}
