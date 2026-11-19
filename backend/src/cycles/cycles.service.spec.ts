import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TaskStatus } from '@prisma/client';
import { CyclesService } from './cycles.service.js';

describe('CyclesService', () => {
  let service: CyclesService;
  let mockPrisma: any;

  beforeEach(() => {
    mockPrisma = {
      cycle: {
        findMany: vi.fn().mockResolvedValue([
          {
            id: 'cyc_1',
            number: 1,
            name: 'Cycle 1',
            status: 'ACTIVE',
            workspaceId: 'ws_1',
            _count: { tasks: 4 },
          },
        ]),
        findUnique: vi.fn().mockResolvedValue({ id: 'cyc_1', workspaceId: 'ws_1' }),
        update: vi.fn().mockResolvedValue({ id: 'cyc_1', status: 'COMPLETED' }),
      },
      task: {
        findMany: vi.fn().mockResolvedValue([
          { status: TaskStatus.DONE, estimate: 2 },
          { status: TaskStatus.IN_PROGRESS, estimate: 1 },
          { status: TaskStatus.TODO, estimate: null },
          { status: TaskStatus.DONE, estimate: 0 },
        ]),
        updateMany: vi.fn().mockResolvedValue({ count: 2 }),
      },
    };

    service = new CyclesService(mockPrisma);
  });

  it('returns matching metrics and stats for cycle tasks', async () => {
    const cycles = await service.getCycles('ws_1');

    expect(cycles).toHaveLength(1);
    expect(cycles[0].metrics).toEqual({
      totalTasks: 4,
      completedTasks: 2,
      remainingTasks: 2,
      inProgressTasks: 1,
      todoTasks: 1,
      totalPoints: 4,
      completedPoints: 2,
      remainingPoints: 2,
      completionPercentage: 50,
      velocityPercentage: 50,
    });
    expect(cycles[0].stats).toEqual(cycles[0].metrics);
  });

  it('excludes DONE and CANCELED tasks on rollover', async () => {
    mockPrisma.task.findMany.mockResolvedValueOnce([{ id: 'task_1' }]);

    const res = await service.rolloverCycle('cyc_1', { targetCycleId: 'cyc_2' });

    expect(mockPrisma.task.findMany).toHaveBeenCalledWith({
      where: {
        cycleId: 'cyc_1',
        status: { notIn: [TaskStatus.DONE, TaskStatus.CANCELED] },
        isArchived: false,
      },
      select: { id: true },
    });
    expect(mockPrisma.task.updateMany).toHaveBeenCalledWith({
      where: { id: { in: ['task_1'] } },
      data: { cycleId: 'cyc_2' },
    });
    expect(res.rolledOverCount).toBe(1);
  });
});

