import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api";
import { useAuth } from "../AuthContext";
import { DeadlineLabel, ProgressBar, StatusBadge } from "../components/Badges";
import { ErrorBanner } from "../components/Form";
import { formatDate } from "../lib";

export function DashboardPage() {
  const { user, isAdmin } = useAuth();
  const [data, setData] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    api("/dashboard")
      .then(setData)
      .catch((err) => setError(err.message));
  }, []);

  if (error) return <ErrorBanner message={error} />;
  if (!data) return <p className="text-muted">Loading overview…</p>;

  const cards = [
    { label: "Projects", value: data.stats.projects },
    { label: "Open work", value: data.stats.tasks - data.stats.done },
    { label: "In progress", value: data.stats.inProgress },
    { label: "Overdue", value: data.stats.overdue },
  ];

  return (
    <div className="space-y-8">
      <header>
        <p className="text-sm uppercase tracking-[0.2em] text-muted">{isAdmin ? "Admin workspace" : "Member workspace"}</p>
        <h1 className="mt-1 font-display text-4xl">Good to see you, {user.name.split(" ")[0]}.</h1>
        <p className="mt-2 max-w-2xl text-muted">
          Track project progress, assigned work, and upcoming deadlines from one place.
        </p>
      </header>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map((card) => (
          <div key={card.label} className="rounded-3xl bg-cream p-5 shadow-sm">
            <p className="text-sm text-muted">{card.label}</p>
            <p className="mt-2 font-display text-4xl">{card.value}</p>
          </div>
        ))}
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <div className="rounded-3xl bg-cream p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-display text-2xl">Project progress</h2>
            <Link className="text-sm font-medium text-accent" to="/projects">
              View all
            </Link>
          </div>
          <div className="space-y-4">
            {data.projects.length === 0 ? (
              <p className="text-muted">No projects yet.</p>
            ) : (
              data.projects.map((project) => (
                <Link key={project.id} to={`/projects/${project.id}`} className="block rounded-2xl border border-line p-4 hover:bg-paper">
                  <div className="mb-2 flex items-center justify-between gap-3">
                    <p className="font-medium">{project.name}</p>
                    <p className="text-sm text-muted">{project.percent}%</p>
                  </div>
                  <ProgressBar percent={project.percent} />
                  <p className="mt-2 text-xs text-muted">
                    {project.done}/{project.total} tasks complete · {project.memberCount} members
                  </p>
                </Link>
              ))
            )}
          </div>
        </div>

        <div className="rounded-3xl bg-cream p-6">
          <h2 className="font-display text-2xl">Upcoming deadlines</h2>
          <div className="mt-4 space-y-3">
            {data.upcoming.length === 0 ? (
              <p className="text-muted">Nothing due soon.</p>
            ) : (
              data.upcoming.map((task) => (
                <Link key={task.id} to={`/tasks/${task.id}`} className="block rounded-2xl border border-line p-3 hover:bg-paper">
                  <p className="font-medium">{task.title}</p>
                  <div className="mt-1 flex items-center justify-between text-sm">
                    <span className="text-muted">{task.project?.name}</span>
                    <DeadlineLabel task={task} />
                  </div>
                </Link>
              ))
            )}
          </div>
        </div>
      </section>

      <section className="rounded-3xl bg-cream p-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-display text-2xl">Assigned to you</h2>
          <Link className="text-sm font-medium text-accent" to="/my-tasks">
            Open my tasks
          </Link>
        </div>
        <div className="divide-y divide-line">
          {data.myTasks.length === 0 ? (
            <p className="text-muted">No tasks assigned yet.</p>
          ) : (
            data.myTasks.map((task) => (
              <Link key={task.id} to={`/tasks/${task.id}`} className="flex flex-wrap items-center justify-between gap-3 py-3">
                <div>
                  <p className="font-medium">{task.title}</p>
                  <p className="text-sm text-muted">{task.project?.name} · due {formatDate(task.deadline)}</p>
                </div>
                <StatusBadge status={task.status} />
              </Link>
            ))
          )}
        </div>
      </section>
    </div>
  );
}
