import { PrismaClient, TaskStatus, TaskPriority, WorkspaceRole } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding Linear database...');

  // Clean existing data
  await prisma.attachment.deleteMany();
  await prisma.task.deleteMany();
  await prisma.project.deleteMany();
  await prisma.workspaceMember.deleteMany();
  await prisma.workspace.deleteMany();
  await prisma.user.deleteMany();

  const hashedPassword = await bcrypt.hash('password123', 10);

  // 1. Create Users
  const userAlex = await prisma.user.create({
    data: {
      email: 'demo@linear.app',
      name: 'Alex Vance',
      password: hashedPassword,
      avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    },
  });

  const userSarah = await prisma.user.create({
    data: {
      email: 'sarah@linear.app',
      name: 'Sarah Connor',
      password: hashedPassword,
      avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
    },
  });

  const userDavid = await prisma.user.create({
    data: {
      email: 'david@linear.app',
      name: 'David Miller',
      password: hashedPassword,
      avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    },
  });

  // 2. Create Workspace
  const workspace = await prisma.workspace.create({
    data: {
      name: 'Acme Product Team',
      slug: 'acme-product',
      members: {
        create: [
          { userId: userAlex.id, role: WorkspaceRole.OWNER },
          { userId: userSarah.id, role: WorkspaceRole.ADMIN },
          { userId: userDavid.id, role: WorkspaceRole.MEMBER },
        ],
      },
    },
  });

  // 3. Create Projects
  const projectCore = await prisma.project.create({
    data: {
      name: 'Core Platform',
      key: 'ENG',
      description: 'Platform infrastructure, backend microservices, and APIs',
      color: '#5e6ad2',
      workspaceId: workspace.id,
    },
  });

  const projectMobile = await prisma.project.create({
    data: {
      name: 'Mobile Client',
      key: 'MOB',
      description: 'Next-gen iOS and Android native clients',
      color: '#0ea5e9',
      workspaceId: workspace.id,
    },
  });

  // 4. Create Sample Tasks
  const sampleTasks = [
    {
      identifier: 'ENG-1',
      title: 'Fix memory leak in websocket event dispatch',
      description: 'Event listener subscriptions are not being garbage collected when clients disconnect rapidly during reconnect storms.',
      status: TaskStatus.IN_PROGRESS,
      priority: TaskPriority.URGENT,
      order: 1000,
      labels: ['Bug', 'Backend', 'Critical'],
      creatorId: userAlex.id,
      assigneeId: userDavid.id,
      projectId: projectCore.id,
    },
    {
      identifier: 'ENG-2',
      title: 'Implement drag-and-drop priority reordering with optimistic updates',
      description: 'Enable instantaneous drag & drop across Kanban priority columns using Framer Motion animations with smooth layout transitions.',
      status: TaskStatus.IN_PROGRESS,
      priority: TaskPriority.HIGH,
      order: 2000,
      labels: ['Feature', 'Frontend'],
      creatorId: userAlex.id,
      assigneeId: userAlex.id,
      projectId: projectCore.id,
    },
    {
      identifier: 'ENG-3',
      title: 'Add support for multi-file upload and attachment previews',
      description: 'Support drag & drop file uploads directly into task description drawer, showing thumbnails and download links.',
      status: TaskStatus.DONE,
      priority: TaskPriority.HIGH,
      order: 1500,
      labels: ['Feature', 'Storage'],
      creatorId: userSarah.id,
      assigneeId: userSarah.id,
      projectId: projectCore.id,
    },
    {
      identifier: 'ENG-4',
      title: 'Refactor database query indexes for million-row task searches',
      description: 'Add composite indexes on (workspaceId, status) and (workspaceId, priority) to guarantee sub-15ms response times.',
      status: TaskStatus.TODO,
      priority: TaskPriority.MEDIUM,
      order: 1000,
      labels: ['Performance', 'Postgres'],
      creatorId: userDavid.id,
      assigneeId: userDavid.id,
      projectId: projectCore.id,
    },
    {
      identifier: 'ENG-5',
      title: 'Design Linear-grade dark theme with custom accent palette',
      description: 'Use zinc-900 obsidian surfaces, refined 1px border dividers, and glowing status pills matching Linear brand style.',
      status: TaskStatus.DONE,
      priority: TaskPriority.MEDIUM,
      order: 3000,
      labels: ['Design', 'UI/UX'],
      creatorId: userAlex.id,
      assigneeId: userAlex.id,
      projectId: projectCore.id,
    },
    {
      identifier: 'ENG-6',
      title: 'Support keyboard shortcuts navigation (Cmd+K command menu)',
      description: 'Enable instant search modal with Cmd+K, quick task creation with C, and status switching with S.',
      status: TaskStatus.BACKLOG,
      priority: TaskPriority.LOW,
      order: 1000,
      labels: ['Frontend', 'Accessibility'],
      creatorId: userSarah.id,
      assigneeId: null,
      projectId: projectCore.id,
    },
    {
      identifier: 'ENG-7',
      title: 'Investigate offline client sync with IndexedDB',
      description: 'Exploratory spike to evaluate local-first caching of task changes when user temporarily loses connectivity.',
      status: TaskStatus.BACKLOG,
      priority: TaskPriority.NO_PRIORITY,
      order: 2000,
      labels: ['Research'],
      creatorId: userDavid.id,
      assigneeId: null,
      projectId: projectCore.id,
    },
    {
      identifier: 'MOB-1',
      title: 'Implement push notification triggers on task mention',
      description: 'Send APNS / FCM notifications whenever a user is @mentioned in task comments or assigned.',
      status: TaskStatus.TODO,
      priority: TaskPriority.HIGH,
      order: 1000,
      labels: ['Mobile', 'Notifications'],
      creatorId: userAlex.id,
      assigneeId: userSarah.id,
      projectId: projectMobile.id,
    },
  ];

  for (const t of sampleTasks) {
    await prisma.task.create({
      data: {
        ...t,
        workspaceId: workspace.id,
      },
    });
  }

  console.log('Seeding completed successfully!');
  console.log('Login credentials:');
  console.log('Email: demo@linear.app');
  console.log('Password: password123');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
