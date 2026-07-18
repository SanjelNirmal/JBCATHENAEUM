import {
  Bell,
  BookOpen,
  GraduationCap,
  LogOut,
  Menu,
  Search,
  Shield,
  UploadCloud,
  UserCircle,
  X,
} from "lucide-react";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ComponentType,
} from "react";
import { useQuery } from "@tanstack/react-query";
import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import { canReviewResources } from "../lib/roles";
import { signOut } from "../lib/supabase/auth";
import { useCurrentAuth } from "../app/AuthContext";
import { useDialogFocus } from "../lib/useDialogFocus";
import { fetchUnreadNotificationCount } from "../lib/supabase/notifications";

const links = [
  { to: "/resources", label: "Resources", icon: BookOpen },
  { to: "/faculties", label: "Academics", icon: GraduationCap },
  { to: "/contribute", label: "Contribute", icon: UploadCloud },
];

export function SiteHeader() {
  const auth = useCurrentAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const unreadNotifications = useQuery({
    queryKey: ["notifications", "unread-count", auth.user?.id],
    queryFn: fetchUnreadNotificationCount,
    enabled: Boolean(auth.user),
    refetchInterval: 60_000,
  });
  const menuButton = useRef<HTMLButtonElement>(null);
  const drawer = useRef<HTMLDivElement>(null);
  const closeMenu = useCallback(() => setOpen(false), []);
  useDialogFocus(open, drawer, closeMenu);
  useEffect(() => setOpen(false), [location.pathname, location.search]);
  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [open]);
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
    <>
      <header className="safe-area-top sticky top-0 z-50 border-b border-slate-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex min-h-14 max-w-7xl items-center gap-3 px-4 sm:min-h-16 sm:px-6 min-[960px]:min-h-20 lg:px-8">
          <Link
            to="/"
            className="min-w-0 shrink whitespace-nowrap font-serif text-[15px] font-black uppercase leading-tight text-[#002147] focus-visible:outline-2 focus-visible:outline-offset-4 sm:text-lg"
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
            className="ml-auto hidden max-w-xs flex-1 items-center rounded-xl border border-slate-300 bg-slate-50 px-3 focus-within:outline-[3px] focus-within:outline-offset-[3px] focus-within:outline-[#b7791f] min-[720px]:flex"
          >
            <Search size={17} className="text-slate-500" aria-hidden="true" />
            <label htmlFor="site-search" className="sr-only">
              Search resources
            </label>
            <input
              id="site-search"
              type="search"
              name="q"
              autoComplete="off"
              enterKeyHint="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              className="site-search-input min-w-0 flex-1 bg-transparent px-2 py-2 text-sm"
              placeholder="Search resources"
            />
          </form>
          {auth.profile ? (
            <div className="hidden items-center gap-3 min-[960px]:flex">
              <Link
                to="/profile"
                className="inline-flex items-center gap-2 rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700"
              >
                <UserCircle size={17} />
                Profile
              </Link>
              <Link
                to="/notifications"
                aria-label={`Notifications${(unreadNotifications.data ?? 0) > 0 ? `, ${unreadNotifications.data} unread` : ""}`}
                title="Notifications"
                className="relative inline-flex min-h-10 min-w-10 items-center justify-center rounded-lg border border-slate-300"
              >
                <Bell size={17} />
                {(unreadNotifications.data ?? 0) > 0 && (
                  <span className="absolute -right-2 -top-2 inline-flex min-h-5 min-w-5 items-center justify-center rounded-full bg-red-700 px-1 text-[10px] font-black text-white">
                    {Math.min(unreadNotifications.data ?? 0, 99)}
                  </span>
                )}
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
            className="ml-auto inline-flex min-h-11 min-w-11 shrink-0 items-center justify-center rounded-lg border border-slate-300 bg-white text-[#002147] min-[960px]:hidden"
          >
            <Menu size={22} />
          </button>
        </div>
        {open && (
          <div
            className="fixed inset-0 z-[70] bg-slate-950/55 min-[960px]:hidden"
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
              className="safe-area-top ml-auto flex h-dvh w-full max-w-sm flex-col overflow-y-auto bg-white shadow-2xl"
            >
              <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-200 bg-white px-5 py-4">
                <div>
                  <span className="font-serif font-bold text-[#002147]">
                    JBC Athenaeum
                  </span>
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Navigation
                  </p>
                </div>
                <button
                  onClick={() => {
                    closeMenu();
                  }}
                  aria-label="Close navigation"
                  className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-lg border border-slate-200"
                >
                  <X />
                </button>
              </div>
              <div className="px-5 pb-[calc(1rem+env(safe-area-inset-bottom))]">
                <form
                  onSubmit={submitSearch}
                  role="search"
                  className="mt-6 flex rounded-xl border border-slate-300 p-2 focus-within:outline-[3px] focus-within:outline-offset-[3px] focus-within:outline-[#b7791f]"
                >
                  <label htmlFor="mobile-site-search" className="sr-only">
                    Search resources
                  </label>
                  <input
                    id="mobile-site-search"
                    type="search"
                    name="q"
                    autoComplete="off"
                    enterKeyHint="search"
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    className="site-search-input min-w-0 flex-1 px-2"
                    placeholder="Search resources"
                  />
                  <button
                    aria-label="Submit search"
                    className="min-h-11 min-w-11 rounded-lg bg-[#002147] text-white"
                  >
                    <Search className="mx-auto" size={18} />
                  </button>
                </form>
                <nav aria-label="Mobile primary" className="mt-6 grid gap-2">
                  {links.map((item, index) => (
                    <NavLink
                      data-autofocus={index === 0 ? "true" : undefined}
                      key={item.to}
                      to={item.to}
                      onClick={() => setOpen(false)}
                      className={({ isActive }) =>
                        `flex min-h-13 items-center gap-3 rounded-xl px-4 py-3 font-bold ${isActive ? "bg-[#002147] text-white" : "bg-slate-50 text-slate-800"}`
                      }
                    >
                      <item.icon size={20} />
                      {item.label}
                    </NavLink>
                  ))}
                  {auth.profile && (
                    <NavLink
                      to="/profile"
                      onClick={() => setOpen(false)}
                      className={({ isActive }) =>
                        `flex min-h-13 items-center gap-3 rounded-xl px-4 py-3 font-bold ${isActive ? "bg-[#002147] text-white" : "bg-slate-50 text-slate-800"}`
                      }
                    >
                      <UserCircle size={20} />
                      Profile
                    </NavLink>
                  )}
                  {auth.profile && (
                    <NavLink
                      to="/notifications"
                      onClick={() => setOpen(false)}
                      className={({ isActive }) =>
                        `flex min-h-13 items-center gap-3 rounded-xl px-4 py-3 font-bold ${isActive ? "bg-[#002147] text-white" : "bg-slate-50 text-slate-800"}`
                      }
                    >
                      <Bell size={20} />
                      Notifications
                      {(unreadNotifications.data ?? 0) > 0 && (
                        <span className="ml-auto rounded-full bg-red-700 px-2 py-0.5 text-xs text-white">
                          {Math.min(unreadNotifications.data ?? 0, 99)} unread
                        </span>
                      )}
                    </NavLink>
                  )}
                  {auth.profile && canReviewResources(auth.profile.role) && (
                    <NavLink
                      to="/admin"
                      onClick={() => setOpen(false)}
                      className={({ isActive }) =>
                        `flex min-h-13 items-center gap-3 rounded-xl px-4 py-3 font-bold ${isActive ? "bg-[#002147] text-white" : "bg-slate-50 text-slate-800"}`
                      }
                    >
                      <Shield size={20} />
                      Admin dashboard
                    </NavLink>
                  )}
                </nav>
                <div className="mt-8 border-t border-slate-200 pt-5">
                  {auth.profile ? (
                    <button
                      onClick={() => void logout()}
                      className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl border border-slate-300 font-bold"
                    >
                      <LogOut size={18} />
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
          </div>
        )}
      </header>
      <MobileBottomNav openMenu={() => setOpen(true)} />
    </>
  );
}

function MobileBottomNav({ openMenu }: { openMenu: () => void }) {
  return (
    <nav
      aria-label="Mobile quick navigation"
      className="safe-area-inline fixed inset-x-0 bottom-0 z-40 border-t border-slate-200 bg-white/95 px-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-2 shadow-[0_-10px_30px_rgba(15,23,42,0.08)] backdrop-blur min-[960px]:hidden"
    >
      <div className="mx-auto grid max-w-md grid-cols-4 gap-1">
        {links.map((item) => (
          <MobileNavLink
            key={item.to}
            to={item.to}
            label={item.label}
            icon={item.icon}
          />
        ))}
        <button
          type="button"
          onClick={openMenu}
          className="flex min-h-14 flex-col items-center justify-center gap-1 rounded-xl text-xs font-bold text-slate-600"
        >
          <Menu size={20} />
          Menu
        </button>
      </div>
    </nav>
  );
}

function MobileNavLink({
  to,
  label,
  icon: Icon,
}: {
  to: string;
  label: string;
  icon: ComponentType<{ size?: number; className?: string }>;
}) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        `flex min-h-14 flex-col items-center justify-center gap-1 rounded-xl text-xs font-bold ${isActive ? "bg-[#002147] text-white" : "text-slate-600"}`
      }
    >
      <Icon size={20} />
      <span>{label}</span>
    </NavLink>
  );
}
