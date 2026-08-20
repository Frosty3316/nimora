import { Router } from "express";
import { prisma } from "../lib/prisma.js";
import { commentSchema, taskUpdateSchema } from "../lib/validators.js";
import { shouldRecordDeadlineChange } from "../lib/deadlines.js";
import { publicUser } from "../lib/auth.js";
import { asyncHandler } from "../middleware/error.js";
import { requireAuth } from "../middleware/auth.js";
import { logActivity, serializeTask, userCanAccessTask } from "./taskHelpers.js";

export const tasksRouter = Router();

tasksRouter.use(requireAuth);

tasksRouter.get(
  "/",
  asyncHandler(async (req, res) => {
    const { status, priority, q, projectId, mine } = req.query;
    const where = {};

    if (req.user.role !== "ADMIN") {
      where.project = { members: { some: { userId: req.user.id } } };
    }
    if (mine === "true") where.assigneeId = req.user.id;
    if (status) where.status = String(status);
    if (priority) where.priority = String(priority);
    if (projectId) where.projectId = String(projectId);
    if (q) {
      where.OR = [
        { title: { contains: String(q) } },
        { description: { contains: String(q) } },
      ];
    }

    const tasks = await prisma.task.findMany({
      where,
      include: { assignee: true, creator: true, project: true },
      orderBy: [{ deadline: "asc" }, { createdAt: "desc" }],
    });
    res.json({ tasks: tasks.map(serializeTask) });
  })
);

tasksRouter.get(
  "/:id",
  asyncHandler(async (req, res) => {
    const task = await prisma.task.findUnique({
      where: { id: req.params.id },
      include: { assignee: true, creator: true, project: true },
    });
    if (!task) {
      return res.status(404).json({ error: { message: "Task not found." } });
    }
    if (!(await userCanAccessTask(req.user, task))) {
      return res.status(403).json({ error: { message: "You do not have access to this task." } });
    }
    res.json({ task: serializeTask(task) });
  })
);

tasksRouter.patch(
  "/:id",
  asyncHandler(async (req, res) => {
    const existing = await prisma.task.findUnique({
      where: { id: req.params.id },
      include: { project: { include: { members: true } } },
    });
    if (!existing) {
      return res.status(404).json({ error: { message: "Task not found." } });
    }
    if (!(await userCanAccessTask(req.user, existing))) {
      return res.status(403).json({ error: { message: "You do not have access to this task." } });
    }

    const data = taskUpdateSchema.parse(req.body);
    const isAdmin = req.user.role === "ADMIN";
    const isAssignee = existing.assigneeId === req.user.id;

    if (!isAdmin) {
      const extraKeys = Object.keys(data).filter((key) => key !== "status");
      if (extraKeys.length > 0 || !isAssignee) {
        return res.status(403).json({
          error: { message: "Team members can only update the status of tasks assigned to them." },
        });
      }
    }

    if (data.assigneeId) {
      const isMember = existing.project.members.some((member) => member.userId === data.assigneeId);
      if (!isMember) {
        return res.status(400).json({ error: { message: "Assignee must be a member of this project." } });
      }
    }

    const nextDeadline =
      data.deadline === undefined ? existing.deadline : data.deadline ? new Date(data.deadline) : null;

    const updated = await prisma.$transaction(async (tx) => {
      if (data.deadline !== undefined && shouldRecordDeadlineChange(existing.deadline, nextDeadline)) {
        await tx.deadlineHistory.create({
          data: {
            taskId: existing.id,
            previousDeadline: existing.deadline,
            newDeadline: nextDeadline,
            changedById: req.user.id,
          },
        });
        await tx.taskActivity.create({
          data: {
            taskId: existing.id,
            actorId: req.user.id,
            action: "DEADLINE_CHANGED",
            details: JSON.stringify({
              from: existing.deadline,
              to: nextDeadline,
            }),
          },
        });
      }

      if (data.status && data.status !== existing.status) {
        await tx.taskActivity.create({
          data: {
            taskId: existing.id,
            actorId: req.user.id,
            action: "STATUS_CHANGED",
            details: `${existing.status} → ${data.status}`,
          },
        });
      }

      if (data.assigneeId !== undefined && data.assigneeId !== existing.assigneeId) {
        await tx.taskActivity.create({
          data: {
            taskId: existing.id,
            actorId: req.user.id,
            action: "ASSIGNED",
            details: data.assigneeId || "Unassigned",
          },
        });
      }

      return tx.task.update({
        where: { id: existing.id },
        data: {
          ...(data.title !== undefined ? { title: data.title } : {}),
          ...(data.description !== undefined ? { description: data.description } : {}),
          ...(data.status !== undefined ? { status: data.status } : {}),
          ...(data.priority !== undefined ? { priority: data.priority } : {}),
          ...(data.assigneeId !== undefined ? { assigneeId: data.assigneeId } : {}),
          ...(data.deadline !== undefined ? { deadline: nextDeadline } : {}),
        },
        include: { assignee: true, creator: true, project: true },
      });
    });

    res.json({ task: serializeTask(updated) });
  })
);

tasksRouter.get(
  "/:id/comments",
  asyncHandler(async (req, res) => {
    const task = await prisma.task.findUnique({ where: { id: req.params.id } });
    if (!task) return res.status(404).json({ error: { message: "Task not found." } });
    if (!(await userCanAccessTask(req.user, task))) {
      return res.status(403).json({ error: { message: "You do not have access to this task." } });
    }
    const comments = await prisma.comment.findMany({
      where: { taskId: task.id },
      include: { author: true },
      orderBy: { createdAt: "asc" },
    });
    res.json({
      comments: comments.map((comment) => ({
        id: comment.id,
        content: comment.content,
        createdAt: comment.createdAt,
        author: publicUser(comment.author),
      })),
    });
  })
);

tasksRouter.post(
  "/:id/comments",
  asyncHandler(async (req, res) => {
    const task = await prisma.task.findUnique({ where: { id: req.params.id } });
    if (!task) return res.status(404).json({ error: { message: "Task not found." } });
    if (!(await userCanAccessTask(req.user, task))) {
      return res.status(403).json({ error: { message: "You do not have access to this task." } });
    }
    const data = commentSchema.parse(req.body);
    const comment = await prisma.comment.create({
      data: { content: data.content, taskId: task.id, authorId: req.user.id },
      include: { author: true },
    });
    await logActivity(task.id, req.user.id, "COMMENTED", data.content.slice(0, 120));
    res.status(201).json({
      comment: {
        id: comment.id,
        content: comment.content,
        createdAt: comment.createdAt,
        author: publicUser(comment.author),
      },
    });
  })
);

tasksRouter.get(
  "/:id/deadline-history",
  asyncHandler(async (req, res) => {
    const task = await prisma.task.findUnique({ where: { id: req.params.id } });
    if (!task) return res.status(404).json({ error: { message: "Task not found." } });
    if (!(await userCanAccessTask(req.user, task))) {
      return res.status(403).json({ error: { message: "You do not have access to this task." } });
    }
    const history = await prisma.deadlineHistory.findMany({
      where: { taskId: task.id },
      include: { changedBy: true },
      orderBy: { changedAt: "desc" },
    });
    res.json({
      history: history.map((entry) => ({
        id: entry.id,
        previousDeadline: entry.previousDeadline,
        newDeadline: entry.newDeadline,
        changedAt: entry.changedAt,
        changedBy: publicUser(entry.changedBy),
      })),
    });
  })
);

tasksRouter.get(
  "/:id/activity",
  asyncHandler(async (req, res) => {
    const task = await prisma.task.findUnique({ where: { id: req.params.id } });
    if (!task) return res.status(404).json({ error: { message: "Task not found." } });
    if (!(await userCanAccessTask(req.user, task))) {
      return res.status(403).json({ error: { message: "You do not have access to this task." } });
    }
    const activities = await prisma.taskActivity.findMany({
      where: { taskId: task.id },
      include: { actor: true },
      orderBy: { createdAt: "desc" },
    });
    res.json({
      activities: activities.map((item) => ({
        id: item.id,
        action: item.action,
        details: item.details,
        createdAt: item.createdAt,
        actor: publicUser(item.actor),
      })),
    });
  })
);
