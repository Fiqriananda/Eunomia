import { Test, TestingModule } from '@nestjs/testing';
import { MobileController } from './mobile.controller.js';
import { MobileService } from './mobile.service.js';
import { TaskStatus, TaskPriority } from '@prisma/client';

describe('MobileController', () => {
  let controller: MobileController;
  let service: any;

  const mockMobileService = {
    getConfig: vi.fn().mockReturnValue({
      apiVersion: '1.0.0',
      minSupportedAppVersion: '1.0.0',
      serverTime: '2026-10-19T12:00:00.000Z',
      statuses: [],
      priorities: [],
      features: { fileUploads: true },
    }),
    getHome: vi.fn().mockResolvedValue({
      user: { id: 'usr_1', name: 'Alex Vance', email: 'alex@company.com' },
      currentWorkspace: { id: 'ws_1', name: 'Linear Corp', slug: 'linear-corp' },
      stats: { assignedCount: 2, inProgressCount: 1 },
      myAssignedTasks: [],
    }),
    getTasks: vi.fn().mockResolvedValue({
      items: [],
      total: 0,
      page: 1,
      totalPages: 0,
      hasMore: false,
    }),
    getTaskDetail: vi.fn().mockResolvedValue({
      id: 'task_1',
      identifier: 'LIN-1',
      title: 'Test Task',
    }),
    createTask: vi.fn().mockResolvedValue({
      id: 'task_2',
      identifier: 'LIN-2',
      title: 'New Mobile Task',
    }),
    updateTaskStatus: vi.fn().mockResolvedValue({
      id: 'task_1',
      status: TaskStatus.DONE,
    }),
    updateTaskPriority: vi.fn().mockResolvedValue({
      id: 'task_1',
      priority: TaskPriority.HIGH,
    }),
    addComment: vi.fn().mockResolvedValue({
      id: 'c_1',
      content: 'Hello',
    }),
    getNotifications: vi.fn().mockResolvedValue({
      notifications: [],
      unreadCount: 0,
    }),
    markNotificationRead: vi.fn().mockResolvedValue({ id: 'n_1', isRead: true }),
    markAllNotificationsRead: vi.fn().mockResolvedValue({ count: 2 }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [MobileController],
      providers: [
        {
          provide: MobileService,
          useValue: mockMobileService,
        },
      ],
    }).compile();

    controller = module.get<MobileController>(MobileController);
    service = module.get<MobileService>(MobileService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should return mobile config', () => {
    const config = controller.getConfig();
    expect(config.apiVersion).toBe('1.0.0');
    expect(service.getConfig).toHaveBeenCalled();
  });

  it('should return mobile home data', async () => {
    const home = await controller.getHome('usr_1', {});
    expect(home.user.email).toBe('alex@company.com');
    expect(service.getHome).toHaveBeenCalledWith('usr_1', {});
  });

  it('should return paginated tasks', async () => {
    const tasks = await controller.getTasks('usr_1', { page: 1, limit: 10 });
    expect(tasks.items).toEqual([]);
    expect(service.getTasks).toHaveBeenCalledWith('usr_1', { page: 1, limit: 10 });
  });

  it('should return task detail', async () => {
    const detail = await controller.getTaskDetail('usr_1', 'task_1');
    expect(detail.id).toBe('task_1');
    expect(service.getTaskDetail).toHaveBeenCalledWith('usr_1', 'task_1');
  });

  it('should create task', async () => {
    const res = await controller.createTask('usr_1', { title: 'New Task' });
    expect(res.id).toBe('task_2');
    expect(service.createTask).toHaveBeenCalledWith('usr_1', { title: 'New Task' });
  });

  it('should update task status', async () => {
    const res = await controller.updateStatus('usr_1', 'task_1', { status: TaskStatus.DONE });
    expect(res.status).toBe(TaskStatus.DONE);
    expect(service.updateTaskStatus).toHaveBeenCalledWith('usr_1', 'task_1', TaskStatus.DONE, undefined);
  });
});
