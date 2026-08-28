import { PrismaClient, ProjectRole, TaskStatus, TaskPriority } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  // Clean existing data
  await prisma.notification.deleteMany();
  await prisma.comment.deleteMany();
  await prisma.task.deleteMany();
  await prisma.projectMember.deleteMany();
  await prisma.project.deleteMany();
  await prisma.user.deleteMany();

  const hashedPassword = await bcrypt.hash('password123', 10);

  // 1. Create Test Users
  const alex = await prisma.user.create({
    data: {
      email: 'alex@taskflow.dev',
      name: 'Alex Johnson',
      password: hashedPassword,
      avatarUrl: 'https://api.dicebear.com/7.x/initials/svg?seed=Alex%20Johnson',
    },
  });

  const sam = await prisma.user.create({
    data: {
      email: 'sam@taskflow.dev',
      name: 'Sam Rivera',
      password: hashedPassword,
      avatarUrl: 'https://api.dicebear.com/7.x/initials/svg?seed=Sam%20Rivera',
    },
  });

  const taylor = await prisma.user.create({
    data: {
      email: 'taylor@taskflow.dev',
      name: 'Taylor Chen',
      password: hashedPassword,
      avatarUrl: 'https://api.dicebear.com/7.x/initials/svg?seed=Taylor%20Chen',
    },
  });

  console.log('✅ Created test users: Alex (alex@taskflow.dev), Sam (sam@taskflow.dev), Taylor (taylor@taskflow.dev)');

  // 2. Create Sample Project
  const project = await prisma.project.create({
    data: {
      name: 'TaskFlow Platform v1.0',
      description: 'Collaborative Project Management tool featuring real-time Kanban boards, Socket.IO sync, and violet visual identity.',
      ownerId: alex.id,
      members: {
        create: [
          { userId: alex.id, role: ProjectRole.OWNER },
          { userId: sam.id, role: ProjectRole.ADMIN },
          { userId: taylor.id, role: ProjectRole.MEMBER },
        ],
      },
    },
  });

  console.log(`✅ Created project: "${project.name}" (ID: ${project.id})`);

  // 3. Create Sample Tasks
  const task1 = await prisma.task.create({
    data: {
      title: 'Design Violet Visual Identity & Theme System',
      description: 'Configure Tailwind CSS color tokens with vibrant violet accents, dark/light contrast ratios, and glassmorphism cards.',
      status: TaskStatus.DONE,
      priority: TaskPriority.HIGH,
      position: 0,
      projectId: project.id,
      assigneeId: alex.id,
      createdById: alex.id,
    },
  });

  const task2 = await prisma.task.create({
    data: {
      title: 'Implement JWT Auth & Protected Routes',
      description: 'Setup bcrypt password hashing, token issue/verify middleware, and Zod schema validation.',
      status: TaskStatus.IN_PROGRESS,
      priority: TaskPriority.URGENT,
      position: 0,
      projectId: project.id,
      assigneeId: sam.id,
      createdById: alex.id,
      dueDate: new Date(Date.now() + 86400000 * 3), // 3 days from now
    },
  });

  const task3 = await prisma.task.create({
    data: {
      title: 'Integrate Socket.IO Real-time Kanban Sync',
      description: 'Broadcast task creation, status updates, column movement, and comments to room members instantaneously.',
      status: TaskStatus.TODO,
      priority: TaskPriority.HIGH,
      position: 0,
      projectId: project.id,
      assigneeId: sam.id,
      createdById: alex.id,
      dueDate: new Date(Date.now() + 86400000 * 5),
    },
  });

  const task4 = await prisma.task.create({
    data: {
      title: 'Setup PostgreSQL Prisma Migration & Schema',
      description: 'Build User, Project, ProjectMember, Task, Comment, and Notification relational entities.',
      status: TaskStatus.REVIEW,
      priority: TaskPriority.MEDIUM,
      position: 0,
      projectId: project.id,
      assigneeId: taylor.id,
      createdById: sam.id,
    },
  });

  console.log('✅ Created sample tasks across TODO, IN_PROGRESS, REVIEW, and DONE columns.');

  // 4. Add Initial Comments
  await prisma.comment.create({
    data: {
      content: 'I have configured the violet-600 primary color palette in Tailwind config.',
      taskId: task1.id,
      userId: alex.id,
    },
  });

  await prisma.comment.create({
    data: {
      content: 'Working on login validation now. Will add error toasts for invalid credentials.',
      taskId: task2.id,
      userId: sam.id,
    },
  });

  console.log('✅ Created sample comments.');

  // 5. Add Notification
  await prisma.notification.create({
    data: {
      userId: sam.id,
      type: 'TASK_ASSIGNED',
      title: 'New Task Assigned',
      message: `You were assigned task "${task2.title}" in project "${project.name}".`,
      link: `/projects/${project.id}?task=${task2.id}`,
    },
  });

  console.log('✅ Database seed completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
