import { publicUser } from "../lib/auth.js";
import { prisma } from "../lib/prisma.js";

export function serializeTask(task) {
  return {
    id: task.id,
    title: task.title,
    description: task.description,
    status: task.status,
    priority: task.priority,
    deadline: task.deadline,
    projectId: task.projectId,
    createdAt: task.createdAt,
    updatedAt: task.updatedAt,
    project: task.project
      ? { id: task.project.id, name: task.project.name }
      : undefined,
    assignee: task.assignee ? publicUser(task.assignee) : null,
    creator: task.creator ? publicUser(task.creator) : undefined,
  };
}

export async function logActivity(taskId, actorId, action, details = "") {
  return prisma.taskActivity.create({
    data: { taskId, actorId, action, details },
  });
}

export async function userCanAccessTask(user, task) {
  if (user.role === "ADMIN") return true;
  const membership = await prisma.projectMember.findUnique({
    where: { projectId_userId: { projectId: task.projectId, userId: user.id } },
  });
  return Boolean(membership);
}
