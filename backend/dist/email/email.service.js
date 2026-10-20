var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var EmailService_1;
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import nodemailer from 'nodemailer';
import * as fs from 'fs';
import * as path from 'path';
let EmailService = EmailService_1 = class EmailService {
    configService;
    logger = new Logger(EmailService_1.name);
    transporter = null;
    fromAddress;
    frontendUrl;
    isSmtpConfigured = false;
    constructor(configService) {
        this.configService = configService;
        const rawFrom = this.configService.get('EMAIL_FROM');
        const user = this.configService.get('SMTP_USER');
        const host = this.configService.get('SMTP_HOST');
        if (host?.includes('gmail') && user) {
            const displayNameMatch = rawFrom?.match(/^"([^"]+)"/);
            const displayName = displayNameMatch ? displayNameMatch[1] : 'Motion';
            this.fromAddress = `"${displayName}" <${user}>`;
        }
        else {
            this.fromAddress = rawFrom || '"Motion" <notifications@motionlaboratory.com>';
        }
        this.frontendUrl =
            this.configService.get('FRONTEND_URL') || 'http://localhost:3002';
    }
    async onModuleInit() {
        await this.initTransporter();
    }
    async initTransporter() {
        const host = this.configService.get('SMTP_HOST');
        const port = Number(this.configService.get('SMTP_PORT')) || 587;
        const user = this.configService.get('SMTP_USER');
        const pass = this.configService.get('SMTP_PASS');
        if (host && user && pass) {
            if (host.includes('gmail')) {
                this.transporter = nodemailer.createTransport({
                    service: 'gmail',
                    auth: { user, pass },
                });
                this.logger.log(`Gmail SMTP Transporter configured for: ${user}`);
            }
            else {
                const isPort465 = port === 465;
                const secure = this.configService.get('SMTP_SECURE') !== undefined
                    ? this.configService.get('SMTP_SECURE') === 'true'
                    : isPort465;
                this.transporter = nodemailer.createTransport({
                    host,
                    port,
                    secure,
                    auth: { user, pass },
                });
                this.logger.log(`SMTP Email Transporter configured with host: ${host}:${port}`);
            }
            this.isSmtpConfigured = true;
        }
        else {
            this.transporter = nodemailer.createTransport({
                jsonTransport: true,
            });
            this.isSmtpConfigured = false;
            this.logger.log('No SMTP credentials in .env. EmailService running in local dev preview mode.');
        }
    }
    saveLocalEmailPreview(html) {
        if (process.env.NODE_ENV === 'production' && this.isSmtpConfigured) {
            return;
        }
        try {
            const uploadDir = path.join(process.cwd(), 'uploads');
            if (!fs.existsSync(uploadDir)) {
                fs.mkdirSync(uploadDir, { recursive: true });
            }
            const previewFilePath = path.join(uploadDir, 'latest-email.html');
            fs.writeFileSync(previewFilePath, html, 'utf-8');
            const baseUrl = this.configService.get('BASE_URL') || 'http://localhost:4000';
            this.logger.log(`📧 Preview generated! Open in browser: ${baseUrl}/uploads/latest-email.html`);
        }
        catch (err) {
            this.logger.warn(`Could not save local email preview: ${err.message}`);
        }
    }
    async sendMentionNotification(data) {
        if (!this.transporter) {
            await this.initTransporter();
        }
        if (!this.transporter) {
            this.logger.error('Transporter is not available');
            return false;
        }
        const taskUrl = `${this.frontendUrl}/issue/${data.taskId}`;
        const inboxUrl = `${this.frontendUrl}/?tab=inbox`;
        const subject = `${data.actorName} commented on [${data.taskIdentifier}] ${data.taskTitle}`;
        const formattedContent = data.commentContent
            .replace(/@([a-zA-Z0-9_\s]+)/g, '<span style="color: #5e6ad2; font-weight: 600;">@$1</span>')
            .replace(/\n/g, '<br/>');
        const actorInitials = data.actorName
            .split(' ')
            .map((n) => n[0])
            .slice(0, 2)
            .join('')
            .toUpperCase();
        const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${subject}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f6f7f9; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; -webkit-font-smoothing: antialiased;">
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #f6f7f9; padding: 40px 16px;">
    <tr>
      <td align="center">
        <!-- Main Card Container -->
        <table width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width: 580px; background-color: #ffffff; border-radius: 12px; border: 1px solid #e5e7eb; box-shadow: 0 4px 16px rgba(0, 0, 0, 0.04); overflow: hidden;">
          
          <!-- Card Header & Logo -->
          <tr>
            <td style="padding: 36px 36px 20px 36px;">
              <table cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td style="vertical-align: middle;">
                    <div style="width: 26px; height: 26px; background-color: #12131a; border-radius: 6px; text-align: center; line-height: 26px; color: #ffffff; font-weight: 800; font-size: 14px; font-family: sans-serif;">
                      ▲
                    </div>
                  </td>
                  <td style="vertical-align: middle; padding-left: 10px;">
                    <span style="font-size: 17px; font-weight: 700; color: #111827; letter-spacing: -0.3px;">Motion</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Main Title -->
          <tr>
            <td style="padding: 0 36px 24px 36px;">
              <h1 style="margin: 0; font-size: 22px; font-weight: 700; color: #111827; line-height: 1.35; letter-spacing: -0.4px;">
                You have an unread notification on Motion.
              </h1>
            </td>
          </tr>

          <!-- Issue Identifier & Title -->
          <tr>
            <td style="padding: 0 36px 14px 36px;">
              <div style="font-size: 14px; line-height: 1.5; color: #374151;">
                <span style="font-weight: 600; color: #6b7280; font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, monospace; letter-spacing: -0.2px;">${data.taskIdentifier}</span>
                <span style="font-weight: 600; color: #111827; margin-left: 6px;">${data.taskTitle}</span>
              </div>
            </td>
          </tr>

          <!-- Actor & Action Row -->
          <tr>
            <td style="padding: 0 36px 14px 36px;">
              <table cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td style="vertical-align: middle;">
                    <div style="width: 24px; height: 24px; border-radius: 50%; background-color: #0284c7; color: #ffffff; font-size: 10px; font-weight: 700; text-align: center; line-height: 24px;">
                      ${actorInitials}
                    </div>
                  </td>
                  <td style="vertical-align: middle; padding-left: 10px; font-size: 13px; color: #4b5563;">
                    <strong style="color: #111827; font-weight: 600;">${data.actorName}</strong>
                    <a href="${taskUrl}" style="color: #4f46e5; text-decoration: underline; margin-left: 3px;">commented on</a>
                    <span style="color: #6b7280;"> the issue:</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Comment Body Blockquote -->
          <tr>
            <td style="padding: 0 36px 28px 36px;">
              <div style="background-color: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; padding: 16px 20px; font-size: 14px; line-height: 1.6; color: #1f2937;">
                ${formattedContent}
              </div>
            </td>
          </tr>

          <!-- Primary Call to Action Button -->
          <tr>
            <td style="padding: 0 36px 36px 36px;">
              <table cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td style="border-radius: 8px; background-color: #5e6ad2;">
                    <a href="${taskUrl}" target="_blank" style="display: inline-block; padding: 11px 22px; font-size: 13px; font-weight: 600; color: #ffffff; text-decoration: none; border-radius: 8px; letter-spacing: -0.1px;">
                      Open your Inbox
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Divider -->
          <tr>
            <td style="border-top: 1px solid #f3f4f6; padding: 0;"></td>
          </tr>

          <!-- Card Footer -->
          <tr>
            <td style="padding: 20px 36px; background-color: #fafbfc; text-align: left;">
              <p style="margin: 0; font-size: 12px; color: #9ca3af; line-height: 1.5;">
                This notification was sent to <a href="mailto:${data.recipientEmail}" style="color: #6b7280; text-decoration: none;">${data.recipientEmail}</a> because you were tagged in an issue comment.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `;
        this.saveLocalEmailPreview(html);
        const resendApiKey = this.configService.get('RESEND_API_KEY');
        if (resendApiKey) {
            try {
                const res = await fetch('https://api.resend.com/emails', {
                    method: 'POST',
                    headers: {
                        Authorization: `Bearer ${resendApiKey}`,
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        from: this.fromAddress,
                        to: data.recipientEmail,
                        subject,
                        html,
                        text: `${data.actorName} commented on [${data.taskIdentifier}] ${data.taskTitle}:\n\n"${data.commentContent}"\n\nView task: ${taskUrl}`,
                    }),
                });
                const resJson = (await res.json());
                if (res.ok) {
                    this.logger.log(`Email dispatched via Resend to ${data.recipientEmail}: id=${resJson.id}`);
                    return true;
                }
                else {
                    this.logger.error(`Resend API error: ${JSON.stringify(resJson)}`);
                }
            }
            catch (resendErr) {
                this.logger.error(`Resend API network error: ${resendErr.message}`);
            }
        }
        try {
            const info = await this.transporter.sendMail({
                from: this.fromAddress,
                to: data.recipientEmail,
                subject,
                html,
                text: `${data.actorName} commented on [${data.taskIdentifier}] ${data.taskTitle}:\n\n"${data.commentContent}"\n\nView task: ${taskUrl}`,
            });
            this.logger.log(`Email dispatched for ${data.recipientEmail}: messageId=${info.messageId || 'dev-preview'}`);
            const previewUrl = nodemailer.getTestMessageUrl(info);
            if (previewUrl) {
                this.logger.log(`📨 View Email in Browser (Ethereal Preview): ${previewUrl}`);
            }
            return true;
        }
        catch (err) {
            this.logger.error(`Failed to send email to ${data.recipientEmail}: ${err.message}`);
            if (err.code === 'ESOCKET' ||
                err.code === 'ECONNREFUSED' ||
                err.code === 'EHOSTUNREACH') {
                this.logger.warn(`[SMTP Network Notice] Direct connection to SMTP server was refused (ECONNREFUSED). Your ISP/network is blocking outbound SMTP ports (465/587). You can use a VPN or set RESEND_API_KEY in backend/.env to send over HTTPS port 443 without port restrictions.`);
            }
            return false;
        }
    }
    async sendAssignmentNotification(data) {
        if (!this.transporter) {
            await this.initTransporter();
        }
        if (!this.transporter) {
            this.logger.error('Transporter is not available');
            return false;
        }
        const taskUrl = `${this.frontendUrl}/issue/${data.taskId}`;
        const subject = `${data.actorName} assigned you to [${data.taskIdentifier}] ${data.taskTitle}`;
        const getStatusBadge = (status) => {
            switch (status) {
                case 'BACKLOG':
                    return { label: 'Backlog', color: '#6b7280', bg: '#f3f4f6' };
                case 'TODO':
                    return { label: 'Todo', color: '#4b5563', bg: '#f1f5f9' };
                case 'IN_PROGRESS':
                    return { label: 'In Progress', color: '#b45309', bg: '#fef3c7' };
                case 'IN_REVIEW':
                    return { label: 'In Review', color: '#7c3aed', bg: '#f3e8ff' };
                case 'DONE':
                    return { label: 'Done', color: '#059669', bg: '#ecfdf5' };
                case 'CANCELED':
                    return { label: 'Canceled', color: '#9ca3af', bg: '#f3f4f6' };
                default:
                    return { label: status || 'Todo', color: '#5e6ad2', bg: '#eef2ff' };
            }
        };
        const getPriorityBadge = (priority) => {
            switch (priority) {
                case 'URGENT':
                    return { label: 'Urgent', color: '#dc2626', bg: '#fee2e2' };
                case 'HIGH':
                    return { label: 'High', color: '#ea580c', bg: '#ffedd5' };
                case 'MEDIUM':
                    return { label: 'Medium', color: '#b45309', bg: '#fef3c7' };
                case 'LOW':
                    return { label: 'Low', color: '#2563eb', bg: '#eff6ff' };
                default:
                    return { label: 'No Priority', color: '#6b7280', bg: '#f3f4f6' };
            }
        };
        const statusBadge = getStatusBadge(data.taskStatus);
        const priorityBadge = getPriorityBadge(data.taskPriority);
        const formattedDescription = data.taskDescription
            ? data.taskDescription
                .replace(/&/g, '&amp;')
                .replace(/</g, '&lt;')
                .replace(/>/g, '&gt;')
                .replace(/\n/g, '<br/>')
            : '';
        const formattedDueDate = data.dueDate
            ? new Date(data.dueDate).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
            })
            : null;
        const actorInitials = data.actorName
            ? data.actorName
                .split(' ')
                .map((n) => n[0])
                .slice(0, 2)
                .join('')
                .toUpperCase()
            : 'U';
        const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${subject}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f6f7f9; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; -webkit-font-smoothing: antialiased;">
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #f6f7f9; padding: 40px 16px;">
    <tr>
      <td align="center">
        <!-- Main Card Container -->
        <table width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width: 580px; background-color: #ffffff; border-radius: 12px; border: 1px solid #e5e7eb; box-shadow: 0 4px 16px rgba(0, 0, 0, 0.04); overflow: hidden;">
          
          <!-- Card Header & Logo -->
          <tr>
            <td style="padding: 36px 36px 20px 36px;">
              <table cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td style="vertical-align: middle;">
                    <div style="width: 26px; height: 26px; background-color: #12131a; border-radius: 6px; text-align: center; line-height: 26px; color: #ffffff; font-weight: 800; font-size: 14px; font-family: sans-serif;">
                      ▲
                    </div>
                  </td>
                  <td style="vertical-align: middle; padding-left: 10px;">
                    <span style="font-size: 17px; font-weight: 700; color: #111827; letter-spacing: -0.3px;">Motion</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Main Title -->
          <tr>
            <td style="padding: 0 36px 18px 36px;">
              <h1 style="margin: 0; font-size: 22px; font-weight: 700; color: #111827; line-height: 1.35; letter-spacing: -0.4px;">
                You were assigned to an issue on Motion.
              </h1>
            </td>
          </tr>

          <!-- Actor & Assignment Notice -->
          <tr>
            <td style="padding: 0 36px 18px 36px;">
              <table cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td style="vertical-align: middle;">
                    <div style="width: 26px; height: 26px; border-radius: 50%; background-color: #5e6ad2; color: #ffffff; font-size: 11px; font-weight: 700; text-align: center; line-height: 26px;">
                      ${actorInitials}
                    </div>
                  </td>
                  <td style="vertical-align: middle; padding-left: 10px; font-size: 13px; color: #4b5563;">
                    <strong style="color: #111827; font-weight: 600;">${data.actorName}</strong> assigned this issue to you
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Task Details & Content Box -->
          <tr>
            <td style="padding: 0 36px 24px 36px;">
              <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 20px;">
                
                <!-- Identifier & Project -->
                <div style="margin-bottom: 8px;">
                  <span style="display: inline-block; padding: 3px 8px; font-size: 12px; font-weight: 700; color: #5e6ad2; background-color: #eef2ff; border-radius: 6px; font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, monospace; letter-spacing: -0.2px;">
                    ${data.taskIdentifier}
                  </span>
                  ${data.projectName ? `
                  <span style="font-size: 12px; color: #64748b; margin-left: 8px;">
                    in <strong>${data.projectName}</strong>
                  </span>
                  ` : ''}
                </div>

                <!-- Issue Title -->
                <h2 style="margin: 0 0 14px 0; font-size: 17px; font-weight: 600; color: #0f172a; line-height: 1.4;">
                  ${data.taskTitle}
                </h2>

                <!-- Task Metadata Badges -->
                <div style="margin-bottom: 14px;">
                  <table cellpadding="0" cellspacing="0" border="0">
                    <tr>
                      <!-- Status Badge -->
                      <td style="padding-right: 8px; padding-bottom: 4px;">
                        <span style="display: inline-block; padding: 4px 10px; font-size: 11px; font-weight: 600; color: ${statusBadge.color}; background-color: ${statusBadge.bg}; border-radius: 12px;">
                          ● ${statusBadge.label}
                        </span>
                      </td>

                      <!-- Priority Badge -->
                      <td style="padding-right: 8px; padding-bottom: 4px;">
                        <span style="display: inline-block; padding: 4px 10px; font-size: 11px; font-weight: 600; color: ${priorityBadge.color}; background-color: ${priorityBadge.bg}; border-radius: 12px;">
                          ${priorityBadge.label}
                        </span>
                      </td>

                      ${data.cycleName ? `
                      <td style="padding-right: 8px; padding-bottom: 4px;">
                        <span style="display: inline-block; padding: 4px 10px; font-size: 11px; font-weight: 600; color: #4338ca; background-color: #e0e7ff; border-radius: 12px;">
                          ↻ ${data.cycleName}
                        </span>
                      </td>
                      ` : ''}

                      ${formattedDueDate ? `
                      <td style="padding-right: 8px; padding-bottom: 4px;">
                        <span style="display: inline-block; padding: 4px 10px; font-size: 11px; font-weight: 600; color: #b45309; background-color: #fef3c7; border-radius: 12px;">
                          📅 Due ${formattedDueDate}
                        </span>
                      </td>
                      ` : ''}

                      ${data.estimate ? `
                      <td style="padding-right: 8px; padding-bottom: 4px;">
                        <span style="display: inline-block; padding: 4px 10px; font-size: 11px; font-weight: 600; color: #334155; background-color: #f1f5f9; border-radius: 12px;">
                          ${data.estimate} pts
                        </span>
                      </td>
                      ` : ''}
                    </tr>
                  </table>
                </div>

                <!-- Labels Row -->
                ${data.labels && data.labels.length > 0 ? `
                <div style="margin-bottom: 14px;">
                  ${data.labels.map(l => `<span style="display: inline-block; padding: 2px 8px; font-size: 11px; color: #475569; background-color: #f1f5f9; border: 1px solid #cbd5e1; border-radius: 4px; margin-right: 6px; margin-bottom: 4px;">#${l}</span>`).join('')}
                </div>
                ` : ''}

                <!-- Task Content / Description Section -->
                <div style="border-top: 1px solid #e2e8f0; padding-top: 14px;">
                  <div style="font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; color: #64748b; margin-bottom: 8px;">
                    Task Content / Description:
                  </div>
                  <div style="background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 8px; padding: 14px 16px; font-size: 13px; line-height: 1.6; color: #1e293b;">
                    ${formattedDescription || '<em style="color: #94a3b8;">No description provided for this task.</em>'}
                  </div>
                </div>

              </div>
            </td>
          </tr>

          <!-- Primary CTA Button -->
          <tr>
            <td style="padding: 0 36px 36px 36px;">
              <table cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td style="border-radius: 8px; background-color: #5e6ad2;">
                    <a href="${taskUrl}" target="_blank" style="display: inline-block; padding: 12px 24px; font-size: 13px; font-weight: 600; color: #ffffff; text-decoration: none; border-radius: 8px; letter-spacing: -0.1px;">
                      Open Issue in Motion &rarr;
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Divider -->
          <tr>
            <td style="border-top: 1px solid #f3f4f6; padding: 0;"></td>
          </tr>

          <!-- Card Footer -->
          <tr>
            <td style="padding: 20px 36px; background-color: #fafbfc; text-align: left;">
              <p style="margin: 0; font-size: 12px; color: #9ca3af; line-height: 1.5;">
                This notification was sent to <a href="mailto:${data.recipientEmail}" style="color: #6b7280; text-decoration: none;">${data.recipientEmail}</a> because you were assigned to <strong>${data.taskIdentifier}</strong> on Motion.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `;
        this.saveLocalEmailPreview(html);
        try {
            const info = await this.transporter.sendMail({
                from: this.fromAddress,
                to: data.recipientEmail,
                subject,
                html,
                text: `${data.actorName} assigned you to [${data.taskIdentifier}] ${data.taskTitle}\n\nStatus: ${statusBadge.label}\nPriority: ${priorityBadge.label}\nDescription:\n${data.taskDescription || 'No description provided.'}\n\nView task: ${taskUrl}`,
            });
            this.logger.log(`Assignment email dispatched for ${data.recipientEmail}`);
            const previewUrl = nodemailer.getTestMessageUrl(info);
            if (previewUrl) {
                this.logger.log(`📨 View Email in Browser (Ethereal Preview): ${previewUrl}`);
            }
            return true;
        }
        catch (err) {
            this.logger.error(`Failed to send assignment email to ${data.recipientEmail}: ${err.message}`);
            return false;
        }
    }
    async sendWorkspaceInvitationEmail(data) {
        if (!this.transporter) {
            await this.initTransporter();
        }
        if (!this.transporter) {
            this.logger.error('Transporter is not available');
            return false;
        }
        const acceptUrl = `${this.frontendUrl}/invitation/${data.token}`;
        const subject = `${data.actorName} invited you to join ${data.workspaceName} on Motion`;
        const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${subject}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f6f7f9; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #f6f7f9; padding: 40px 16px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width: 580px; background-color: #ffffff; border-radius: 12px; border: 1px solid #e5e7eb; box-shadow: 0 4px 16px rgba(0, 0, 0, 0.04); overflow: hidden;">
          <tr>
            <td style="padding: 24px 32px; border-bottom: 1px solid #f0f1f3; background-color: #090a0f;">
              <table width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td>
                    <div style="display: inline-block; width: 28px; height: 28px; background: linear-gradient(135deg, #5e6ad2, #8a95ff); border-radius: 6px; text-align: center; line-height: 28px; color: #ffffff; font-weight: bold; font-size: 14px;">M</div>
                    <span style="font-size: 16px; font-weight: 600; color: #ffffff; margin-left: 10px; vertical-align: middle;">Motion</span>
                  </td>
                  <td align="right">
                    <span style="font-size: 11px; text-transform: uppercase; font-weight: 700; letter-spacing: 0.5px; color: #8a95ff; background: rgba(94, 106, 210, 0.2); padding: 4px 8px; border-radius: 4px;">Team Invite</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding: 36px 32px 28px 32px;">
              <h1 style="margin: 0 0 16px 0; font-size: 20px; font-weight: 700; color: #111827; line-height: 1.3;">
                Join ${data.workspaceName}
              </h1>
              <p style="margin: 0 0 24px 0; font-size: 14px; color: #4b5563; line-height: 1.6;">
                <strong>${data.actorName}</strong> has invited you to join the <strong>${data.workspaceName}</strong> workspace on Motion as <strong>${data.role}</strong>.
              </p>
              <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 18px 20px; margin-bottom: 28px;">
                <p style="margin: 0; font-size: 13px; color: #64748b; line-height: 1.5;">
                  Collaborate with your team on issues, cycles, real-time documents, and roadmap planning.
                </p>
              </div>
              <table cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td align="center" style="border-radius: 8px; background-color: #5e6ad2;">
                    <a href="${acceptUrl}" target="_blank" style="display: inline-block; padding: 12px 28px; font-size: 14px; font-weight: 600; color: #ffffff; text-decoration: none; border-radius: 8px; letter-spacing: 0.2px;">
                      Accept Invitation &rarr;
                    </a>
                  </td>
                </tr>
              </table>
              <p style="margin: 24px 0 0 0; font-size: 12px; color: #9ca3af; line-height: 1.5;">
                Or accept directly inside your Motion Inbox if you are already signed in.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `;
        this.saveLocalEmailPreview(html);
        try {
            await this.transporter.sendMail({
                from: this.fromAddress,
                to: data.recipientEmail,
                subject,
                html,
                text: `${data.actorName} invited you to join ${data.workspaceName} on Motion.\n\nAccept invitation: ${acceptUrl}`,
            });
            this.logger.log(`Workspace invitation email sent to ${data.recipientEmail}`);
            return true;
        }
        catch (err) {
            this.logger.error(`Failed to send invitation email to ${data.recipientEmail}: ${err.message}`);
            return false;
        }
    }
};
EmailService = EmailService_1 = __decorate([
    Injectable(),
    __metadata("design:paramtypes", [ConfigService])
], EmailService);
export { EmailService };
//# sourceMappingURL=email.service.js.map