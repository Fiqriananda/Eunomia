import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NotificationsService } from './notifications.service.js';

describe('NotificationsService', () => {
  let service: NotificationsService;
  let mockPrisma: any;
  let mockConfig: any;

  beforeEach(() => {
    mockPrisma = {
      deviceToken: {
        upsert: vi.fn().mockResolvedValue({ id: 'tok_1', token: 'sample_token', userId: 'usr_1' }),
        deleteMany: vi.fn().mockResolvedValue({ count: 1 }),
        findMany: vi.fn().mockResolvedValue([{ token: 'tok_abc' }]),
      },
    };

    mockConfig = {
      get: vi.fn().mockReturnValue('./eunomia-20e00-firebase-adminsdk-fbsvc-c0ebff3423.json'),
    };

    service = new NotificationsService(mockPrisma, mockConfig);
  });

  it('should initialize and register device token', async () => {
    const res = await service.registerDeviceToken('usr_1', {
      token: 'sample_token',
      platform: 'android',
      deviceModel: 'Pixel 8',
    });

    expect(mockPrisma.deviceToken.upsert).toHaveBeenCalledWith({
      where: { token: 'sample_token' },
      create: {
        token: 'sample_token',
        platform: 'android',
        deviceModel: 'Pixel 8',
        userId: 'usr_1',
      },
      update: {
        userId: 'usr_1',
        platform: 'android',
        deviceModel: 'Pixel 8',
        updatedAt: expect.any(Date),
      },
    });
    expect(res).toEqual({ id: 'tok_1', token: 'sample_token', userId: 'usr_1' });
  });

  it('should unregister device token', async () => {
    const res = await service.unregisterDeviceToken('usr_1', 'sample_token');
    expect(mockPrisma.deviceToken.deleteMany).toHaveBeenCalledWith({
      where: {
        token: 'sample_token',
        userId: 'usr_1',
      },
    });
    expect(res).toEqual({ success: true });
  });

  it('should format task update push notification properly', async () => {
    const sendSpy = vi.spyOn(service, 'sendToUsers').mockResolvedValue(undefined as any);

    await service.notifyTaskUpdated({
      taskId: 'task_1',
      identifier: 'LIN-10',
      taskTitle: 'Redesign Login',
      actorName: 'Alice',
      changesText: 'Status: In Progress → Done',
      recipientUserIds: ['usr_2', 'usr_3'],
    });

    expect(sendSpy).toHaveBeenCalledWith(['usr_2', 'usr_3'], {
      title: 'Alice updated LIN-10',
      body: 'Status: In Progress → Done on "Redesign Login"',
      data: {
        type: 'TASK_UPDATE',
        taskId: 'task_1',
        identifier: 'LIN-10',
      },
    });
  });

  it('should format comment push notification properly for mentions', async () => {
    const sendSpy = vi.spyOn(service, 'sendToUsers').mockResolvedValue(undefined as any);

    await service.notifyCommentAdded({
      taskId: 'task_1',
      identifier: 'LIN-10',
      actorName: 'Bob',
      content: 'Hey @Alice check this out',
      recipientUserIds: ['usr_2'],
      type: 'MENTIONED',
    });

    expect(sendSpy).toHaveBeenCalledWith(['usr_2'], {
      title: 'Bob mentioned you on LIN-10',
      body: 'Hey @Alice check this out',
      data: {
        type: 'MENTIONED',
        taskId: 'task_1',
        identifier: 'LIN-10',
      },
    });
  });

  it('should format task assignment push notification properly', async () => {
    const sendSpy = vi.spyOn(service, 'sendToUser').mockResolvedValue(undefined as any);

    await service.notifyTaskAssigned({
      taskId: 'task_1',
      identifier: 'LIN-10',
      taskTitle: 'Refactor Auth',
      actorName: 'Charlie',
      assigneeId: 'usr_5',
    });

    expect(sendSpy).toHaveBeenCalledWith('usr_5', {
      title: 'Assigned to LIN-10',
      body: 'Charlie assigned you to "Refactor Auth"',
      data: {
        type: 'ASSIGNED',
        taskId: 'task_1',
        identifier: 'LIN-10',
      },
    });
  });
});
