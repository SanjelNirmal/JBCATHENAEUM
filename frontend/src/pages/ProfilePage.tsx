import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { LoadingState } from "../components/AsyncState";
import { Seo } from "../components/Seo";
import { useCurrentAuth } from "../app/AuthContext";
import { updateMyProfile } from "../lib/supabase/profiles";
import { supabase } from "../lib/supabase/client";
import { toSafeErrorMessage } from "../lib/supabase/errors";

const emptyForm = {
  name: "",
  faculty: "",
  avatar_url: "",
  bio: "",
};

export default function ProfilePage() {
  const auth = useCurrentAuth();
  const [form, setForm] = useState(emptyForm);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!auth.profile) return;
    setForm({
      name: auth.profile.name ?? "",
      faculty: auth.profile.faculty ?? "",
      avatar_url: auth.profile.avatar_url ?? "",
      bio: auth.profile.bio ?? "",
    });
  }, [auth.profile]);

  if (auth.loading) return <LoadingState label="Loading profile" />;
  if (!auth.user) return <Navigate to="/login?redirect=/profile" replace />;
  const profile = auth.profile;
  if (!profile) {
    return (
      <main id="main-content" className="mx-auto max-w-3xl px-5 py-16">
        <p className="rounded-2xl border border-slate-200 bg-white p-6 text-sm text-slate-700">
          Your profile is not available yet. Please sign in again.
        </p>
      </main>
    );
  }

  const saveProfile = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!auth.user || !profile) return;
    setBusy(true);
    setMessage("");
    const data = new FormData(event.currentTarget);
    const nextName = String(data.get("name") ?? "").trim();
    const nextFaculty = String(data.get("faculty") ?? "").trim();
    const nextAvatar = String(data.get("avatar_url") ?? "").trim();
    const nextBio = String(data.get("bio") ?? "").trim();
    try {
      if (nextAvatar && !/^https:\/\/.+/i.test(nextAvatar)) {
        throw new Error("Avatar URL must start with https://");
      }
      await updateMyProfile(
        auth.user.id,
        nextName,
        nextFaculty,
        nextAvatar,
        nextBio,
      );
      await supabase.auth.updateUser({
        data: { name: nextName, faculty: nextFaculty },
      });
      setMessage("Profile updated. Reloading your account view…");
      window.setTimeout(() => window.location.reload(), 700);
    } catch (error) {
      setMessage(toSafeErrorMessage(error, "auth"));
    } finally {
      setBusy(false);
    }
  };

  const avatarInitials = profile.name
    .split(" ")
    .map((part) => part[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <main id="main-content" className="mx-auto max-w-5xl px-5 py-10 sm:py-16">
      <Seo
        title="My profile"
        description="View and update your JBC Athenaeum profile."
        path="/profile"
        noIndex
      />
      <div className="grid gap-6 lg:grid-cols-[320px_minmax(0,1fr)]">
        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-2xl bg-[#002147] text-2xl font-black text-white">
              {profile.avatar_url ? (
                <img
                  src={profile.avatar_url}
                  alt={`${profile.name} avatar`}
                  className="h-full w-full object-cover"
                />
              ) : (
                avatarInitials || "JB"
              )}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                Account profile
              </p>
              <h1 className="truncate font-serif text-3xl font-bold text-[#002147]">
                {profile.name}
              </h1>
              <p className="mt-1 text-sm text-slate-600">
                {auth.user.email}
              </p>
            </div>
          </div>
          <div className="mt-6 space-y-3 text-sm">
            <Row label="Role" value={profile.role.replaceAll("_", " ")} />
            <Row label="Status" value={profile.account_status} />
            <Row label="Faculty" value={profile.faculty ?? "Unspecified"} />
            <Row label="Member since" value={new Date(profile.created_at).toLocaleDateString()} />
          </div>
          {profile.bio && (
            <div className="mt-6 rounded-2xl bg-slate-50 p-4 text-sm leading-6 text-slate-700">
              {profile.bio}
            </div>
          )}
        </section>

        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <h2 className="font-serif text-2xl font-bold text-[#002147]">
            Edit profile
          </h2>
          <p className="mt-2 text-sm text-slate-600">
            Update the public details shown across JBC Athenaeum.
          </p>
          {message && (
            <p className="mt-5 rounded-xl bg-slate-100 p-4 text-sm" role="status">
              {message}
            </p>
          )}
          <form onSubmit={saveProfile} className="mt-6 space-y-5">
            <Field
              label="Full name"
              name="name"
              value={form.name}
              onChange={(value) => setForm((current) => ({ ...current, name: value }))}
              required
            />
            <Field
              label="Faculty or program"
              name="faculty"
              value={form.faculty}
              onChange={(value) => setForm((current) => ({ ...current, faculty: value }))}
              required
            />
            <Field
              label="Avatar URL"
              name="avatar_url"
              value={form.avatar_url}
              onChange={(value) => setForm((current) => ({ ...current, avatar_url: value }))}
              hint="Use a secure https image URL."
            />
            <label className="block text-sm font-semibold text-slate-700">
              Bio
              <textarea
                name="bio"
                rows={6}
                value={form.bio}
                onChange={(event) =>
                  setForm((current) => ({ ...current, bio: event.target.value }))
                }
                maxLength={2000}
                className="mt-1 w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none focus:border-[#002147] focus:ring-2 focus:ring-[#002147]/15"
              />
            </label>
            <button
              disabled={busy}
              className="min-h-12 rounded-xl bg-[#002147] px-5 font-bold text-white disabled:opacity-50"
            >
              {busy ? "Saving…" : "Save profile"}
            </button>
          </form>
        </section>
      </div>
    </main>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-2xl bg-slate-50 px-4 py-3">
      <span className="font-medium text-slate-500">{label}</span>
      <span className="font-semibold text-slate-900">{value}</span>
    </div>
  );
}

function Field({
  label,
  name,
  value,
  onChange,
  hint,
  required,
}: {
  label: string;
  name: string;
  value: string;
  onChange: (value: string) => void;
  hint?: string;
  required?: boolean;
}) {
  return (
    <label className="block text-sm font-semibold text-slate-700">
      {label}
      <input
        name={name}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        required={required}
        className="mt-1 min-h-12 w-full rounded-2xl border border-slate-300 px-4 outline-none focus:border-[#002147] focus:ring-2 focus:ring-[#002147]/15"
      />
      {hint && <span className="mt-1 block text-xs font-normal text-slate-500">{hint}</span>}
    </label>
  );
}
