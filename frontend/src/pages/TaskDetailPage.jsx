import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { api } from "../api";
import { useAuth } from "../AuthContext";
import { DeadlineLabel, PriorityBadge, StatusBadge } from "../components/Badges";
import { ErrorBanner, Field, inputClass } from "../components/Form";
import {
  PRIORITY_LABELS,
  STATUS_LABELS,
  formatDate,
  fromDateTimeLocal,
  toDateTimeLocal,
} from "../lib";

export function TaskDetailPage() {
  const { id } = useParams();
  const { isAdmin, user } = useAuth();
  const [task, setTask] = useState(null);
  const [comments, setComments] = useState([]);
  const [history, setHistory] = useState([]);
  const [activity, setActivity] = useState([]);
  const [project, setProject] = useState(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [comment, setComment] = useState("");
  const [form, setForm] = useState(null);

  async function load() {
    const [taskData, commentData, historyData, activityData] = await Promise.all([
      api(`/tasks/${id}`),
      api(`/tasks/${id}/comments`),
      api(`/tasks/${id}/deadline-history`),
      api(`/tasks/${id}/activity`),
    ]);
    setTask(taskData.task);
    setComments(commentData.comments);
    setHistory(historyData.history);
    setActivity(activityData.activities);
    setForm({
      title: taskData.task.title,
      description: taskData.task.description,
      status: taskData.task.status,
      priority: taskData.task.priority,
      assigneeId: taskData.task.assignee?.id || "",
      deadline: toDateTimeLocal(taskData.task.deadline),
    });
    const projectData = await api(`/projects/${taskData.task.projectId}`);
    setProject(projectData.project);
  }

  useEffect(() => {
    load().catch((err) => setError(err.message));
  }, [id]);

  if (error) return <ErrorBanner message={error} />;
  if (!task || !form) return <p className="text-muted">Loading task…</p>;

  const canEditStatus = isAdmin || task.assignee?.id === user.id;

  async function save(event) {
    event.preventDefault();
    setError("");
    setNotice("");
    try {
      const payload = isAdmin
        ? {
            ...form,
            assigneeId: form.assigneeId || null,
            deadline: fromDateTimeLocal(form.deadline),
          }
        : { status: form.status };
      const data = await api(`/tasks/${id}`, { method: "PATCH", body: payload });
      setTask(data.task);
      const historyData = await api(`/tasks/${id}/deadline-history`);
      const activityData = await api(`/tasks/${id}/activity`);
      setHistory(historyData.history);
      setActivity(activityData.activities);
      setNotice("Task updated.");
    } catch (err) {
      setError(err.message);
    }
  }

  async function addComment(event) {
    event.preventDefault();
    if (!comment.trim()) return;
    const data = await api(`/tasks/${id}/comments`, { method: "POST", body: { content: comment } });
    setComments((current) => [...current, data.comment]);
    setComment("");
    const activityData = await api(`/tasks/${id}/activity`);
    setActivity(activityData.activities);
  }

  return (
    <div className="space-y-6">
      <Link to={`/projects/${task.projectId}`} className="text-sm text-muted hover:text-ink">
        ← {task.project?.name || "Project"}
      </Link>
      <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <section className="space-y-6">
          <div className="rounded-3xl bg-cream p-6">
            <div className="flex flex-wrap items-center gap-3">
              <StatusBadge status={task.status} />
              <PriorityBadge priority={task.priority} />
              <DeadlineLabel task={task} />
            </div>
            <h1 className="mt-3 font-display text-4xl">{task.title}</h1>
            <p className="mt-3 whitespace-pre-wrap text-muted">{task.description || "No description."}</p>
            <p className="mt-4 text-sm text-muted">
              Assigned to {task.assignee?.name || "nobody"} · created by {task.creator?.name}
            </p>
          </div>

          <form className="space-y-4 rounded-3xl bg-cream p-6" onSubmit={save}>
            <h2 className="font-display text-2xl">{isAdmin ? "Edit task" : "Update status"}</h2>
            <ErrorBanner message={error} />
            {notice && <p className="rounded-xl bg-[#dceee4] px-3 py-2 text-sm text-forest">{notice}</p>}
            {isAdmin && (
              <>
                <Field label="Title">
                  <input className={inputClass} value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
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
                      {project?.members.map((member) => (
                        <option key={member.user.id} value={member.user.id}>{member.user.name}</option>
                      ))}
                    </select>
                  </Field>
                </div>
                <Field label="Deadline">
                  <input className={inputClass} type="datetime-local" value={form.deadline} onChange={(e) => setForm({ ...form, deadline: e.target.value })} />
                </Field>
              </>
            )}
            <Field label="Status">
              <select
                className={inputClass}
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value })}
                disabled={!canEditStatus}
              >
                {Object.entries(STATUS_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
            </Field>
            {!canEditStatus && (
              <p className="text-sm text-muted">Only the assigned member (or an admin) can change this task’s status.</p>
            )}
            <button className="rounded-xl bg-accent px-4 py-2.5 font-medium text-white hover:bg-accent-dark" disabled={!canEditStatus}>
              Save changes
            </button>
          </form>

          <section className="rounded-3xl bg-cream p-6">
            <h2 className="font-display text-2xl">Comments & progress</h2>
            <div className="mt-4 space-y-3">
              {comments.length === 0 && <p className="text-muted">No updates yet.</p>}
              {comments.map((item) => (
                <article key={item.id} className="rounded-2xl bg-paper p-4">
                  <p className="text-sm font-medium">
                    {item.author.name} <span className="font-normal text-muted">· {formatDate(item.createdAt, true)}</span>
                  </p>
                  <p className="mt-1 whitespace-pre-wrap">{item.content}</p>
                </article>
              ))}
            </div>
            <form className="mt-4 space-y-3" onSubmit={addComment}>
              <textarea
                className={inputClass}
                rows="3"
                placeholder="Share a comment or progress update"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
              />
              <button className="rounded-xl bg-ink px-4 py-2 text-sm font-medium text-white">Post update</button>
            </form>
          </section>
        </section>

        <aside className="space-y-6">
          <section className="rounded-3xl bg-cream p-6">
            <h2 className="font-display text-2xl">Deadline history</h2>
            <p className="mt-1 text-sm text-muted">Every deadline change is kept so the team can see what moved and when.</p>
            <ol className="mt-5 space-y-4">
              {history.length === 0 && <p className="text-muted">This deadline has not been changed yet.</p>}
              {history.map((entry) => (
                <li key={entry.id} className="relative border-l-2 border-line pl-4">
                  <p className="text-sm font-medium">{formatDate(entry.changedAt, true)}</p>
                  <p className="text-sm text-muted">{entry.changedBy.name} updated the deadline</p>
                  <p className="mt-1 text-sm">
                    <span className="text-muted">{formatDate(entry.previousDeadline, true)}</span>
                    {" → "}
                    <span className="font-medium">{formatDate(entry.newDeadline, true)}</span>
                  </p>
                </li>
              ))}
            </ol>
          </section>

          <section className="rounded-3xl bg-cream p-6">
            <h2 className="font-display text-2xl">Activity</h2>
            <div className="mt-4 space-y-3">
              {activity.map((item) => (
                <p key={item.id} className="text-sm">
                  <span className="font-medium">{item.actor.name}</span>{" "}
                  <span className="text-muted">{item.action.replaceAll("_", " ").toLowerCase()}</span>
                  {item.details ? <span className="block text-muted">{item.details}</span> : null}
                  <span className="block text-xs text-muted">{formatDate(item.createdAt, true)}</span>
                </p>
              ))}
            </div>
          </section>
        </aside>
      </div>
    </div>
  );
}
