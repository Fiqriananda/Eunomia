var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { TaskStatus, TaskPriority, WorkspaceRole } from '@prisma/client';
import { EmailService } from '../email/email.service.js';
import { EventsGateway } from '../events/events.gateway.js';
import { NotificationsService } from '../notifications/notifications.service.js';
const taskIncludeConfig = {
    project: {
        select: { id: true, name: true, key: true, color: true },
    },
    cycle: {
        select: { id: true, number: true, name: true, status: true },
    },
    assignee: {
        select: { id: true, name: true, email: true, avatarUrl: true },
    },
    creator: {
        select: { id: true, name: true, email: true, avatarUrl: true },
    },
    requesterDivision: {
        select: { id: true, name: true, slug: true, isTechnical: true },
    },
    assignedDivision: {
        select: { id: true, name: true, slug: true, isTechnical: true },
    },
    parent: {
        select: { id: true, identifier: true, title: true, status: true, customStatus: true, priority: true },
    },
    subTasks: {
        include: {
            assignee: {
                select: { id: true, name: true, email: true, avatarUrl: true },
            },
            project: {
                select: { id: true, name: true, key: true, color: true },
            },
        },
        orderBy: [{ order: 'asc' }, { createdAt: 'asc' }],
    },
    sourceRelations: {
        include: {
            targetTask: {
                select: {
                    id: true,
                    identifier: true,
                    title: true,
                    status: true,
                    customStatus: true,
                    priority: true,
                    labels: true,
                    assignee: { select: { id: true, name: true, email: true, avatarUrl: true } },
                },
            },
        },
    },
    targetRelations: {
        include: {
            sourceTask: {
                select: {
                    id: true,
                    identifier: true,
                    title: true,
                    status: true,
                    customStatus: true,
                    priority: true,
                    labels: true,
                    assignee: { select: { id: true, name: true, email: true, avatarUrl: true } },
                },
            },
        },
    },
    attachments: true,
    reactions: {
        include: {
            user: {
                select: { id: true, name: true, email: true, avatarUrl: true },
            },
        },
        orderBy: { createdAt: 'asc' },
    },
    comments: {
        include: {
            user: {
                select: { id: true, name: true, email: true, avatarUrl: true },
            },
            parent: {
                select: {
                    id: true,
                    content: true,
                    user: { select: { id: true, name: true, email: true, avatarUrl: true } },
                },
            },
            replies: {
                include: {
                    user: {
                        select: { id: true, name: true, email: true, avatarUrl: true },
                    },
                    reactions: {
                        include: {
                            user: {
                                select: { id: true, name: true, email: true, avatarUrl: true },
                            },
                        },
                        orderBy: { createdAt: 'asc' },
                    },
                },
                orderBy: { createdAt: 'asc' },
            },
            reactions: {
                include: {
                    user: {
                        select: { id: true, name: true, email: true, avatarUrl: true },
                    },
                },
                orderBy: { createdAt: 'asc' },
            },
        },
        orderBy: { createdAt: 'asc' },
    },
    subscribers: {
        include: {
            user: {
                select: { id: true, name: true, email: true, avatarUrl: true },
            },
        },
        orderBy: { createdAt: 'asc' },
    },
    activities: {
        include: {
            user: {
                select: { id: true, name: true, email: true, avatarUrl: true },
            },
        },
        orderBy: { createdAt: 'desc' },
    },
};
let TasksService = class TasksService {
    prisma;
    emailService;
    eventsGateway;
    notificationsService;
    constructor(prisma, emailService, eventsGateway, notificationsService) {
        this.prisma = prisma;
        this.emailService = emailService;
        this.eventsGateway = eventsGateway;
        this.notificationsService = notificationsService;
    }
    formatStatusName(status, customStatus) {
        if (customStatus) {
            return customStatus
                .split('_')
                .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
                .join(' ');
        }
        switch (status) {
            case 'BACKLOG':
                return 'Backlog';
            case 'TODO':
                return 'Todo';
            case 'IN_PROGRESS':
                return 'In Progress';
            case 'DONE':
                return 'Done';
            case 'CANCELED':
                return 'Canceled';
            default:
                return status || 'Todo';
        }
    }
    async notifySubscribersOfTaskUpdate(taskId, actorId, changes, summaryTitle, excludeUserIds = []) {
        if (changes.length === 0)
            return;
        try {
            const task = await this.prisma.task.findUnique({
                where: { id: taskId },
                include: {
                    project: true,
                    subscribers: {
                        include: {
                            user: { select: { id: true, name: true, email: true, avatarUrl: true } },
                        },
                    },
                },
            });
            if (!task || !task.subscribers || task.subscribers.length === 0)
                return;
            let actorName = 'A team member';
            let actorAvatar = null;
            if (actorId) {
                const actor = await this.prisma.user.findUnique({
                    where: { id: actorId },
                    select: { name: true, avatarUrl: true },
                });
                if (actor) {
                    actorName = actor.name;
                    actorAvatar = actor.avatarUrl;
                }
            }
            const excluded = new Set([actorId, ...excludeUserIds].filter(Boolean));
            const targetSubscribers = task.subscribers.filter((s) => !excluded.has(s.userId));
            const changesText = changes
                .map((c) => `${c.field}: ${c.from ? `${c.from} → ` : ''}${c.to}`)
                .join(', ');
            for (const sub of targetSubscribers) {
                const notif = await this.prisma.inboxNotification.create({
                    data: {
                        userId: sub.userId,
                        actorId: actorId || task.creatorId,
                        taskId: task.id,
                        type: 'TASK_UPDATE',
                        title: `${actorName} updated ${task.identifier}: ${summaryTitle}`,
                        body: changesText,
                    },
                });
                this.eventsGateway.emitNotification(sub.userId, notif);
                this.emailService
                    .sendTaskUpdateNotification({
                    recipientEmail: sub.user.email,
                    recipientName: sub.user.name,
                    actorName,
                    actorAvatar,
                    taskIdentifier: task.identifier,
                    taskTitle: task.title,
                    taskId: task.id,
                    changeTitle: summaryTitle,
                    changes,
                    taskStatus: task.customStatus || task.status,
                    taskPriority: task.priority,
                    projectName: task.project?.name,
                    projectKey: task.project?.key,
                })
                    .catch((err) => console.error('Failed to send task update email:', err));
            }
            this.notificationsService
                .notifyTaskUpdated({
                taskId: task.id,
                identifier: task.identifier,
                taskTitle: task.title,
                actorName,
                changesText,
                recipientUserIds: targetSubscribers.map((s) => s.userId),
            })
                .catch((err) => console.error('Failed to send task update push notification:', err));
        }
        catch (err) {
            console.error('Failed to notify task subscribers:', err);
        }
    }
    async getTasks(params) {
        const { workspaceId, projectId, cycleId, status, priority, assigneeId, search, parentId, archived, requesterDivisionId, assignedDivisionId, triageStatus, includePendingTriage, } = params;
        const where = { workspaceId };
        if (archived === 'true') {
            where.isArchived = true;
        }
        else {
            where.isArchived = false;
        }
        if (projectId)
            where.projectId = projectId;
        if (cycleId)
            where.cycleId = cycleId;
        if (status)
            where.status = status;
        if (priority)
            where.priority = priority;
        if (assigneeId)
            where.assigneeId = assigneeId;
        if (requesterDivisionId)
            where.requesterDivisionId = requesterDivisionId;
        if (assignedDivisionId)
            where.assignedDivisionId = assignedDivisionId;
        if (triageStatus && triageStatus !== 'ALL') {
            where.triageStatus = triageStatus;
        }
        else if (includePendingTriage !== 'true' && !triageStatus) {
            where.OR = [
                { triageStatus: { not: 'INBOX_PENDING' } },
                { triageStatus: null },
            ];
        }
        if (parentId !== undefined) {
            if (parentId === 'null' || parentId === '') {
                where.parentId = null;
            }
            else {
                where.parentId = parentId;
            }
        }
        if (search) {
            where.OR = [
                { title: { contains: search, mode: 'insensitive' } },
                { description: { contains: search, mode: 'insensitive' } },
                { identifier: { contains: search, mode: 'insensitive' } },
            ];
        }
        return this.prisma.task.findMany({
            where,
            include: taskIncludeConfig,
            orderBy: [
                { order: 'asc' },
                { createdAt: 'desc' },
            ],
        });
    }
    async getTaskById(id) {
        const task = await this.prisma.task.findUnique({
            where: { id },
            include: taskIncludeConfig,
        });
        if (!task) {
            throw new NotFoundException(`Task with ID ${id} not found`);
        }
        return task;
    }
    async createTask(userId, data) {
        const project = await this.prisma.project.findUnique({
            where: { id: data.projectId },
        });
        if (!project) {
            throw new NotFoundException('Project not found');
        }
        const existingTasks = await this.prisma.task.findMany({
            where: { projectId: data.projectId },
            select: { identifier: true },
        });
        let maxNumber = 0;
        for (const t of existingTasks) {
            if (t.identifier) {
                const match = t.identifier.match(/-(\d+)$/);
                if (match) {
                    const num = parseInt(match[1], 10);
                    if (!isNaN(num) && num > maxNumber) {
                        maxNumber = num;
                    }
                }
            }
        }
        const identifier = `${project.key}-${maxNumber + 1}`;
        const lastTask = await this.prisma.task.findFirst({
            where: {
                workspaceId: data.workspaceId,
                status: data.status || TaskStatus.TODO,
            },
            orderBy: { order: 'desc' },
        });
        const order = lastTask ? lastTask.order + 1000 : 1000;
        const newTask = await this.prisma.task.create({
            data: {
                identifier,
                title: data.title,
                description: data.description,
                status: data.status || TaskStatus.TODO,
                customStatus: data.customStatus || null,
                priority: data.priority || TaskPriority.NO_PRIORITY,
                order,
                dueDate: data.dueDate ? new Date(data.dueDate) : undefined,
                labels: data.labels || [],
                projectId: data.projectId,
                workspaceId: data.workspaceId,
                cycleId: data.cycleId || null,
                estimate: data.estimate !== undefined ? data.estimate : 1,
                creatorId: userId,
                assigneeId: data.assigneeId || null,
                requesterDivisionId: data.requesterDivisionId || null,
                assignedDivisionId: data.assignedDivisionId || null,
                triageStatus: data.triageStatus || 'APPROVED_BACKLOG',
                externalMetadata: data.externalMetadata || null,
                parentId: data.parentId || null,
            },
            include: taskIncludeConfig,
        });
        if (data.parentId) {
            await this.prisma.taskActivity.create({
                data: {
                    type: 'SUBTASK_ADDED',
                    details: `added sub-issue ${newTask.identifier}`,
                    taskId: data.parentId,
                    userId,
                },
            });
        }
        if (data.assigneeId && data.assigneeId !== userId) {
            const creator = await this.prisma.user.findUnique({
                where: { id: userId },
                select: { name: true, avatarUrl: true },
            });
            await this.prisma.inboxNotification.create({
                data: {
                    userId: data.assigneeId,
                    actorId: userId,
                    taskId: newTask.id,
                    type: 'ASSIGNED',
                    title: `${creator?.name || 'Someone'} assigned you to ${newTask.identifier}`,
                    body: newTask.title,
                },
            });
            const assigneeUser = await this.prisma.user.findUnique({
                where: { id: data.assigneeId },
                select: { email: true, name: true },
            });
            if (assigneeUser) {
                this.emailService
                    .sendAssignmentNotification({
                    recipientEmail: assigneeUser.email,
                    recipientName: assigneeUser.name,
                    actorName: creator?.name || 'A team member',
                    actorAvatar: creator?.avatarUrl,
                    taskIdentifier: newTask.identifier,
                    taskTitle: newTask.title,
                    taskId: newTask.id,
                    taskDescription: newTask.description,
                    taskStatus: newTask.customStatus || newTask.status,
                    taskPriority: newTask.priority,
                    projectName: newTask.project?.name,
                    projectKey: newTask.project?.key,
                    cycleName: newTask.cycle?.name,
                    dueDate: newTask.dueDate,
                    labels: newTask.labels,
                    estimate: newTask.estimate,
                })
                    .catch((err) => console.error('Failed to send assignment email:', err));
            }
            this.notificationsService
                .notifyTaskAssigned({
                taskId: newTask.id,
                identifier: newTask.identifier,
                taskTitle: newTask.title,
                actorName: creator?.name || 'A team member',
                assigneeId: data.assigneeId,
            })
                .catch((err) => console.error('Failed to send task assignment push notification:', err));
        }
        await this.prisma.taskSubscription.upsert({
            where: { taskId_userId: { taskId: newTask.id, userId } },
            create: { taskId: newTask.id, userId },
            update: {},
        });
        if (data.assigneeId) {
            await this.prisma.taskSubscription.upsert({
                where: { taskId_userId: { taskId: newTask.id, userId: data.assigneeId } },
                create: { taskId: newTask.id, userId: data.assigneeId },
                update: {},
            });
        }
        this.eventsGateway.emitTaskCreated(newTask.workspaceId, newTask);
        return newTask;
    }
    async updateTask(id, data, userId) {
        const currentTask = await this.prisma.task.findUnique({
            where: { id },
            include: { assignee: true, parent: true, project: true, cycle: true },
        });
        if (!currentTask) {
            throw new NotFoundException(`Task with ID ${id} not found`);
        }
        if (userId) {
            const membership = await this.prisma.workspaceMember.findUnique({
                where: { workspaceId_userId: { workspaceId: currentTask.workspaceId, userId } },
            });
            if (membership?.role === 'STAKEHOLDER') {
                if (data.status !== undefined ||
                    data.customStatus !== undefined ||
                    data.assigneeId !== undefined ||
                    data.estimate !== undefined ||
                    data.cycleId !== undefined ||
                    data.isArchived !== undefined) {
                    throw new ForbiddenException('Stakeholders are not allowed to modify technical status, assignees, or sprint planning');
                }
                if (currentTask.triageStatus !== 'INBOX_PENDING' && currentTask.creatorId !== userId) {
                    throw new ForbiddenException('Stakeholders can only edit pending requests they created');
                }
            }
        }
        const updateData = { ...data };
        if (data.dueDate !== undefined) {
            updateData.dueDate = data.dueDate ? new Date(data.dueDate) : null;
        }
        if (data.parentId !== undefined) {
            updateData.parentId = data.parentId;
        }
        if (data.projectId && !data.identifier) {
            const project = await this.prisma.project.findUnique({
                where: { id: data.projectId },
            });
            if (project) {
                let suffix = '1';
                if (currentTask?.identifier) {
                    const match = currentTask.identifier.match(/-(\d+)$/);
                    if (match)
                        suffix = match[1];
                }
                updateData.identifier = `${project.key}-${suffix}`;
            }
        }
        await this.prisma.task.update({
            where: { id },
            data: updateData,
        });
        if (userId) {
            const statusChanged = (data.status !== undefined && data.status !== currentTask.status) ||
                (data.customStatus !== undefined && data.customStatus !== currentTask.customStatus);
            if (statusChanged) {
                const fromStatus = this.formatStatusName(currentTask.status, currentTask.customStatus);
                const toStatus = this.formatStatusName(data.status !== undefined ? data.status : currentTask.status, data.customStatus !== undefined ? data.customStatus : currentTask.customStatus);
                await this.prisma.taskActivity.create({
                    data: {
                        type: 'STATUS_CHANGE',
                        fromValue: fromStatus,
                        toValue: toStatus,
                        details: `moved from ${fromStatus} to ${toStatus}`,
                        taskId: id,
                        userId,
                    },
                });
            }
            if (data.assigneeId !== undefined && data.assigneeId !== currentTask.assigneeId) {
                if (data.assigneeId) {
                    await this.prisma.taskSubscription.upsert({
                        where: { taskId_userId: { taskId: id, userId: data.assigneeId } },
                        create: { taskId: id, userId: data.assigneeId },
                        update: {},
                    });
                    const newAssignee = await this.prisma.user.findUnique({
                        where: { id: data.assigneeId },
                        select: { name: true },
                    });
                    const newName = newAssignee?.name || 'Someone';
                    await this.prisma.taskActivity.create({
                        data: {
                            type: 'ASSIGNEE_CHANGE',
                            fromValue: currentTask.assignee?.name || null,
                            toValue: newName,
                            details: `re-assigned to ${newName}`,
                            taskId: id,
                            userId,
                        },
                    });
                    if (data.assigneeId !== userId) {
                        const actor = await this.prisma.user.findUnique({
                            where: { id: userId },
                            select: { name: true, avatarUrl: true },
                        });
                        const notif = await this.prisma.inboxNotification.create({
                            data: {
                                userId: data.assigneeId,
                                actorId: userId,
                                taskId: id,
                                type: 'ASSIGNED',
                                title: `${actor?.name || 'Someone'} assigned you to ${currentTask.identifier}`,
                                body: currentTask.title,
                            },
                        });
                        this.eventsGateway.emitNotification(data.assigneeId, notif);
                        const assigneeUser = await this.prisma.user.findUnique({
                            where: { id: data.assigneeId },
                            select: { email: true, name: true },
                        });
                        if (assigneeUser) {
                            this.emailService
                                .sendAssignmentNotification({
                                recipientEmail: assigneeUser.email,
                                recipientName: assigneeUser.name,
                                actorName: actor?.name || 'A team member',
                                actorAvatar: actor?.avatarUrl,
                                taskIdentifier: currentTask.identifier,
                                taskTitle: currentTask.title,
                                taskId: id,
                                taskDescription: data.description !== undefined
                                    ? data.description
                                    : currentTask.description,
                                taskStatus: data.customStatus !== undefined
                                    ? data.customStatus
                                    : data.status || currentTask.customStatus || currentTask.status,
                                taskPriority: data.priority || currentTask.priority,
                                projectName: currentTask.project?.name,
                                projectKey: currentTask.project?.key,
                                cycleName: currentTask.cycle?.name,
                                dueDate: data.dueDate !== undefined ? data.dueDate : currentTask.dueDate,
                                labels: data.labels || currentTask.labels,
                                estimate: data.estimate !== undefined
                                    ? data.estimate
                                    : currentTask.estimate,
                            })
                                .catch((err) => console.error('Failed to send assignment email:', err));
                        }
                        this.notificationsService
                            .notifyTaskAssigned({
                            taskId: id,
                            identifier: currentTask.identifier,
                            taskTitle: currentTask.title,
                            actorName: actor?.name || 'A team member',
                            assigneeId: data.assigneeId,
                        })
                            .catch((err) => console.error('Failed to send task assignment push notification:', err));
                    }
                }
                else {
                    await this.prisma.taskActivity.create({
                        data: {
                            type: 'ASSIGNEE_CHANGE',
                            fromValue: currentTask.assignee?.name || null,
                            toValue: 'Unassigned',
                            details: 'unassigned this issue',
                            taskId: id,
                            userId,
                        },
                    });
                }
            }
        }
        const changes = [];
        if ((data.status !== undefined && data.status !== currentTask.status) ||
            (data.customStatus !== undefined && data.customStatus !== currentTask.customStatus)) {
            const fromStatus = this.formatStatusName(currentTask.status, currentTask.customStatus);
            const toStatus = this.formatStatusName(data.status !== undefined ? data.status : currentTask.status, data.customStatus !== undefined ? data.customStatus : currentTask.customStatus);
            changes.push({ field: 'Status', from: fromStatus, to: toStatus });
        }
        if (data.priority !== undefined && data.priority !== currentTask.priority) {
            changes.push({ field: 'Priority', from: currentTask.priority, to: data.priority });
        }
        if (data.assigneeId !== undefined && data.assigneeId !== currentTask.assigneeId) {
            const newAssigneeUser = data.assigneeId
                ? await this.prisma.user.findUnique({ where: { id: data.assigneeId }, select: { name: true } })
                : null;
            changes.push({
                field: 'Assignee',
                from: currentTask.assignee?.name || 'Unassigned',
                to: newAssigneeUser?.name || 'Unassigned',
            });
        }
        if (data.title !== undefined && data.title !== currentTask.title) {
            changes.push({ field: 'Title', from: currentTask.title, to: data.title });
        }
        if (data.description !== undefined && data.description !== currentTask.description) {
            changes.push({ field: 'Description', to: 'Updated task description' });
        }
        if (data.dueDate !== undefined) {
            const oldDue = currentTask.dueDate ? new Date(currentTask.dueDate).toLocaleDateString() : 'None';
            const newDue = data.dueDate ? new Date(data.dueDate).toLocaleDateString() : 'None';
            if (oldDue !== newDue) {
                changes.push({ field: 'Due Date', from: oldDue, to: newDue });
            }
        }
        if (data.estimate !== undefined && data.estimate !== currentTask.estimate) {
            changes.push({
                field: 'Estimate',
                from: currentTask.estimate ? `${currentTask.estimate} pts` : 'None',
                to: `${data.estimate} pts`,
            });
        }
        if (changes.length > 0) {
            const summaryTitle = changes.map((c) => `${c.field} updated`).join(', ');
            const excludeIds = [];
            if (data.assigneeId && data.assigneeId !== userId) {
                excludeIds.push(data.assigneeId);
            }
            this.notifySubscribersOfTaskUpdate(id, userId, changes, summaryTitle, excludeIds).catch((err) => console.error('Failed to notify subscribers of task update:', err));
        }
        const updatedTask = await this.prisma.task.findUnique({
            where: { id },
            include: taskIncludeConfig,
        });
        if (updatedTask) {
            this.eventsGateway.emitTaskUpdated(updatedTask.workspaceId, updatedTask);
        }
        return updatedTask;
    }
    async moveTask(id, data, userId) {
        const currentTask = await this.prisma.task.findUnique({ where: { id } });
        if (!currentTask) {
            throw new NotFoundException(`Task with ID ${id} not found`);
        }
        if (userId) {
            const membership = await this.prisma.workspaceMember.findUnique({
                where: { workspaceId_userId: { workspaceId: currentTask.workspaceId, userId } },
            });
            if (membership?.role === 'STAKEHOLDER') {
                throw new ForbiddenException('Stakeholders are not allowed to change task status on board');
            }
        }
        const updateData = {};
        if (data.status !== undefined)
            updateData.status = data.status;
        if (data.customStatus !== undefined)
            updateData.customStatus = data.customStatus;
        if (data.priority !== undefined)
            updateData.priority = data.priority;
        if (data.targetOrder !== undefined)
            updateData.order = data.targetOrder;
        await this.prisma.task.update({
            where: { id },
            data: updateData,
        });
        if (userId) {
            const statusChanged = (data.status !== undefined && data.status !== currentTask.status) ||
                (data.customStatus !== undefined && data.customStatus !== currentTask.customStatus);
            if (statusChanged) {
                const fromStatus = this.formatStatusName(currentTask.status, currentTask.customStatus);
                const toStatus = this.formatStatusName(data.status !== undefined ? data.status : currentTask.status, data.customStatus !== undefined ? data.customStatus : currentTask.customStatus);
                await this.prisma.taskActivity.create({
                    data: {
                        type: 'STATUS_CHANGE',
                        fromValue: fromStatus,
                        toValue: toStatus,
                        details: `moved from ${fromStatus} to ${toStatus}`,
                        taskId: id,
                        userId,
                    },
                });
                this.notifySubscribersOfTaskUpdate(id, userId, [{ field: 'Status', from: fromStatus, to: toStatus }], `Moved to ${toStatus}`).catch((err) => console.error(err));
            }
        }
        const updated = await this.prisma.task.findUnique({
            where: { id },
            include: taskIncludeConfig,
        });
        if (updated) {
            this.eventsGateway.emitTaskMoved(updated.workspaceId, {
                taskId: id,
                status: data.status,
                customStatus: data.customStatus,
                priority: data.priority,
                targetOrder: data.targetOrder,
                userId,
                task: updated,
            });
        }
        return updated;
    }
    async logActivity(taskId, userId, data) {
        return this.prisma.taskActivity.create({
            data: {
                taskId,
                userId,
                type: data.type,
                details: data.details,
                fromValue: data.fromValue,
                toValue: data.toValue,
            },
            include: {
                user: {
                    select: { id: true, name: true, email: true, avatarUrl: true },
                },
            },
        });
    }
    async deleteTask(id, userId) {
        const existing = await this.prisma.task.findUnique({ where: { id } });
        if (!existing) {
            throw new NotFoundException(`Task with ID ${id} not found`);
        }
        if (userId) {
            const membership = await this.prisma.workspaceMember.findUnique({
                where: { workspaceId_userId: { workspaceId: existing.workspaceId, userId } },
            });
            if (membership?.role === 'STAKEHOLDER') {
                throw new ForbiddenException('Stakeholders are not allowed to delete tasks');
            }
        }
        const archivedTask = await this.prisma.task.update({
            where: { id },
            data: {
                isArchived: true,
                deletedAt: new Date(),
            },
            include: taskIncludeConfig,
        });
        if (userId) {
            await this.prisma.taskActivity.create({
                data: {
                    type: 'ARCHIVED',
                    details: 'archived this issue to trash',
                    taskId: id,
                    userId,
                },
            });
        }
        this.eventsGateway.emitTaskArchived(archivedTask.workspaceId, { taskId: id, userId });
        return archivedTask;
    }
    async restoreTask(id, userId) {
        const existing = await this.prisma.task.findUnique({ where: { id } });
        if (!existing) {
            throw new NotFoundException(`Task with ID ${id} not found`);
        }
        const restoredTask = await this.prisma.task.update({
            where: { id },
            data: {
                isArchived: false,
                deletedAt: null,
            },
            include: taskIncludeConfig,
        });
        if (userId) {
            await this.prisma.taskActivity.create({
                data: {
                    type: 'RESTORED',
                    details: 'restored this issue from trash',
                    taskId: id,
                    userId,
                },
            });
        }
        this.eventsGateway.emitTaskRestored(restoredTask.workspaceId, restoredTask);
        return restoredTask;
    }
    async permanentDeleteTask(id, userId) {
        const existing = await this.prisma.task.findUnique({ where: { id } });
        if (!existing) {
            throw new NotFoundException(`Task with ID ${id} not found`);
        }
        const deleted = await this.prisma.task.delete({
            where: { id },
        });
        this.eventsGateway.emitTaskDeleted(existing.workspaceId, { taskId: id, userId });
        return deleted;
    }
    async addComment(taskId, userId, content, parentId) {
        const task = await this.prisma.task.findUnique({
            where: { id: taskId },
            include: {
                workspace: {
                    include: {
                        members: {
                            include: { user: true },
                        },
                    },
                },
            },
        });
        if (!task) {
            throw new NotFoundException('Task not found');
        }
        const parentComment = parentId
            ? await this.prisma.comment.findUnique({
                where: { id: parentId },
                include: { user: true },
            })
            : null;
        const comment = await this.prisma.comment.create({
            data: {
                content,
                taskId,
                userId,
                parentId: parentId || null,
            },
            include: {
                user: {
                    select: { id: true, name: true, email: true, avatarUrl: true },
                },
                parent: {
                    select: {
                        id: true,
                        content: true,
                        user: { select: { id: true, name: true, email: true, avatarUrl: true } },
                    },
                },
            },
        });
        await this.prisma.taskSubscription.upsert({
            where: { taskId_userId: { taskId, userId } },
            create: { taskId, userId },
            update: {},
        });
        this.eventsGateway.emitCommentCreated(task.workspaceId, { taskId, comment });
        if (parentComment && parentComment.userId !== userId) {
            const replyNotif = await this.prisma.inboxNotification.create({
                data: {
                    userId: parentComment.userId,
                    actorId: userId,
                    taskId: task.id,
                    type: 'COMMENT_REPLY',
                    title: `${comment.user.name} replied to your comment on ${task.identifier}`,
                    body: content.length > 150 ? content.slice(0, 150) + '...' : content,
                },
            });
            this.eventsGateway.emitNotification(parentComment.userId, replyNotif);
            this.emailService
                .sendCommentReplyNotification({
                recipientEmail: parentComment.user.email,
                recipientName: parentComment.user.name,
                actorName: comment.user.name,
                actorAvatar: comment.user.avatarUrl,
                taskIdentifier: task.identifier,
                taskTitle: task.title,
                taskId: task.id,
                parentCommentContent: parentComment.content,
                replyContent: content,
            })
                .catch((err) => console.error('Failed to send comment reply email:', err));
            this.notificationsService
                .notifyCommentAdded({
                taskId: task.id,
                identifier: task.identifier,
                actorName: comment.user.name,
                content,
                recipientUserIds: [parentComment.userId],
                type: 'COMMENT_REPLY',
            })
                .catch((err) => console.error('Failed to send comment reply push notification:', err));
        }
        const lowerContent = content.toLowerCase();
        const members = task.workspace?.members || [];
        const mentionedUserIds = new Set();
        for (const m of members) {
            if (m.userId !== userId && m.userId !== parentComment?.userId) {
                const userName = m.user.name.toLowerCase();
                const userEmailName = m.user.email.split('@')[0].toLowerCase();
                const firstName = userName.split(' ')[0];
                if (lowerContent.includes(`@${userName}`) ||
                    lowerContent.includes(`@${userEmailName}`) ||
                    (firstName.length > 2 && lowerContent.includes(`@${firstName}`))) {
                    mentionedUserIds.add(m.userId);
                    const notif = await this.prisma.inboxNotification.create({
                        data: {
                            userId: m.userId,
                            actorId: userId,
                            taskId: task.id,
                            type: 'MENTIONED',
                            title: `${comment.user.name} mentioned you in ${task.identifier}`,
                            body: content.length > 150 ? content.slice(0, 150) + '...' : content,
                        },
                    });
                    this.eventsGateway.emitNotification(m.userId, notif);
                    this.emailService
                        .sendMentionNotification({
                        recipientEmail: m.user.email,
                        recipientName: m.user.name,
                        actorName: comment.user.name,
                        actorAvatar: comment.user.avatarUrl,
                        taskIdentifier: task.identifier,
                        taskTitle: task.title,
                        taskId: task.id,
                        commentContent: content,
                    })
                        .catch((err) => console.error('Failed to send mention email:', err));
                }
            }
        }
        if (mentionedUserIds.size > 0) {
            this.notificationsService
                .notifyCommentAdded({
                taskId: task.id,
                identifier: task.identifier,
                actorName: comment.user.name,
                content,
                recipientUserIds: Array.from(mentionedUserIds),
                type: 'MENTIONED',
            })
                .catch((err) => console.error('Failed to send mention push notification:', err));
        }
        const excludeIds = [
            parentComment?.userId,
            ...Array.from(mentionedUserIds),
        ].filter(Boolean);
        this.notifySubscribersOfTaskUpdate(taskId, userId, [
            {
                field: parentId ? 'New Reply' : 'New Comment',
                to: content.length > 120 ? content.slice(0, 120) + '...' : content,
            },
        ], parentId ? 'New reply posted' : 'New comment posted', excludeIds).catch((err) => console.error('Failed to notify task subscribers of new comment:', err));
        return comment;
    }
    async updateComment(commentId, userId, content) {
        const existing = await this.prisma.comment.findUnique({
            where: { id: commentId },
            include: {
                task: {
                    include: {
                        workspace: {
                            include: {
                                members: true,
                            },
                        },
                    },
                },
            },
        });
        if (!existing) {
            throw new NotFoundException('Comment not found');
        }
        const member = existing.task.workspace?.members?.find((m) => m.userId === userId);
        const isOwnerOrAdmin = member?.role === 'OWNER' || member?.role === 'ADMIN';
        if (existing.userId !== userId && !isOwnerOrAdmin) {
            throw new ForbiddenException('You do not have permission to edit this comment');
        }
        const updated = await this.prisma.comment.update({
            where: { id: commentId },
            data: {
                content,
            },
            include: {
                user: {
                    select: { id: true, name: true, email: true, avatarUrl: true },
                },
            },
        });
        this.eventsGateway.emitCommentUpdated(existing.task.workspaceId, {
            taskId: existing.taskId,
            comment: updated,
        });
        return updated;
    }
    async deleteComment(commentId, userId) {
        const existing = await this.prisma.comment.findUnique({
            where: { id: commentId },
            include: {
                task: {
                    include: {
                        workspace: {
                            include: {
                                members: true,
                            },
                        },
                    },
                },
            },
        });
        if (!existing) {
            throw new NotFoundException('Comment not found');
        }
        const member = existing.task.workspace?.members?.find((m) => m.userId === userId);
        const isOwnerOrAdmin = member?.role === 'OWNER' || member?.role === 'ADMIN';
        if (existing.userId !== userId && !isOwnerOrAdmin) {
            throw new ForbiddenException('You do not have permission to delete this comment');
        }
        const deleted = await this.prisma.comment.delete({
            where: {
                id: commentId,
            },
        });
        this.eventsGateway.emitCommentDeleted(existing.task.workspaceId, {
            taskId: existing.taskId,
            commentId,
        });
        return deleted;
    }
    async createSubTask(parentId, userId, data) {
        const parentTask = await this.prisma.task.findUnique({
            where: { id: parentId },
        });
        if (!parentTask) {
            throw new NotFoundException('Parent task not found');
        }
        return this.createTask(userId, {
            ...data,
            workspaceId: parentTask.workspaceId,
            projectId: data.projectId || parentTask.projectId,
            parentId,
        });
    }
    async linkSubTask(parentId, subTaskId, userId) {
        if (parentId === subTaskId) {
            throw new Error('Task cannot be a sub-issue of itself');
        }
        const [parentTask, subTask] = await Promise.all([
            this.prisma.task.findUnique({ where: { id: parentId } }),
            this.prisma.task.findUnique({ where: { id: subTaskId } }),
        ]);
        if (!parentTask || !subTask) {
            throw new NotFoundException('Parent or subtask not found');
        }
        const updated = await this.prisma.task.update({
            where: { id: subTaskId },
            data: { parentId },
            include: taskIncludeConfig,
        });
        await this.prisma.taskActivity.create({
            data: {
                type: 'SUBTASK_ADDED',
                details: `linked ${subTask.identifier} as sub-issue`,
                taskId: parentId,
                userId,
            },
        });
        return updated;
    }
    async unlinkSubTask(parentId, subTaskId, userId) {
        const subTask = await this.prisma.task.findUnique({ where: { id: subTaskId } });
        if (!subTask) {
            throw new NotFoundException('Subtask not found');
        }
        const updated = await this.prisma.task.update({
            where: { id: subTaskId },
            data: { parentId: null },
            include: taskIncludeConfig,
        });
        await this.prisma.taskActivity.create({
            data: {
                type: 'SUBTASK_REMOVED',
                details: `unlinked sub-issue ${subTask.identifier}`,
                taskId: parentId,
                userId,
            },
        });
        return updated;
    }
    async addRelation(taskId, userId, data) {
        if (taskId === data.targetTaskId) {
            throw new Error('Task cannot be related to itself');
        }
        const [sourceTask, targetTask] = await Promise.all([
            this.prisma.task.findUnique({ where: { id: taskId } }),
            this.prisma.task.findUnique({ where: { id: data.targetTaskId } }),
        ]);
        if (!sourceTask || !targetTask) {
            throw new NotFoundException('Task not found');
        }
        const relationType = data.type || 'RELATED';
        await this.prisma.taskRelation.upsert({
            where: {
                sourceTaskId_targetTaskId_type: {
                    sourceTaskId: taskId,
                    targetTaskId: data.targetTaskId,
                    type: relationType,
                },
            },
            update: {},
            create: {
                sourceTaskId: taskId,
                targetTaskId: data.targetTaskId,
                type: relationType,
            },
        });
        const typeLabels = {
            RELATED: 'related to',
            BLOCKS: 'blocks',
            BLOCKED_BY: 'blocked by',
            DUPLICATE: 'duplicate of',
        };
        await this.prisma.taskActivity.create({
            data: {
                type: 'RELATION_ADDED',
                details: `marked as ${typeLabels[relationType] || 'related to'} ${targetTask.identifier}`,
                taskId,
                userId,
            },
        });
        return this.getTaskById(taskId);
    }
    async deleteRelation(taskId, relationId, userId) {
        const relation = await this.prisma.taskRelation.findUnique({
            where: { id: relationId },
            include: { targetTask: true, sourceTask: true },
        });
        if (relation) {
            await this.prisma.taskRelation.delete({
                where: { id: relationId },
            });
            const otherIdentifier = relation.sourceTaskId === taskId
                ? relation.targetTask.identifier
                : relation.sourceTask.identifier;
            await this.prisma.taskActivity.create({
                data: {
                    type: 'RELATION_REMOVED',
                    details: `removed relation with ${otherIdentifier}`,
                    taskId,
                    userId,
                },
            });
        }
        return this.getTaskById(taskId);
    }
    async toggleTaskReaction(taskId, userId, emoji) {
        const task = await this.prisma.task.findUnique({
            where: { id: taskId },
            select: { id: true, workspaceId: true },
        });
        if (!task) {
            throw new NotFoundException('Task not found');
        }
        const trimmedEmoji = emoji.trim();
        if (!trimmedEmoji) {
            throw new Error('Emoji is required');
        }
        const existing = await this.prisma.taskReaction.findUnique({
            where: {
                taskId_userId_emoji: {
                    taskId,
                    userId,
                    emoji: trimmedEmoji,
                },
            },
        });
        if (existing) {
            await this.prisma.taskReaction.delete({
                where: { id: existing.id },
            });
            this.eventsGateway.emitTaskReactionToggled(task.workspaceId, {
                taskId,
                emoji: trimmedEmoji,
                userId,
                action: 'removed',
            });
            return { action: 'removed', emoji: trimmedEmoji, taskId, userId };
        }
        else {
            const created = await this.prisma.taskReaction.create({
                data: {
                    taskId,
                    userId,
                    emoji: trimmedEmoji,
                },
                include: {
                    user: {
                        select: { id: true, name: true, email: true, avatarUrl: true },
                    },
                },
            });
            this.eventsGateway.emitTaskReactionToggled(task.workspaceId, {
                taskId,
                emoji: trimmedEmoji,
                userId,
                user: created.user,
                action: 'added',
            });
            return { action: 'added', reaction: created, taskId, userId };
        }
    }
    async toggleCommentReaction(taskId, commentId, userId, emoji) {
        const comment = await this.prisma.comment.findUnique({
            where: { id: commentId },
            include: {
                task: {
                    select: { id: true, workspaceId: true },
                },
            },
        });
        if (!comment) {
            throw new NotFoundException('Comment not found');
        }
        const trimmedEmoji = emoji.trim();
        if (!trimmedEmoji) {
            throw new Error('Emoji is required');
        }
        const existing = await this.prisma.commentReaction.findUnique({
            where: {
                commentId_userId_emoji: {
                    commentId,
                    userId,
                    emoji: trimmedEmoji,
                },
            },
        });
        if (existing) {
            await this.prisma.commentReaction.delete({
                where: { id: existing.id },
            });
            this.eventsGateway.emitCommentReactionToggled(comment.task.workspaceId, {
                taskId: comment.taskId,
                commentId,
                emoji: trimmedEmoji,
                userId,
                action: 'removed',
            });
            return { action: 'removed', emoji: trimmedEmoji, commentId, taskId: comment.taskId, userId };
        }
        else {
            const created = await this.prisma.commentReaction.create({
                data: {
                    commentId,
                    userId,
                    emoji: trimmedEmoji,
                },
                include: {
                    user: {
                        select: { id: true, name: true, email: true, avatarUrl: true },
                    },
                },
            });
            this.eventsGateway.emitCommentReactionToggled(comment.task.workspaceId, {
                taskId: comment.taskId,
                commentId,
                emoji: trimmedEmoji,
                userId,
                user: created.user,
                action: 'added',
            });
            return { action: 'added', reaction: created, commentId, taskId: comment.taskId, userId };
        }
    }
    async subscribeToTask(taskId, userId) {
        const task = await this.prisma.task.findUnique({
            where: { id: taskId },
            select: { id: true, workspaceId: true },
        });
        if (!task) {
            throw new NotFoundException('Task not found');
        }
        const subscription = await this.prisma.taskSubscription.upsert({
            where: { taskId_userId: { taskId, userId } },
            create: { taskId, userId },
            update: {},
            include: {
                user: {
                    select: { id: true, name: true, email: true, avatarUrl: true },
                },
            },
        });
        return { success: true, subscription };
    }
    async unsubscribeFromTask(taskId, userId) {
        await this.prisma.taskSubscription.deleteMany({
            where: { taskId, userId },
        });
        return { success: true };
    }
    async getTaskSubscribers(taskId) {
        return this.prisma.taskSubscription.findMany({
            where: { taskId },
            include: {
                user: {
                    select: { id: true, name: true, email: true, avatarUrl: true },
                },
            },
            orderBy: { createdAt: 'asc' },
        });
    }
    async createIntakeRequest(userId, data) {
        let finalRequesterDivisionId = data.requesterDivisionId;
        if (!finalRequesterDivisionId && data.customDivisionName?.trim()) {
            const cleanName = data.customDivisionName.trim();
            const slug = cleanName
                .toLowerCase()
                .replace(/[^a-z0-9]+/g, '-')
                .replace(/(^-|-$)/g, '') || `div-${Date.now()}`;
            let division = await this.prisma.division.findFirst({
                where: {
                    workspaceId: data.workspaceId,
                    OR: [
                        { name: { equals: cleanName, mode: 'insensitive' } },
                        { slug: { equals: slug, mode: 'insensitive' } },
                    ],
                },
            });
            if (!division) {
                division = await this.prisma.division.create({
                    data: {
                        workspaceId: data.workspaceId,
                        name: cleanName,
                        slug,
                        isTechnical: false,
                    },
                });
            }
            finalRequesterDivisionId = division.id;
        }
        let project = await this.prisma.project.findFirst({
            where: { workspaceId: data.workspaceId },
            orderBy: { createdAt: 'asc' },
        });
        if (!project) {
            project = await this.prisma.project.create({
                data: {
                    name: 'General',
                    key: 'REQ',
                    workspaceId: data.workspaceId,
                },
            });
        }
        let priority = TaskPriority.MEDIUM;
        if (data.urgency === 'HIGH')
            priority = TaskPriority.HIGH;
        else if (data.urgency === 'LOW')
            priority = TaskPriority.LOW;
        const existingTasks = await this.prisma.task.findMany({
            where: { projectId: project.id },
            select: { identifier: true },
        });
        let maxNumber = 0;
        for (const t of existingTasks) {
            if (t.identifier) {
                const match = t.identifier.match(/-(\d+)$/);
                if (match) {
                    const num = parseInt(match[1], 10);
                    if (!isNaN(num) && num > maxNumber) {
                        maxNumber = num;
                    }
                }
            }
        }
        const identifier = `${project.key}-${maxNumber + 1}`;
        const lastTask = await this.prisma.task.findFirst({
            where: { workspaceId: data.workspaceId },
            orderBy: { order: 'desc' },
        });
        const order = lastTask ? lastTask.order + 1000 : 1000;
        const externalMetadata = {
            urgency: data.urgency || 'MEDIUM',
            targetDeadline: data.targetDeadline || null,
            assetLinks: data.assetLinks || null,
            businessObjective: data.businessObjective || null,
            targetAudience: data.targetAudience || null,
            submittedAt: new Date().toISOString(),
        };
        const task = await this.prisma.task.create({
            data: {
                identifier,
                title: data.title,
                description: data.description,
                status: TaskStatus.BACKLOG,
                priority,
                order,
                dueDate: data.targetDeadline ? new Date(data.targetDeadline) : undefined,
                projectId: project.id,
                workspaceId: data.workspaceId,
                creatorId: userId,
                requesterDivisionId: finalRequesterDivisionId || null,
                triageStatus: 'INBOX_PENDING',
                externalMetadata,
            },
            include: taskIncludeConfig,
        });
        await this.prisma.taskSubscription.upsert({
            where: { taskId_userId: { taskId: task.id, userId } },
            create: { taskId: task.id, userId },
            update: {},
        });
        await this.prisma.taskActivity.create({
            data: {
                type: 'CUSTOM',
                details: `submitted request via Intake Form for cross-division review`,
                taskId: task.id,
                userId,
            },
        });
        const admins = await this.prisma.workspaceMember.findMany({
            where: {
                workspaceId: data.workspaceId,
                role: { in: [WorkspaceRole.OWNER, WorkspaceRole.ADMIN] },
                userId: { not: userId },
            },
            include: { user: true },
        });
        const creator = await this.prisma.user.findUnique({
            where: { id: userId },
            select: { name: true },
        });
        for (const admin of admins) {
            const notif = await this.prisma.inboxNotification.create({
                data: {
                    userId: admin.userId,
                    actorId: userId,
                    taskId: task.id,
                    workspaceId: data.workspaceId,
                    type: 'INTAKE_REQUEST',
                    title: `New Intake Request: ${task.identifier}`,
                    body: `${creator?.name || 'A stakeholder'} submitted: "${task.title}"`,
                },
            });
            this.eventsGateway.emitNotification(admin.userId, notif);
        }
        return task;
    }
    async getTriageRequests(workspaceId, userId) {
        const membership = await this.prisma.workspaceMember.findUnique({
            where: { workspaceId_userId: { workspaceId, userId } },
        });
        if (!membership) {
            throw new ForbiddenException('You do not have access to this workspace');
        }
        return this.prisma.task.findMany({
            where: {
                workspaceId,
                triageStatus: 'INBOX_PENDING',
                isArchived: false,
            },
            include: taskIncludeConfig,
            orderBy: { createdAt: 'desc' },
        });
    }
    async updateTriageStatus(taskId, userId, action, options) {
        const task = await this.prisma.task.findUnique({
            where: { id: taskId },
            include: { workspace: true, creator: true },
        });
        if (!task)
            throw new NotFoundException('Task not found');
        const membership = await this.prisma.workspaceMember.findUnique({
            where: { workspaceId_userId: { workspaceId: task.workspaceId, userId } },
        });
        if (action === 'RESUBMIT') {
            const isCreator = task.creatorId === userId;
            const isMember = !!membership;
            if (!isCreator && !isMember) {
                throw new ForbiddenException('You do not have permission to resubmit this request');
            }
        }
        else {
            if (!membership ||
                (membership.role !== WorkspaceRole.OWNER &&
                    membership.role !== WorkspaceRole.ADMIN &&
                    membership.role !== WorkspaceRole.MEMBER)) {
                throw new ForbiddenException('Only technical members or admins can triage requests');
            }
        }
        const reviewer = await this.prisma.user.findUnique({
            where: { id: userId },
            select: { name: true, avatarUrl: true },
        });
        if (action === 'APPROVE') {
            const updated = await this.prisma.task.update({
                where: { id: taskId },
                data: {
                    triageStatus: 'APPROVED_BACKLOG',
                    priority: options?.priority || task.priority,
                    estimate: options?.estimate !== undefined ? options?.estimate : task.estimate,
                    cycleId: options?.cycleId !== undefined ? options?.cycleId : task.cycleId,
                    status: options?.status || TaskStatus.BACKLOG,
                },
                include: taskIncludeConfig,
            });
            await this.prisma.taskActivity.create({
                data: {
                    type: 'CUSTOM',
                    details: `approved request into technical backlog`,
                    taskId,
                    userId,
                },
            });
            if (options?.comment?.trim()) {
                await this.addComment(taskId, userId, options.comment.trim());
            }
            if (task.creatorId !== userId) {
                const notif = await this.prisma.inboxNotification.create({
                    data: {
                        userId: task.creatorId,
                        actorId: userId,
                        taskId,
                        workspaceId: task.workspaceId,
                        type: 'TRIAGE_APPROVED',
                        title: `Request Approved: ${task.identifier}`,
                        body: `${reviewer?.name || 'Lead Dev'} approved your request "${task.title}" to Backlog.`,
                    },
                });
                this.eventsGateway.emitNotification(task.creatorId, notif);
            }
            this.eventsGateway.emitTaskUpdated(task.workspaceId, updated);
            return updated;
        }
        else if (action === 'RESUBMIT') {
            const updated = await this.prisma.task.update({
                where: { id: taskId },
                data: {
                    triageStatus: 'INBOX_PENDING',
                },
                include: taskIncludeConfig,
            });
            await this.prisma.taskActivity.create({
                data: {
                    type: 'CUSTOM',
                    details: `resubmitted request with updates for triage review`,
                    taskId,
                    userId,
                },
            });
            if (options?.comment?.trim()) {
                await this.addComment(taskId, userId, options.comment.trim());
            }
            const adminMembers = await this.prisma.workspaceMember.findMany({
                where: {
                    workspaceId: task.workspaceId,
                    role: { in: [WorkspaceRole.OWNER, WorkspaceRole.ADMIN, WorkspaceRole.MEMBER] },
                    userId: { not: userId },
                },
                select: { userId: true },
            });
            for (const m of adminMembers) {
                const notif = await this.prisma.inboxNotification.create({
                    data: {
                        userId: m.userId,
                        actorId: userId,
                        taskId,
                        workspaceId: task.workspaceId,
                        type: 'TRIAGE_REJECTED',
                        title: `Request Resubmitted: ${task.identifier}`,
                        body: `${reviewer?.name || 'Requester'} updated and resubmitted "${task.title}".`,
                    },
                });
                this.eventsGateway.emitNotification(m.userId, notif);
            }
            this.eventsGateway.emitTaskUpdated(task.workspaceId, updated);
            return updated;
        }
        else {
            const updated = await this.prisma.task.update({
                where: { id: taskId },
                data: {
                    triageStatus: 'REJECTED',
                },
                include: taskIncludeConfig,
            });
            await this.prisma.taskActivity.create({
                data: {
                    type: 'CUSTOM',
                    details: `rejected request / requested revisions`,
                    taskId,
                    userId,
                },
            });
            if (options?.comment?.trim()) {
                await this.addComment(taskId, userId, options.comment.trim());
            }
            if (task.creatorId !== userId) {
                const notif = await this.prisma.inboxNotification.create({
                    data: {
                        userId: task.creatorId,
                        actorId: userId,
                        taskId,
                        workspaceId: task.workspaceId,
                        type: 'TRIAGE_REJECTED',
                        title: `Request Needs Revision: ${task.identifier}`,
                        body: `${reviewer?.name || 'Lead Dev'} responded to your request "${task.title}".`,
                    },
                });
                this.eventsGateway.emitNotification(task.creatorId, notif);
            }
            this.eventsGateway.emitTaskUpdated(task.workspaceId, updated);
            return updated;
        }
    }
};
TasksService = __decorate([
    Injectable(),
    __metadata("design:paramtypes", [PrismaService,
        EmailService,
        EventsGateway,
        NotificationsService])
], TasksService);
export { TasksService };
//# sourceMappingURL=tasks.service.js.map