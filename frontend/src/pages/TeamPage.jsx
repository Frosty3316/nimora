import { useEffect, useState } from "react";
import { api } from "../api";
import { ErrorBanner, Field, Modal, inputClass } from "../components/Form";
import { fieldError, formatDate, initials } from "../lib";
import { AdminOnly } from "../components/ProtectedLayout";

export function TeamPage() {
  return (
    <AdminOnly>
      <TeamInner />
    </AdminOnly>
  );
}

function TeamInner() {
  const [users, setUsers] = useState([]);
  const [error, setError] = useState("");
  const [open, setOpen] = useState(false);

  async function load() {
    const data = await api("/users");
    setUsers(data.users);
  }

  useEffect(() => {
    load().catch((err) => setError(err.message));
  }, []);

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm uppercase tracking-[0.2em] text-muted">Admin</p>
          <h1 className="font-display text-4xl">Team members</h1>
        </div>
        <button className="rounded-xl bg-accent px-4 py-2.5 font-medium text-white hover:bg-accent-dark" onClick={() => setOpen(true)}>
          Add member
        </button>
      </header>
      <ErrorBanner message={error} />
      <div className="overflow-hidden rounded-3xl bg-cream">
        {users.map((user) => (
          <div key={user.id} className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-5 py-4 last:border-b-0">
            <div className="flex items-center gap-3">
              <span className="grid h-10 w-10 place-items-center rounded-full bg-ink text-sm text-white">{initials(user.name)}</span>
              <div>
                <p className="font-medium">{user.name}</p>
                <p className="text-sm text-muted">{user.email}</p>
              </div>
            </div>
            <div className="text-right text-sm">
              <p className="font-medium">{user.role === "ADMIN" ? "Admin" : "Team member"}</p>
              <p className="text-muted">Joined {formatDate(user.createdAt)}</p>
            </div>
          </div>
        ))}
      </div>
      {open && (
        <CreateUserModal
          onClose={() => setOpen(false)}
          onCreated={(user) => {
            setUsers((current) => [...current, user].sort((a, b) => a.name.localeCompare(b.name)));
            setOpen(false);
          }}
        />
      )}
    </div>
  );
}

function CreateUserModal({ onClose, onCreated }) {
  const [form, setForm] = useState({ name: "", email: "", password: "", role: "MEMBER" });
  const [error, setError] = useState(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(event) {
    event.preventDefault();
    setPending(true);
    setError(null);
    try {
      const data = await api("/users", { method: "POST", body: form });
      onCreated(data.user);
    } catch (err) {
      setError(err);
    } finally {
      setPending(false);
    }
  }

  return (
    <Modal title="Add team member" onClose={onClose}>
      <form className="space-y-4" onSubmit={onSubmit}>
        <ErrorBanner message={error?.message} />
        <Field label="Name" error={fieldError(error, "name")}>
          <input className={inputClass} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
        </Field>
        <Field label="Email" error={fieldError(error, "email")}>
          <input className={inputClass} type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
        </Field>
        <Field label="Temporary password" error={fieldError(error, "password")}>
          <input className={inputClass} type="password" minLength={6} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required />
        </Field>
        <Field label="Role">
          <select className={inputClass} value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
            <option value="MEMBER">Team member</option>
            <option value="ADMIN">Admin</option>
          </select>
        </Field>
        <button className="w-full rounded-xl bg-accent py-3 font-medium text-white hover:bg-accent-dark" disabled={pending}>
          {pending ? "Saving…" : "Create account"}
        </button>
      </form>
    </Modal>
  );
}
