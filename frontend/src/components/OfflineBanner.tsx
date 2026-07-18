import { WifiOff } from "lucide-react";
import { useEffect, useState } from "react";

export function OfflineBanner() {
  const [online, setOnline] = useState(() => navigator.onLine);

  useEffect(() => {
    const connected = () => setOnline(true);
    const disconnected = () => setOnline(false);
    window.addEventListener("online", connected);
    window.addEventListener("offline", disconnected);
    return () => {
      window.removeEventListener("online", connected);
      window.removeEventListener("offline", disconnected);
    };
  }, []);

  if (online) return null;
  return (
    <div
      className="safe-area-inline fixed inset-x-0 top-0 z-[120] flex min-h-12 items-center justify-center gap-2 bg-amber-100 px-4 py-2 text-center text-sm font-semibold text-amber-950 shadow"
      role="status"
    >
      <WifiOff size={17} aria-hidden="true" />
      You are offline. Account checks and protected documents need a connection.
    </div>
  );
}
