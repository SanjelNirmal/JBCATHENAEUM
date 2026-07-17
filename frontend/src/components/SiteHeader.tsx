import { Bell, Menu, Search, Shield, X } from "lucide-react";
import { useCallback, useRef, useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { canReviewResources } from "../lib/roles";
import { signOut } from "../lib/supabase/auth";
import { useCurrentAuth } from "../app/AuthContext";
import { useDialogFocus } from "../lib/useDialogFocus";

const links = [
  { to: "/resources", label: "Resources" },
  { to: "/faculties", label: "Academics" },
  { to: "/contribute", label: "Contribute" },
];

export function SiteHeader() {
  const auth = useCurrentAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const menuButton = useRef<HTMLButtonElement>(null);
  const drawer = useRef<HTMLDivElement>(null);
  const closeMenu = useCallback(() => setOpen(false), []);
  useDialogFocus(open, drawer, closeMenu);
  const submitSearch = (event: React.FormEvent) => {
    event.preventDefault();
    const q = search.trim();
    navigate(q ? `/resources?q=${encodeURIComponent(q)}` : "/resources");
    setOpen(false);
  };
  const logout = async () => {
    await signOut();
    navigate("/");
  };
  return (
    <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/95 backdrop-blur">
      <div className="mx-auto flex min-h-20 max-w-7xl items-center gap-4 px-4 sm:px-6 lg:px-8">
        <Link
          to="/"
          className="shrink-0 font-serif text-lg font-black uppercase text-[#002147] focus-visible:outline-2 focus-visible:outline-offset-4"
        >
          JBC <span className="text-[#85591f]">Athenaeum</span>
        </Link>
        <nav
          aria-label="Primary"
          className="ml-6 hidden items-center gap-6 text-sm font-semibold min-[960px]:flex"
        >
          {links.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `rounded px-1 py-2 focus-visible:outline-2 ${isActive ? "text-[#85591f] underline decoration-2 underline-offset-8" : "text-slate-700 hover:text-[#002147]"}`
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
        <form
          onSubmit={submitSearch}
          role="search"
          className="ml-auto hidden max-w-xs flex-1 items-center rounded-xl border border-slate-300 bg-slate-50 px-3 min-[720px]:flex"
        >
          <Search size={17} className="text-slate-500" aria-hidden="true" />
          <label htmlFor="site-search" className="sr-only">
            Search resources
          </label>
          <input
            id="site-search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            className="min-w-0 flex-1 bg-transparent px-2 py-2 text-sm outline-none"
            placeholder="Search resources"
          />
        </form>
        {auth.profile ? (
          <div className="hidden items-center gap-3 min-[960px]:flex">
            <Link
              to="/my-submissions"
              className="text-sm font-semibold text-slate-700"
            >
              My submissions
            </Link>
            <Link
              to="/notifications"
              aria-label="Notifications"
              title="Notifications"
              className="inline-flex min-h-10 min-w-10 items-center justify-center rounded-lg border border-slate-300"
            >
              <Bell size={17} />
            </Link>
            {canReviewResources(auth.profile.role) && (
              <Link
                to="/admin"
                className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-[#002147] px-3 text-xs font-bold text-[#002147]"
              >
                <Shield size={15} />
                Admin
              </Link>
            )}
            <button
              onClick={() => void logout()}
              className="min-h-10 rounded-lg px-3 text-sm font-semibold text-slate-600"
            >
              Log out
            </button>
          </div>
        ) : (
          <Link
            to="/login"
            className="hidden min-h-10 items-center rounded-lg bg-[#002147] px-4 text-sm font-bold text-white min-[960px]:inline-flex"
          >
            Sign in
          </Link>
        )}
        <button
          ref={menuButton}
          onClick={() => setOpen(true)}
          aria-expanded={open}
          aria-controls="mobile-menu"
          aria-label="Open navigation"
          className="ml-auto inline-flex min-h-11 min-w-11 items-center justify-center rounded-lg border border-slate-300 min-[960px]:hidden"
        >
          <Menu />
        </button>
      </div>
      {open && (
        <div
          className="fixed inset-0 z-50 bg-slate-950/50 min-[960px]:hidden"
          role="presentation"
          onMouseDown={closeMenu}
        >
          <div
            ref={drawer}
            id="mobile-menu"
            role="dialog"
            aria-modal="true"
            aria-label="Navigation"
            onMouseDown={(event) => event.stopPropagation()}
            className="ml-auto flex h-full w-[min(88vw,22rem)] flex-col bg-white p-5 shadow-2xl"
          >
            <div className="flex items-center justify-between">
              <span className="font-serif font-bold text-[#002147]">
                Navigation
              </span>
              <button
                onClick={() => {
                  closeMenu();
                }}
                aria-label="Close navigation"
                className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-lg"
              >
                <X />
              </button>
            </div>
            <form
              onSubmit={submitSearch}
              role="search"
              className="mt-6 flex rounded-xl border border-slate-300 p-2"
            >
              <label htmlFor="mobile-site-search" className="sr-only">
                Search resources
              </label>
              <input
                id="mobile-site-search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                className="min-w-0 flex-1 px-2 outline-none"
                placeholder="Search resources"
              />
              <button
                aria-label="Submit search"
                className="min-h-11 min-w-11 rounded-lg bg-[#002147] text-white"
              >
                <Search className="mx-auto" size={18} />
              </button>
            </form>
            <nav aria-label="Mobile primary" className="mt-6 flex flex-col">
              {links.map((item, index) => (
                <NavLink
                  data-autofocus={index === 0 ? "true" : undefined}
                  key={item.to}
                  to={item.to}
                  onClick={() => setOpen(false)}
                  className="min-h-12 border-b border-slate-100 py-3 font-semibold text-slate-800"
                >
                  {item.label}
                </NavLink>
              ))}
              {auth.profile && (
                <NavLink
                  to="/my-submissions"
                  onClick={() => setOpen(false)}
                  className="min-h-12 border-b border-slate-100 py-3 font-semibold"
                >
                  My submissions
                </NavLink>
              )}
              {auth.profile && (
                <NavLink
                  to="/notifications"
                  onClick={() => setOpen(false)}
                  className="min-h-12 border-b border-slate-100 py-3 font-semibold"
                >
                  Notifications
                </NavLink>
              )}
              {auth.profile && canReviewResources(auth.profile.role) && (
                <NavLink
                  to="/admin"
                  onClick={() => setOpen(false)}
                  className="min-h-12 border-b border-slate-100 py-3 font-semibold"
                >
                  Admin dashboard
                </NavLink>
              )}
            </nav>
            <div className="mt-auto">
              {auth.profile ? (
                <button
                  onClick={() => void logout()}
                  className="min-h-12 w-full rounded-xl border border-slate-300 font-bold"
                >
                  Log out
                </button>
              ) : (
                <Link
                  to="/login"
                  onClick={() => setOpen(false)}
                  className="flex min-h-12 items-center justify-center rounded-xl bg-[#002147] font-bold text-white"
                >
                  Sign in
                </Link>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
