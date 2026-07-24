import {
  BarChart3,
  BookOpen,
  ClipboardCheck,
  FileText,
  Mail,
  BellRing,
  Menu,
  Newspaper,
  ScrollText,
  Settings,
  ShieldAlert,
  Users,
  X,
} from "lucide-react";
import { useCallback, useRef, useState } from "react";
import { NavLink, Outlet } from "react-router-dom";
import { useDialogFocus } from "../../lib/useDialogFocus";
import { useCurrentAuth } from "../../app/AuthContext";
import { canReviewResources } from "../../lib/roles";

const links = [
  ["/admin", "Overview", BarChart3, "review"],
  ["/admin/reviews", "Reviews", ClipboardCheck, "review"],
  ["/admin/resources", "Resources", FileText, "review"],
  ["/admin/posts", "Academic Posts", Newspaper, "posts"],
  ["/admin/users", "Users", Users, "review"],
  ["/admin/academic-structure", "Academic structure", BookOpen, "review"],
  ["/admin/reports", "Reports", ShieldAlert, "review"],
  ["/admin/resource-requests", "Resource Requests", FileText, "review"],
  ["/admin/newsletter", "Newsletter", Mail, "review"],
  ["/admin/notifications", "Push notifications", BellRing, "review"],
  ["/admin/audit-logs", "Audit logs", ScrollText, "review"],
  ["/admin/settings", "Settings", Settings, "review"],
] as const;

export default function AdminLayout() {
  const auth = useCurrentAuth();
  const [open, setOpen] = useState(false);
  const drawer = useRef<HTMLElement>(null);
  const closeMenu = useCallback(() => setOpen(false), []);
  useDialogFocus(open, drawer, closeMenu);
  const navigation = (
    <nav aria-label="Administration" className="space-y-1">
      {links
        .filter(
          ([, , , access]) =>
            access === "posts" ||
            (auth.profile && canReviewResources(auth.profile.role)),
        )
        .map(([to, label, Icon]) => (
          <NavLink
            end={to === "/admin"}
            key={to}
            to={to}
            onClick={() => setOpen(false)}
            className={({ isActive }) =>
              `flex min-h-11 items-center gap-3 rounded-lg px-3 text-sm font-semibold focus-visible:outline-2 ${isActive ? "bg-[#002147] text-white" : "text-slate-700 hover:bg-slate-100"}`
            }
          >
            <Icon size={18} />
            {label}
          </NavLink>
        ))}
    </nav>
  );
  return (
    <div className="min-h-[70vh] bg-slate-50">
      <div className="mx-auto flex max-w-[90rem] gap-6 px-4 py-6 sm:px-6">
        <aside className="hidden w-64 shrink-0 rounded-2xl border border-slate-200 bg-white p-4 lg:block">
          <p className="mb-4 px-3 text-xs font-bold uppercase tracking-wider text-slate-500">
            Administration
          </p>
          {navigation}
        </aside>
        <div className="min-w-0 flex-1">
          <button
            onClick={() => setOpen(true)}
            className="mb-4 inline-flex min-h-11 items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 font-bold lg:hidden"
          >
            <Menu size={18} />
            Admin menu
          </button>
          <Outlet />
        </div>
      </div>
      {open && (
        <div
          className="fixed inset-0 z-[90] bg-slate-950/50 lg:hidden"
          onClick={closeMenu}
        >
          <aside
            ref={drawer}
            role="dialog"
            aria-modal="true"
            aria-label="Admin navigation"
            onClick={(event) => event.stopPropagation()}
            className="h-full w-[min(88vw,20rem)] bg-white p-4"
          >
            <div className="mb-5 flex items-center justify-between">
              <strong>Administration</strong>
              <button
                data-autofocus
                onClick={closeMenu}
                aria-label="Close admin menu"
                className="min-h-11 min-w-11"
              >
                <X className="mx-auto" />
              </button>
            </div>
            {navigation}
          </aside>
        </div>
      )}
    </div>
  );
}
