import { Router } from "express";
import { prisma } from "../lib/prisma.js";
import { addMemberSchema, projectSchema, taskCreateSchema } from "../lib/validators.js";
import { asyncHandler } from "../middleware/error.js";
import { requireAdmin, requireAuth } from "../middleware/auth.js";
import { logActivity, serializeTask } from "./taskHelpers.js";

export const projectsRouter = Router();

projectsRouter.use(requireAuth);

async function canAccessProject(user, projectId) {
  if (user.role === "ADMIN") return true;
  const membership = await prisma.projectMember.findUnique({
    where: { projectId_userId: { projectId, userId: user.id } },
  });
  return Boolean(membership);
}

function serializeProject(project) {
  const tasks = project.tasks || [];
  const done = tasks.filter((task) => task.status === "DONE").length;
  const total = tasks.length;
  return {
    id: project.id,
    name: project.name,
    description: project.description,
    createdAt: project.createdAt,
    updatedAt: project.updatedAt,
    creator: project.creator
      ? { id: project.creator.id, name: project.creator.name, email: project.creator.email }
      : undefined,
    members: (project.members || []).map((member) => ({
      id: member.id,
      joinedAt: member.joinedAt,
      user: { id: member.user.id, name: member.user.name, email: member.user.email, role: member.user.role },
    })),
    progress: {
      total,
      done,
      inProgress: tasks.filter((task) => task.status === "IN_PROGRESS").length,
      todo: tasks.filter((task) => task.status === "TODO").length,
      percent: total === 0 ? 0 : Math.round((done / total) * 100),
    },
  };
}

projectsRouter.get(
  "/",
  asyncHandler(async (req, res) => {
    const where =
      req.user.role === "ADMIN"
        ? {}
        : { members: { some: { userId: req.user.id } } };

    const projects = await prisma.project.findMany({
      where,
      include: {
        creator: true,
        members: { include: { user: true } },
        tasks: true,
      },
      orderBy: { updatedAt: "desc" },
    });
    res.json({ projects: projects.map(serializeProject) });
  })
);

projectsRouter.post(
  "/",
  requireAdmin,
  asyncHandler(async (req, res) => {
    const data = projectSchema.parse(req.body);
    const project = await prisma.project.create({
      data: {
        name: data.name,
        description: data.description,
        creatorId: req.user.id,
        members: { create: { userId: req.user.id } },
      },
      include: {
        creator: true,
        members: { include: { user: true } },
        tasks: true,
      },
    });
    res.status(201).json({ project: serializeProject(project) });
  })
);

projectsRouter.get(
  "/:id",
  asyncHandler(async (req, res) => {
    if (!(await canAccessProject(req.user, req.params.id))) {
      return res.status(403).json({ error: { message: "You do not have access to this project." } });
    }
    const project = await prisma.project.findUnique({
      where: { id: req.params.id },
      include: {
        creator: true,
        members: { include: { user: true } },
        tasks: {
          include: { assignee: true, creator: true },
          orderBy: [{ deadline: "asc" }, { createdAt: "desc" }],
        },
      },
    });
    if (!project) {
      return res.status(404).json({ error: { message: "Project not found." } });
    }
    res.json({
      project: {
        ...serializeProject(project),
        tasks: project.tasks.map(serializeTask),
      },
    });
  })
);

projectsRouter.patch(
  "/:id",
  requireAdmin,
  asyncHandler(async (req, res) => {
    const data = projectSchema.partial().parse(req.body);
    const project = await prisma.project.update({
      where: { id: req.params.id },
      data,
      include: {
        creator: true,
        members: { include: { user: true } },
        tasks: true,
      },
    });
    res.json({ project: serializeProject(project) });
  })
);

projectsRouter.delete(
  "/:id",
  requireAdmin,
  asyncHandler(async (req, res) => {
    await prisma.project.delete({ where: { id: req.params.id } });
    res.json({ ok: true });
  })
);

projectsRouter.post(
  "/:id/members",
  requireAdmin,
  asyncHandler(async (req, res) => {
    const { userId } = addMemberSchema.parse(req.body);
    const project = await prisma.project.findUnique({ where: { id: req.params.id } });
    if (!project) {
      return res.status(404).json({ error: { message: "Project not found." } });
    }
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      return res.status(404).json({ error: { message: "User not found." } });
    }
    const member = await prisma.projectMember.upsert({
      where: { projectId_userId: { projectId: req.params.id, userId } },
      update: {},
      create: { projectId: req.params.id, userId },
      include: { user: true },
    });
    res.status(201).json({
      member: {
        id: member.id,
        joinedAt: member.joinedAt,
        user: { id: member.user.id, name: member.user.name, email: member.user.email, role: member.user.role },
      },
    });
  })
);

projectsRouter.delete(
  "/:id/members/:userId",
  requireAdmin,
  asyncHandler(async (req, res) => {
    await prisma.projectMember.deleteMany({
      where: { projectId: req.params.id, userId: req.params.userId },
    });
    await prisma.task.updateMany({
      where: { projectId: req.params.id, assigneeId: req.params.userId },
      data: { assigneeId: null },
    });
    res.json({ ok: true });
  })
);

projectsRouter.post(
  "/:id/tasks",
  requireAdmin,
  asyncHandler(async (req, res) => {
    const data = taskCreateSchema.parse(req.body);
    const project = await prisma.project.findUnique({
      where: { id: req.params.id },
      include: { members: true },
    });
    if (!project) {
      return res.status(404).json({ error: { message: "Project not found." } });
    }
    if (data.assigneeId) {
      const isMember = project.members.some((member) => member.userId === data.assigneeId);
      if (!isMember) {
        return res.status(400).json({ error: { message: "Assignee must be a member of this project." } });
      }
    }
    const task = await prisma.task.create({
      data: {
        title: data.title,
        description: data.description,
        status: data.status,
        priority: data.priority,
        deadline: data.deadline ? new Date(data.deadline) : null,
        assigneeId: data.assigneeId || null,
        projectId: project.id,
        creatorId: req.user.id,
      },
      include: { assignee: true, creator: true, project: true },
    });
    await logActivity(task.id, req.user.id, "CREATED", `Task created with priority ${task.priority}`);
    res.status(201).json({ task: serializeTask(task) });
  })
);
