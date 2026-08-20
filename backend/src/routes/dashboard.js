import { Router } from "express";
import { prisma } from "../lib/prisma.js";
import { asyncHandler } from "../middleware/error.js";
import { requireAuth } from "../middleware/auth.js";
import { serializeTask } from "./taskHelpers.js";

export const dashboardRouter = Router();

dashboardRouter.use(requireAuth);

dashboardRouter.get(
  "/",
  asyncHandler(async (req, res) => {
    const projectWhere =
      req.user.role === "ADMIN"
        ? {}
        : { members: { some: { userId: req.user.id } } };
    const taskWhere =
      req.user.role === "ADMIN"
        ? {}
        : { project: { members: { some: { userId: req.user.id } } } };

    const [projects, tasks, assigned] = await Promise.all([
      prisma.project.findMany({
        where: projectWhere,
        include: { tasks: true, members: true },
        orderBy: { updatedAt: "desc" },
      }),
      prisma.task.findMany({
        where: taskWhere,
        include: { assignee: true, project: true },
      }),
      prisma.task.findMany({
        where: { assigneeId: req.user.id },
        include: { assignee: true, project: true, creator: true },
        orderBy: { deadline: "asc" },
        take: 8,
      }),
    ]);

    const now = new Date();
    const upcoming = tasks
      .filter((task) => task.deadline && task.status !== "DONE" && new Date(task.deadline) >= now)
      .sort((a, b) => new Date(a.deadline) - new Date(b.deadline))
      .slice(0, 6);

    const overdue = tasks.filter(
      (task) => task.deadline && task.status !== "DONE" && new Date(task.deadline) < now
    );

    res.json({
      stats: {
        projects: projects.length,
        tasks: tasks.length,
        done: tasks.filter((task) => task.status === "DONE").length,
        inProgress: tasks.filter((task) => task.status === "IN_PROGRESS").length,
        overdue: overdue.length,
        assignedToMe: tasks.filter((task) => task.assigneeId === req.user.id).length,
      },
      projects: projects.map((project) => {
        const total = project.tasks.length;
        const done = project.tasks.filter((task) => task.status === "DONE").length;
        return {
          id: project.id,
          name: project.name,
          memberCount: project.members.length,
          percent: total === 0 ? 0 : Math.round((done / total) * 100),
          total,
          done,
        };
      }),
      upcoming: upcoming.map(serializeTask),
      myTasks: assigned.map(serializeTask),
    });
  })
);
