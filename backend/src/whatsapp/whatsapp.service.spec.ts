import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { WorkspaceRole } from '@prisma/client';
import { WhatsappService, normalizeWhatsappNumber } from './whatsapp.service.js';

describe('WhatsappService', () => {
  let service: WhatsappService;
  let mockPrisma: any;
  let mockConfig: any;
  const originalFetch = global.fetch;

  beforeEach(() => {
    mockPrisma = {
      workspaceMember: {
        findUnique: vi.fn().mockResolvedValue({ role: WorkspaceRole.OWNER }),
      },
      workspace: {
        findUnique: vi.fn().mockResolvedValue({
          id: 'ws-1234567890abcdef',
          name: 'Motion Laboratory',
          whatsappEnabled: true,
          whatsappSessionName: 'ws_ws1234567890abcd',
        }),
        update: vi.fn().mockResolvedValue({
          id: 'ws-1234567890abcdef',
          whatsappEnabled: true,
          whatsappSessionName: 'ws_ws1234567890abcd',
        }),
      },
      user: {
        findUnique: vi.fn().mockResolvedValue({
          name: 'Fiqri',
          whatsappNumber: '6281234567890',
          whatsappNotifications: true,
        }),
        findMany: vi.fn().mockResolvedValue([
          {
            id: 'usr_2',
            whatsappNumber: '6281234567890',
          },
        ]),
      },
    };

    mockConfig = {
      get: vi.fn((key: string) => {
        if (key === 'WAHA_URL') return 'http://waha:3000';
        if (key === 'WAHA_API_KEY') return 'secret-key';
        if (key === 'FRONTEND_URL') return 'https://eunomia.example.com';
        if (key === 'WAHA_MENTION_BURST_DELAY_MS') return '0';
        return undefined;
      }),
    };

    service = new WhatsappService(mockPrisma, mockConfig);
  });

  afterEach(() => {
    global.fetch = originalFetch;
    vi.restoreAllMocks();
  });

  it('normalizes Indonesian and international phone numbers', () => {
    expect(normalizeWhatsappNumber('0812-3456-7890')).toBe('6281234567890');
    expect(normalizeWhatsappNumber('+62 812 3456 7890')).toBe('6281234567890');
    expect(normalizeWhatsappNumber('   ')).toBeNull();
    expect(() => normalizeWhatsappNumber('123')).toThrow();
  });

  it('fetches QR data URL when WAHA session status is SCAN_QR_CODE', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ status: 'SCAN_QR_CODE', me: null }), {
          status: 200,
          headers: { 'content-type': 'application/json' },
        }),
      )
      .mockResolvedValueOnce(
        new Response(Buffer.from('fake-png-bytes'), {
          status: 200,
          headers: { 'content-type': 'image/png' },
        }),
      );
    global.fetch = fetchMock as any;

    const status = await service.getStatus('ws-1234567890abcdef', 'usr_1');

    expect(status.status).toBe('SCAN_QR_CODE');
    expect(status.qrDataUrl).toBe(
      `data:image/png;base64,${Buffer.from('fake-png-bytes').toString('base64')}`,
    );
    expect(fetchMock).toHaveBeenCalledWith(
      'http://waha:3000/api/sessions/ws_ws1234567890abcd',
      expect.objectContaining({
        headers: expect.objectContaining({ 'X-Api-Key': 'secret-key' }),
      }),
    );
  });

  it('sends WhatsApp reminder when task is assigned and workspace bot is enabled', async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({ id: 'msg_1' }), { status: 201 }));
    global.fetch = fetchMock as any;

    await service.notifyTaskAssigned({
      workspaceId: 'ws-1234567890abcdef',
      assigneeId: 'usr_2',
      taskId: 'task_99',
      identifier: 'MTN-35',
      taskTitle: 'Form Tambah Project Showcase',
      actorName: 'Admin',
      description: '### Scope\nBuat **form** upload [spec](https://example.com) dan `validasi`.',
      status: 'Todo',
      projectName: 'Motion One',
      cycleName: 'Sprint 1',
      priority: 'HIGH',
      labels: ['Frontend', 'UI'],
      estimate: 2,
    });

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe('http://waha:3000/api/sendText');
    const body = JSON.parse(init.body);
    expect(body.session).toBe('ws_ws1234567890abcd');
    expect(body.chatId).toBe('6281234567890@c.us');
    expect(body.text).toContain('MTN-35');
    expect(body.text).toContain('Project: Motion One • Status: Todo');
    expect(body.text).toContain('Priority: HIGH • Cycle: Sprint 1 • Estimate: 2 pts');
    expect(body.text).toContain('Label: Frontend, UI');
    expect(body.text).toContain('Detail:\nScope Buat form upload spec dan validasi.');
    expect(body.text).toContain('https://eunomia.example.com/issue/task_99');
  });

  it('skips sending WhatsApp reminder when user opted out', async () => {
    mockPrisma.user.findUnique.mockResolvedValueOnce({
      name: 'Fiqri',
      whatsappNumber: '6281234567890',
      whatsappNotifications: false,
    });
    const fetchMock = vi.fn();
    global.fetch = fetchMock as any;

    await service.notifyTaskAssigned({
      workspaceId: 'ws-1234567890abcdef',
      assigneeId: 'usr_2',
      taskId: 'task_99',
      identifier: 'MTN-35',
      taskTitle: 'Form Tambah Project Showcase',
      actorName: 'Admin',
    });

    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('sends WhatsApp mention reminder once per task within cooldown window (anti-spam)', async () => {
    const fetchMock = vi
      .fn()
      .mockImplementation(() => Promise.resolve(new Response(JSON.stringify({ id: 'msg_2' }), { status: 201 })));
    global.fetch = fetchMock as any;

    await service.notifyMentioned({
      workspaceId: 'ws-1234567890abcdef',
      recipientUserIds: ['usr_2', 'usr_2'],
      taskId: 'task_99',
      identifier: 'MTN-35',
      taskTitle: 'Form Tambah Project Showcase',
      actorName: 'Budi',
      commentContent: 'Halo @Fiqri tolong cek PR ini ya',
    });

    // Second mention on the same task within 5 minutes should be rate-limited
    await service.notifyMentioned({
      workspaceId: 'ws-1234567890abcdef',
      recipientUserIds: ['usr_2'],
      taskId: 'task_99',
      identifier: 'MTN-35',
      taskTitle: 'Form Tambah Project Showcase',
      actorName: 'Budi',
      commentContent: 'Ping lagi @Fiqri',
    });

    // Mention on a different task should still go through
    await service.notifyMentioned({
      workspaceId: 'ws-1234567890abcdef',
      recipientUserIds: ['usr_2'],
      taskId: 'task_100',
      identifier: 'MTN-36',
      taskTitle: 'Task Lain',
      actorName: 'Budi',
      commentContent: '@Fiqri cek juga yang ini',
    });

    expect(fetchMock).toHaveBeenCalledTimes(2);
    const firstBody = JSON.parse(fetchMock.mock.calls[0][1].body);
    expect(firstBody.text).toContain('Kamu di-mention');
    expect(firstBody.text).toContain('MTN-35');
    const secondBody = JSON.parse(fetchMock.mock.calls[1][1].body);
    expect(secondBody.text).toContain('MTN-36');
  });
});
