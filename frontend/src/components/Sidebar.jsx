import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../AuthContext";
import { initials } from "../lib";

const links = [
  { to: "/", label: "Overview", end: true },
  { to: "/projects", label: "Projects" },
  { to: "/my-tasks", label: "My tasks" },
];

export function Sidebar() {
  const { user, isAdmin, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <aside className="bg-[#171310] text-[#f6efe4] lg:sticky lg:top-0 lg:h-screen">
      <div className="flex items-center justify-between gap-4 px-5 py-5 lg:block lg:px-6 lg:py-7">
        <div>
          <p className="font-display text-2xl tracking-tight">Nimora</p>
          <p className="mt-1 text-xs uppercase tracking-[0.22em] text-[#b7aa98]">Projects & tasks</p>
        </div>
        <button
          className="rounded-full border border-white/15 px-3 py-1 text-sm lg:hidden"
          onClick={() => {
            logout();
            navigate("/login");
          }}
        >
          Exit
        </button>
      </div>

      <nav className="flex gap-1 overflow-x-auto px-3 pb-3 lg:block lg:space-y-1 lg:px-4">
        {links.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            end={link.end}
            className={({ isActive }) =>
              `block whitespace-nowrap rounded-xl px-3 py-2 text-sm transition ${
                isActive ? "bg-white/10 text-white" : "text-[#cfc3b3] hover:bg-white/5 hover:text-white"
              }`
            }
          >
            {link.label}
          </NavLink>
        ))}
        {isAdmin && (
          <NavLink
            to="/team"
            className={({ isActive }) =>
              `block whitespace-nowrap rounded-xl px-3 py-2 text-sm transition ${
                isActive ? "bg-white/10 text-white" : "text-[#cfc3b3] hover:bg-white/5 hover:text-white"
              }`
            }
          >
            Team
          </NavLink>
        )}
      </nav>

      <div className="hidden border-t border-white/10 p-5 lg:mt-8 lg:block">
        <div className="flex items-center gap-3">
          <div className="grid h-10 w-10 place-items-center rounded-full bg-accent text-sm font-semibold text-white">
            {initials(user.name)}
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-medium">{user.name}</p>
            <p className="truncate text-xs text-[#b7aa98]">{user.role === "ADMIN" ? "Admin" : "Team member"}</p>
          </div>
        </div>
        <button
          className="mt-4 w-full rounded-xl border border-white/15 px-3 py-2 text-sm text-[#e8ddd0] hover:bg-white/5"
          onClick={() => {
            logout();
            navigate("/login");
          }}
        >
          Sign out
        </button>
      </div>
    </aside>
  );
}
