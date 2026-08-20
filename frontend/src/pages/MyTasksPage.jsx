import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api";
import { DeadlineLabel, PriorityBadge, StatusBadge } from "../components/Badges";
import { EmptyState, ErrorBanner, inputClass } from "../components/Form";
import { PRIORITY_LABELS, STATUS_LABELS } from "../lib";

export function MyTasksPage() {
  const [tasks, setTasks] = useState([]);
  const [filters, setFilters] = useState({ status: "", priority: "", q: "" });
  const [error, setError] = useState("");

  useEffect(() => {
    const params = new URLSearchParams({ mine: "true" });
    if (filters.status) params.set("status", filters.status);
    if (filters.priority) params.set("priority", filters.priority);
    if (filters.q) params.set("q", filters.q);
    api(`/tasks?${params.toString()}`)
      .then((data) => setTasks(data.tasks))
      .catch((err) => setError(err.message));
  }, [filters]);

  return (
    <div className="space-y-6">
      <header>
        <p className="text-sm uppercase tracking-[0.2em] text-muted">Personal</p>
        <h1 className="font-display text-4xl">My tasks</h1>
        <p className="mt-2 text-muted">Work assigned to you, with deadlines and priorities in view.</p>
      </header>
      <div className="flex flex-wrap gap-2">
        <input className={`${inputClass} max-w-xs`} placeholder="Search" value={filters.q} onChange={(e) => setFilters({ ...filters, q: e.target.value })} />
        <select className={`${inputClass} max-w-[160px]`} value={filters.status} onChange={(e) => setFilters({ ...filters, status: e.target.value })}>
          <option value="">All statuses</option>
          {Object.entries(STATUS_LABELS).map(([value, label]) => (
            <option key={value} value={value}>{label}</option>
          ))}
        </select>
        <select className={`${inputClass} max-w-[160px]`} value={filters.priority} onChange={(e) => setFilters({ ...filters, priority: e.target.value })}>
          <option value="">All priorities</option>
          {Object.entries(PRIORITY_LABELS).map(([value, label]) => (
            <option key={value} value={value}>{label}</option>
          ))}
        </select>
      </div>
      <ErrorBanner message={error} />
      {tasks.length === 0 ? (
        <EmptyState title="Nothing assigned" body="When an admin assigns you a task, it will show up here." />
      ) : (
        <div className="overflow-hidden rounded-3xl bg-cream">
          {tasks.map((task) => (
            <Link key={task.id} to={`/tasks/${task.id}`} className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-5 py-4 last:border-b-0 hover:bg-paper">
              <div>
                <p className="font-medium">{task.title}</p>
                <p className="text-sm text-muted">{task.project?.name}</p>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <PriorityBadge priority={task.priority} />
                <StatusBadge status={task.status} />
                <DeadlineLabel task={task} />
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
