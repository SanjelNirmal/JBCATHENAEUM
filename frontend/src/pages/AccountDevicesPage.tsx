import { Laptop, Smartphone, Trash2 } from "lucide-react";
import { useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useCurrentAuth } from "../app/AuthContext";
import { AccountNav } from "../components/AccountNav";
import { EmptyState, ErrorState, LoadingState } from "../components/AsyncState";
import { Seo } from "../components/Seo";
import { useUserDevices } from "../features/engagement/hooks";
import { toSafeErrorMessage } from "../lib/supabase/errors";
import { webDeviceAdapter } from "../platform";

export default function AccountDevicesPage() {
  const auth = useCurrentAuth();
  const location = useLocation();
  const query = useUserDevices(auth.user?.id);
  const [name, setName] = useState("");
  const [message, setMessage] = useState("");
  if (auth.loading) return <LoadingState label="Loading devices" />;
  if (!auth.user)
    return (
      <Navigate
        to={`/login?redirect=${encodeURIComponent(location.pathname)}`}
        replace
      />
    );
  const register = async () => {
    setMessage("");
    try {
      const registration = await webDeviceAdapter.register(name);
      if (!registration) throw new Error("device_registration_unavailable");
      await query.register.mutateAsync(registration);
      setName("");
      setMessage("This browser is registered to your account.");
    } catch (error) {
      setMessage(toSafeErrorMessage(error));
    }
  };
  const remove = async (deviceId: string) => {
    setMessage("");
    try {
      await query.remove.mutateAsync(deviceId);
      setMessage("Device removed.");
    } catch (error) {
      setMessage(toSafeErrorMessage(error));
    }
  };
  return (
    <main
      id="main-content"
      className="mx-auto w-full max-w-5xl px-4 py-10 sm:px-6"
    >
      <Seo
        title="Registered devices"
        description="Manage devices registered with your JBC Athenaeum account."
        path="/account/devices"
        noIndex
      />
      <AccountNav />
      <div className="flex items-center gap-3">
        <Laptop className="text-[#85591f]" aria-hidden="true" />
        <h1 className="font-serif text-4xl font-bold text-[#002147]">
          Registered devices
        </h1>
      </div>
      <p className="mt-2 text-slate-600">
        Device registration prepares the platform for a future mobile app. Push
        delivery is not active.
      </p>
      <section className="mt-8 rounded-xl border border-slate-200 bg-white p-5">
        <h2 className="font-bold text-[#002147]">Register this browser</h2>
        <div className="mt-4 flex flex-col gap-3 sm:flex-row">
          <label className="flex-1 text-sm font-semibold text-slate-700">
            Device name
            <input
              value={name}
              onChange={(event) => setName(event.target.value)}
              maxLength={160}
              placeholder="My iPhone or study laptop"
              className="mt-1 min-h-11 w-full rounded-lg border border-slate-300 px-3"
            />
          </label>
          <button
            type="button"
            disabled={query.register.isPending}
            onClick={() => void register()}
            className="min-h-11 self-end rounded-lg bg-[#002147] px-5 font-bold text-white disabled:opacity-50"
          >
            {query.register.isPending ? "Registering…" : "Register browser"}
          </button>
        </div>
        {message && (
          <p role="status" className="mt-4 rounded-lg bg-slate-100 p-3 text-sm">
            {message}
          </p>
        )}
      </section>
      <div className="mt-6">
        {query.isLoading ? (
          <LoadingState label="Loading devices" />
        ) : query.isError ? (
          <ErrorState
            message="Devices could not be loaded."
            retry={() => void query.refetch()}
          />
        ) : query.data?.length === 0 ? (
          <EmptyState
            title="No registered devices"
            message="Register this browser when you are ready."
          />
        ) : (
          <ul className="space-y-3">
            {query.data?.map((device) => (
              <li
                key={device.id}
                className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-slate-200 bg-white p-5"
              >
                <div className="flex items-start gap-3">
                  {device.platform === "web" ? (
                    <Laptop aria-hidden="true" />
                  ) : (
                    <Smartphone aria-hidden="true" />
                  )}
                  <div>
                    <h2 className="font-bold text-[#002147]">
                      {device.deviceName || "Unnamed device"}
                    </h2>
                    <p className="mt-1 text-xs uppercase tracking-wider text-slate-500">
                      {device.platform} ·{" "}
                      {device.appVersion || "Version unavailable"}
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      Last active{" "}
                      {new Date(device.lastActiveAt).toLocaleString()}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  disabled={query.remove.isPending}
                  onClick={() => void remove(device.id)}
                  className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-red-200 px-4 text-sm font-bold text-red-700 disabled:opacity-50"
                >
                  <Trash2 size={16} aria-hidden="true" /> Remove
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </main>
  );
}
