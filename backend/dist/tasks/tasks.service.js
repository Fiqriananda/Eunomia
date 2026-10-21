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
import { TaskStatus, TaskPriority } from '@prisma/client';
import { EmailService } from '../email/email.service.js';
import { EventsGateway } from '../events/events.gateway.js';
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
    comments: {
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
    constructor(prisma, emailService, eventsGateway) {
        this.prisma = prisma;
        this.emailService = emailService;
        this.eventsGateway = eventsGateway;
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
    async getTasks(params) {
        const { workspaceId, projectId, cycleId, status, priority, assigneeId, search, parentId, archived } = params;
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
    async addComment(taskId, userId, content) {
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
        const comment = await this.prisma.comment.create({
            data: {
                content,
                taskId,
                userId,
            },
            include: {
                user: {
                    select: { id: true, name: true, email: true, avatarUrl: true },
                },
            },
        });
        this.eventsGateway.emitCommentCreated(task.workspaceId, { taskId, comment });
        const lowerContent = content.toLowerCase();
        const members = task.workspace?.members || [];
        for (const m of members) {
            if (m.userId !== userId) {
                const userName = m.user.name.toLowerCase();
                const userEmailName = m.user.email.split('@')[0].toLowerCase();
                const firstName = userName.split(' ')[0];
                if (lowerContent.includes(`@${userName}`) ||
                    lowerContent.includes(`@${userEmailName}`) ||
                    (firstName.length > 2 && lowerContent.includes(`@${firstName}`))) {
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
};
TasksService = __decorate([
    Injectable(),
    __metadata("design:paramtypes", [PrismaService,
        EmailService,
        EventsGateway])
], TasksService);
export { TasksService };
//# sourceMappingURL=tasks.service.js.map