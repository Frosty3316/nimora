import "dotenv/config";
import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const password = await bcrypt.hash("Admin@123", 10);
  const memberPassword = await bcrypt.hash("Member@123", 10);

  const admin = await prisma.user.upsert({
    where: { email: "admin@nimora.app" },
    update: {},
    create: {
      name: "Amina Shah",
      email: "admin@nimora.app",
      password,
      role: "ADMIN",
    },
  });

  const alex = await prisma.user.upsert({
    where: { email: "alex@nimora.app" },
    update: {},
    create: {
      name: "Alex Mensah",
      email: "alex@nimora.app",
      password: memberPassword,
      role: "MEMBER",
    },
  });

  const jordan = await prisma.user.upsert({
    where: { email: "jordan@nimora.app" },
    update: {},
    create: {
      name: "Jordan Lee",
      email: "jordan@nimora.app",
      password: memberPassword,
      role: "MEMBER",
    },
  });

  const existing = await prisma.project.findFirst({ where: { name: "Campus Launch Week" } });
  if (existing) {
    console.log("Seed data already present.");
    return;
  }

  const project = await prisma.project.create({
    data: {
      name: "Campus Launch Week",
      description: "Coordinate the product launch across design, engineering, and outreach.",
      creatorId: admin.id,
      members: {
        create: [{ userId: admin.id }, { userId: alex.id }, { userId: jordan.id }],
      },
    },
  });

  const design = await prisma.task.create({
    data: {
      title: "Finalize launch landing page",
      description: "Ship the public page with schedule, speakers, and registration.",
      status: "IN_PROGRESS",
      priority: "HIGH",
      deadline: new Date("2026-08-28T18:00:00.000Z"),
      projectId: project.id,
      assigneeId: alex.id,
      creatorId: admin.id,
    },
  });

  await prisma.task.create({
    data: {
      title: "Prepare demo script",
      description: "Write a 4-minute walkthrough covering auth, projects, and deadline history.",
      status: "TODO",
      priority: "MEDIUM",
      deadline: new Date("2026-08-30T12:00:00.000Z"),
      projectId: project.id,
      assigneeId: jordan.id,
      creatorId: admin.id,
    },
  });

  await prisma.task.create({
    data: {
      title: "Invite faculty reviewers",
      description: "Send access credentials and a short evaluation checklist.",
      status: "DONE",
      priority: "LOW",
      deadline: new Date("2026-08-18T12:00:00.000Z"),
      projectId: project.id,
      assigneeId: alex.id,
      creatorId: admin.id,
    },
  });

  await prisma.deadlineHistory.create({
    data: {
      taskId: design.id,
      previousDeadline: new Date("2026-08-22T18:00:00.000Z"),
      newDeadline: new Date("2026-08-28T18:00:00.000Z"),
      changedById: admin.id,
    },
  });

  await prisma.comment.create({
    data: {
      taskId: design.id,
      authorId: alex.id,
      content: "Hero section is done. Waiting on speaker photos before the schedule block.",
    },
  });

  await prisma.taskActivity.createMany({
    data: [
      { taskId: design.id, actorId: admin.id, action: "CREATED", details: "Task created with priority HIGH" },
      { taskId: design.id, actorId: admin.id, action: "DEADLINE_CHANGED", details: '{"from":"2026-08-22","to":"2026-08-28"}' },
      { taskId: design.id, actorId: alex.id, action: "COMMENTED", details: "Hero section is done." },
    ],
  });

  console.log("Seeded Nimora demo data.");
  console.log("Admin:  admin@nimora.app / Admin@123");
  console.log("Member: alex@nimora.app / Member@123");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
