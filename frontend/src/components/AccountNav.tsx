import {
  Bell,
  Bookmark,
  Download,
  Laptop,
  Settings,
  UserCircle,
} from "lucide-react";
import { NavLink } from "react-router-dom";

const accountLinks = [
  { to: "/profile", label: "Profile", icon: UserCircle },
  { to: "/account/bookmarks", label: "Bookmarks", icon: Bookmark },
  { to: "/account/downloads", label: "Downloads", icon: Download },
  { to: "/account/preferences", label: "Preferences", icon: Settings },
  { to: "/account/devices", label: "Devices", icon: Laptop },
  { to: "/notifications", label: "Notifications", icon: Bell },
];

export function AccountNav() {
  return (
    <nav aria-label="Account" className="mb-6 sm:mb-8">
      <div className="grid grid-cols-3 gap-2 sm:flex sm:flex-wrap">
        {accountLinks.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === "/profile"}
            className={({ isActive }) =>
              `inline-flex min-h-14 min-w-0 flex-col items-center justify-center gap-1 rounded-lg border px-2 text-center text-[11px] font-bold leading-tight sm:min-h-11 sm:flex-row sm:gap-2 sm:px-4 sm:text-sm ${isActive ? "border-[#002147] bg-[#002147] text-white" : "border-slate-300 bg-white text-slate-700"}`
            }
          >
            <item.icon size={17} aria-hidden="true" />
            <span className="truncate">{item.label}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
