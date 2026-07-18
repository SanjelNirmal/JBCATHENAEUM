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
    <nav aria-label="Account" className="mb-8 overflow-x-auto pb-2">
      <div className="flex min-w-max gap-2">
        {accountLinks.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === "/profile"}
            className={({ isActive }) =>
              `inline-flex min-h-11 items-center gap-2 rounded-lg border px-4 text-sm font-bold ${isActive ? "border-[#002147] bg-[#002147] text-white" : "border-slate-300 bg-white text-slate-700"}`
            }
          >
            <item.icon size={17} aria-hidden="true" />
            {item.label}
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
