export function Modal({ title, children, onClose }) {
  return (
    <div className="fixed inset-0 z-50 grid place-items-end bg-ink/40 p-4 sm:place-items-center">
      <button className="absolute inset-0 cursor-default" onClick={onClose} aria-label="Close dialog" />
      <div className="relative z-10 w-full max-w-lg rounded-3xl bg-cream p-6 shadow-2xl">
        <div className="mb-4 flex items-start justify-between gap-4">
          <h2 className="font-display text-2xl">{title}</h2>
          <button className="text-sm text-muted hover:text-ink" onClick={onClose}>
            Close
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

export function Field({ label, error, children }) {
  return (
    <label className="block space-y-1.5">
      <span className="text-sm font-medium">{label}</span>
      {children}
      {error ? <span className="text-sm text-accent">{error}</span> : null}
    </label>
  );
}

export const inputClass =
  "w-full rounded-xl border border-line bg-white px-3 py-2.5 text-sm outline-none ring-accent/30 focus:ring-2";

export function ErrorBanner({ message }) {
  if (!message) return null;
  return <div className="rounded-xl bg-[#fde8e4] px-3 py-2 text-sm text-accent-dark">{message}</div>;
}

export function EmptyState({ title, body, action }) {
  return (
    <div className="rounded-3xl border border-dashed border-line bg-cream px-6 py-12 text-center">
      <p className="font-display text-2xl">{title}</p>
      <p className="mx-auto mt-2 max-w-md text-muted">{body}</p>
      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  );
}
