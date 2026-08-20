import { useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "../AuthContext";
import { ErrorBanner, Field, inputClass } from "../components/Form";
import { fieldError } from "../lib";

export function LoginPage() {
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: "admin@nimora.app", password: "Admin@123" });
  const [error, setError] = useState(null);
  const [pending, setPending] = useState(false);

  if (user) return <Navigate to="/" replace />;

  async function onSubmit(event) {
    event.preventDefault();
    setError(null);
    setPending(true);
    try {
      await login(form.email, form.password);
      navigate("/");
    } catch (err) {
      setError(err);
    } finally {
      setPending(false);
    }
  }

  return (
    <AuthShell
      title="Welcome back"
      subtitle="Sign in to manage projects, tasks, and deadlines with your team."
    >
      <form className="space-y-4" onSubmit={onSubmit}>
        <ErrorBanner message={error?.message} />
        <Field label="Email" error={fieldError(error, "email")}>
          <input
            className={inputClass}
            type="email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            required
          />
        </Field>
        <Field label="Password" error={fieldError(error, "password")}>
          <input
            className={inputClass}
            type="password"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            required
          />
        </Field>
        <button
          className="w-full rounded-xl bg-accent px-4 py-3 font-medium text-white hover:bg-accent-dark disabled:opacity-60"
          disabled={pending}
        >
          {pending ? "Signing in…" : "Sign in"}
        </button>
        <p className="text-center text-sm text-muted">
          New here?{" "}
          <Link className="font-medium text-ink underline" to="/register">
            Create a member account
          </Link>
        </p>
        <p className="rounded-xl bg-paper px-3 py-2 text-xs text-muted">
          Demo admin: admin@nimora.app / Admin@123 · member: alex@nimora.app / Member@123
        </p>
      </form>
    </AuthShell>
  );
}

export function RegisterPage() {
  const { user, register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [error, setError] = useState(null);
  const [pending, setPending] = useState(false);

  if (user) return <Navigate to="/" replace />;

  async function onSubmit(event) {
    event.preventDefault();
    setError(null);
    setPending(true);
    try {
      await register(form);
      navigate("/");
    } catch (err) {
      setError(err);
    } finally {
      setPending(false);
    }
  }

  return (
    <AuthShell title="Join the workspace" subtitle="New accounts start as team members. An admin can later assign projects and tasks.">
      <form className="space-y-4" onSubmit={onSubmit}>
        <ErrorBanner message={error?.message} />
        <Field label="Full name" error={fieldError(error, "name")}>
          <input className={inputClass} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
        </Field>
        <Field label="Email" error={fieldError(error, "email")}>
          <input className={inputClass} type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
        </Field>
        <Field label="Password" error={fieldError(error, "password")}>
          <input className={inputClass} type="password" minLength={6} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required />
        </Field>
        <button className="w-full rounded-xl bg-accent px-4 py-3 font-medium text-white hover:bg-accent-dark disabled:opacity-60" disabled={pending}>
          {pending ? "Creating account…" : "Create account"}
        </button>
        <p className="text-center text-sm text-muted">
          Already have access?{" "}
          <Link className="font-medium text-ink underline" to="/login">
            Sign in
          </Link>
        </p>
      </form>
    </AuthShell>
  );
}

function AuthShell({ title, subtitle, children }) {
  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <section className="relative hidden overflow-hidden bg-[#171310] p-12 text-[#f6efe4] lg:flex lg:flex-col lg:justify-between">
        <div className="absolute -right-16 -top-16 h-64 w-64 rounded-full bg-accent/40 blur-3xl" />
        <div className="absolute bottom-10 left-10 h-40 w-40 rounded-full bg-[#2f5d46]/50 blur-2xl" />
        <p className="font-display text-3xl">Nimora</p>
        <div className="relative max-w-md">
          <p className="font-display text-5xl leading-tight">Keep the work moving, together.</p>
          <p className="mt-4 text-[#cfc3b3]">
            Admins shape the plan. Members update status, leave progress notes, and never lose a deadline change.
          </p>
        </div>
        <p className="text-sm text-[#b7aa98]">Full-stack team project & task management</p>
      </section>
      <section className="grid place-items-center px-4 py-10">
        <div className="w-full max-w-md rounded-3xl bg-cream p-8 shadow-sm">
          <h1 className="font-display text-3xl">{title}</h1>
          <p className="mt-2 text-muted">{subtitle}</p>
          <div className="mt-6">{children}</div>
        </div>
      </section>
    </div>
  );
}
