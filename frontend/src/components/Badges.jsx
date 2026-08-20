import { PRIORITY_LABELS, STATUS_LABELS, isOverdue } from "../lib";

const statusStyles = {
  TODO: "bg-[#efe6d8] text-[#5c5348]",
  IN_PROGRESS: "bg-[#f3e0c7] text-[#8a4b12]",
  DONE: "bg-[#dceee4] text-[#21563d]",
};

const priorityStyles = {
  LOW: "text-[#4b6b5a]",
  MEDIUM: "text-[#8a4b12]",
  HIGH: "text-accent",
  URGENT: "text-[#9f1239]",
};

export function StatusBadge({ status }) {
  return (
    <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${statusStyles[status] || statusStyles.TODO}`}>
      {STATUS_LABELS[status] || status}
    </span>
  );
}

export function PriorityBadge({ priority }) {
  return (
    <span className={`text-xs font-semibold uppercase tracking-wide ${priorityStyles[priority] || ""}`}>
      {PRIORITY_LABELS[priority] || priority}
    </span>
  );
}

export function ProgressBar({ percent }) {
  return (
    <div className="h-2 overflow-hidden rounded-full bg-line">
      <div className="h-full rounded-full bg-forest transition-all" style={{ width: `${percent || 0}%` }} />
    </div>
  );
}

export function DeadlineLabel({ task }) {
  if (!task.deadline) return <span className="text-muted">No deadline</span>;
  const overdue = isOverdue(task);
  return (
    <span className={overdue ? "font-medium text-accent" : "text-muted"}>
      {overdue ? "Overdue · " : ""}
      {new Date(task.deadline).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
    </span>
  );
}
