import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { api } from "../api";
import { useAuth } from "../AuthContext";
import { DeadlineLabel, PriorityBadge, ProgressBar, StatusBadge } from "../components/Badges";
import { EmptyState, ErrorBanner, Field, Modal, inputClass } from "../components/Form";
import { PRIORITY_LABELS, STATUS_LABELS, fieldError, fromDateTimeLocal, initials } from "../lib";

export function ProjectDetailPage() {
  const { id } = useParams();
  const { isAdmin } = useAuth();
  const [project, setProject] = useState(null);
  const [users, setUsers] = useState([]);
  const [error, setError] = useState("");
  const [filters, setFilters] = useState({ q: "", status: "", priority: "" });
  const [taskOpen, setTaskOpen] = useState(false);
  const [memberId, setMemberId] = useState("");

  async function load() {
    const data = await api(`/projects/${id}`);
    setProject(data.project);
  }

  useEffect(() => {
    load().catch((err) => setError(err.message));
    if (isAdmin) {
      api("/users")
        .then((data) => setUsers(data.users))
        .catch(() => {});
    }
  }, [id, isAdmin]);

  const tasks = useMemo(() => {
    if (!project?.tasks) return [];
    return project.tasks.filter((task) => {
      const q = filters.q.trim().toLowerCase();
      if (q && !`${task.title} ${task.description}`.toLowerCase().includes(q)) return false;
      if (filters.status && task.status !== filters.status) return false;
      if (filters.priority && task.priority !== filters.priority) return false;
      return true;
    });
  }, [project, filters]);

  if (error) return <ErrorBanner message={error} />;
  if (!project) return <p className="text-muted">Loading project…</p>;

  const availableUsers = users.filter((user) => !project.members.some((member) => member.user.id === user.id));

  async function addMember(event) {
    event.preventDefault();
    if (!memberId) return;
    await api(`/projects/${id}/members`, { method: "POST", body: { userId: memberId } });
    setMemberId("");
    await load();
  }

  return (
    <div className="space-y-6">
      <header className="rounded-3xl bg-cream p-6">
        <Link to="/projects" className="text-sm text-muted hover:text-ink">
          ← Projects
        </Link>
        <div className="mt-3 flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="font-display text-4xl">{project.name}</h1>
            <p className="mt-2 max-w-2xl text-muted">{project.description || "No description yet."}</p>
          </div>
          {isAdmin && (
            <button className="rounded-xl bg-accent px-4 py-2.5 font-medium text-white hover:bg-accent-dark" onClick={() => setTaskOpen(true)}>
              Create task
            </button>
          )}
        </div>
        <div className="mt-5 max-w-xl">
          <div className="mb-2 flex justify-between text-sm">
            <span>{project.progress.done} of {project.progress.total} tasks done</span>
            <span>{project.progress.percent}%</span>
          </div>
          <ProgressBar percent={project.progress.percent} />
        </div>
      </header>

      <section className="rounded-3xl bg-cream p-6">
        <h2 className="font-display text-2xl">Team</h2>
        <div className="mt-4 flex flex-wrap gap-2">
          {project.members.map((member) => (
            <span key={member.id} className="inline-flex items-center gap-2 rounded-full bg-paper px-3 py-1.5 text-sm">
              <span className="grid h-6 w-6 place-items-center rounded-full bg-ink text-[10px] text-white">
                {initials(member.user.name)}
              </span>
              {member.user.name}
            </span>
          ))}
        </div>
        {isAdmin && (
          <form className="mt-4 flex flex-wrap gap-2" onSubmit={addMember}>
            <select className={`${inputClass} max-w-xs`} value={memberId} onChange={(e) => setMemberId(e.target.value)}>
              <option value="">Add a team member</option>
              {availableUsers.map((user) => (
                <option key={user.id} value={user.id}>
                  {user.name} · {user.email}
                </option>
              ))}
            </select>
            <button className="rounded-xl bg-ink px-4 py-2 text-sm font-medium text-white" disabled={!memberId}>
              Add
            </button>
          </form>
        )}
      </section>

      <section className="space-y-4">
        <div className="flex flex-wrap gap-2">
          <input
            className={`${inputClass} max-w-xs`}
            placeholder="Search tasks"
            value={filters.q}
            onChange={(e) => setFilters({ ...filters, q: e.target.value })}
          />
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

        {tasks.length === 0 ? (
          <EmptyState title="No matching tasks" body="Adjust filters or create a task for this project." />
        ) : (
          <div className="overflow-hidden rounded-3xl bg-cream">
            {tasks.map((task) => (
              <Link key={task.id} to={`/tasks/${task.id}`} className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-5 py-4 last:border-b-0 hover:bg-paper">
                <div>
                  <p className="font-medium">{task.title}</p>
                  <p className="text-sm text-muted">{task.assignee?.name || "Unassigned"}</p>
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
      </section>

      {taskOpen && (
        <CreateTaskModal
          project={project}
          onClose={() => setTaskOpen(false)}
          onCreated={async () => {
            setTaskOpen(false);
            await load();
          }}
        />
      )}
    </div>
  );
}

function CreateTaskModal({ project, onClose, onCreated }) {
  const [form, setForm] = useState({
    title: "",
    description: "",
    priority: "MEDIUM",
    status: "TODO",
    assigneeId: "",
    deadline: "",
  });
  const [error, setError] = useState(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(event) {
    event.preventDefault();
    setPending(true);
    setError(null);
    try {
      await api(`/projects/${project.id}/tasks`, {
        method: "POST",
        body: {
          ...form,
          assigneeId: form.assigneeId || null,
          deadline: fromDateTimeLocal(form.deadline),
        },
      });
      onCreated();
    } catch (err) {
      setError(err);
    } finally {
      setPending(false);
    }
  }

  return (
    <Modal title="Create task" onClose={onClose}>
      <form className="space-y-4" onSubmit={onSubmit}>
        <ErrorBanner message={error?.message} />
        <Field label="Title" error={fieldError(error, "title")}>
          <input className={inputClass} value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
        </Field>
        <Field label="Description">
          <textarea className={inputClass} rows="3" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Priority">
            <select className={inputClass} value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })}>
              {Object.entries(PRIORITY_LABELS).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </Field>
          <Field label="Assignee">
            <select className={inputClass} value={form.assigneeId} onChange={(e) => setForm({ ...form, assigneeId: e.target.value })}>
              <option value="">Unassigned</option>
              {project.members.map((member) => (
                <option key={member.user.id} value={member.user.id}>{member.user.name}</option>
              ))}
            </select>
          </Field>
        </div>
        <Field label="Deadline">
          <input className={inputClass} type="datetime-local" value={form.deadline} onChange={(e) => setForm({ ...form, deadline: e.target.value })} />
        </Field>
        <button className="w-full rounded-xl bg-accent py-3 font-medium text-white hover:bg-accent-dark" disabled={pending}>
          {pending ? "Creating…" : "Create task"}
        </button>
      </form>
    </Modal>
  );
}
