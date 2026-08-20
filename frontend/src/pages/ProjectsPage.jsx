import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api";
import { useAuth } from "../AuthContext";
import { ProgressBar } from "../components/Badges";
import { EmptyState, ErrorBanner, Field, Modal, inputClass } from "../components/Form";
import { fieldError } from "../lib";

export function ProjectsPage() {
  const { isAdmin } = useAuth();
  const [projects, setProjects] = useState([]);
  const [error, setError] = useState("");
  const [open, setOpen] = useState(false);

  async function load() {
    try {
      const data = await api("/projects");
      setProjects(data.projects);
    } catch (err) {
      setError(err.message);
    }
  }

  useEffect(() => {
    load();
  }, []);

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm uppercase tracking-[0.2em] text-muted">Workspace</p>
          <h1 className="font-display text-4xl">Projects</h1>
        </div>
        {isAdmin && (
          <button className="rounded-xl bg-accent px-4 py-2.5 font-medium text-white hover:bg-accent-dark" onClick={() => setOpen(true)}>
            New project
          </button>
        )}
      </header>
      <ErrorBanner message={error} />
      {projects.length === 0 ? (
        <EmptyState
          title="No projects yet"
          body={isAdmin ? "Create a project, add teammates, then start assigning work." : "An admin needs to add you to a project before it appears here."}
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {projects.map((project) => (
            <Link key={project.id} to={`/projects/${project.id}`} className="rounded-3xl bg-cream p-6 shadow-sm transition hover:-translate-y-0.5">
              <p className="font-display text-2xl">{project.name}</p>
              <p className="mt-2 line-clamp-2 text-sm text-muted">{project.description || "No description"}</p>
              <div className="mt-5">
                <div className="mb-2 flex justify-between text-sm">
                  <span>{project.progress.done}/{project.progress.total} complete</span>
                  <span>{project.progress.percent}%</span>
                </div>
                <ProgressBar percent={project.progress.percent} />
              </div>
              <p className="mt-4 text-xs text-muted">{project.members?.length || 0} members</p>
            </Link>
          ))}
        </div>
      )}
      {open && (
        <CreateProjectModal
          onClose={() => setOpen(false)}
          onCreated={(project) => {
            setProjects((current) => [project, ...current]);
            setOpen(false);
          }}
        />
      )}
    </div>
  );
}

function CreateProjectModal({ onClose, onCreated }) {
  const [form, setForm] = useState({ name: "", description: "" });
  const [error, setError] = useState(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(event) {
    event.preventDefault();
    setPending(true);
    setError(null);
    try {
      const data = await api("/projects", { method: "POST", body: form });
      onCreated(data.project);
    } catch (err) {
      setError(err);
    } finally {
      setPending(false);
    }
  }

  return (
    <Modal title="Create project" onClose={onClose}>
      <form className="space-y-4" onSubmit={onSubmit}>
        <ErrorBanner message={error?.message} />
        <Field label="Name" error={fieldError(error, "name")}>
          <input className={inputClass} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
        </Field>
        <Field label="Description">
          <textarea className={inputClass} rows="3" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
        </Field>
        <button className="w-full rounded-xl bg-accent py-3 font-medium text-white hover:bg-accent-dark" disabled={pending}>
          {pending ? "Creating…" : "Create project"}
        </button>
      </form>
    </Modal>
  );
}
