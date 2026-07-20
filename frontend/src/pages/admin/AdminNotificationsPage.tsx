import { BellRing, Send, TestTube2 } from "lucide-react";
import { useMemo, useState } from "react";
import { Navigate } from "react-router-dom";
import { useCurrentAuth } from "../../app/AuthContext";
import { Seo } from "../../components/Seo";
import { supabase } from "../../lib/supabase/client";
import { toSafeErrorMessage } from "../../lib/supabase/errors";

type AudienceType = "everyone" | "program" | "term" | "subject";

export default function AdminNotificationsPage() {
  const auth = useCurrentAuth();
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [category, setCategory] = useState("administrative_announcement");
  const [targetUrl, setTargetUrl] = useState("/resources");
  const [audienceType, setAudienceType] = useState<AudienceType>("everyone");
  const [audienceId, setAudienceId] = useState("");
  const [busy, setBusy] = useState(false);
  const [summary, setSummary] = useState("");
  const audience = useMemo(() => ({ type: audienceType, ...(audienceType === "program" ? { programId: audienceId } : audienceType === "term" ? { termId: audienceId } : audienceType === "subject" ? { subjectId: audienceId } : {}) }), [audienceType, audienceId]);
  if (auth.profile?.role !== "admin" && auth.profile?.role !== "super_admin") return <Navigate to="/not-found" replace />;

  const invoke = async (testOnly = false, dryRun = false) => {
    if (!title.trim() || !body.trim()) { setSummary("Title and body are required."); return; }
    if (audienceType !== "everyone" && !audienceId) { setSummary("Enter the selected audience UUID."); return; }
    if (!testOnly && !dryRun && !window.confirm(`Send this notification to ${audienceType === "everyone" ? "all eligible users" : `the selected ${audienceType}`}?`)) return;
    setBusy(true); setSummary("");
    try {
      const { data, error } = await supabase.functions.invoke("send-push-notification", { body: { title, body, category, targetUrl, audience, testOnly, dryRun } });
      if (error) throw error;
      setSummary(dryRun ? `Estimated eligible devices: ${data.recipients}.` : `Delivery complete: ${data.sent} sent, ${data.failed} failed, ${data.skipped} skipped.`);
    } catch (error) { setSummary(toSafeErrorMessage(error)); } finally { setBusy(false); }
  };
  return (
    <main id="main-content">
      <Seo title="Push notifications" description="Compose secure push campaigns." path="/admin/notifications" noIndex />
      <div className="flex items-center gap-3"><BellRing className="text-[#85591f]" /><h1 className="font-serif text-3xl font-bold text-[#002147]">Push notifications</h1></div>
      <p className="mt-2 text-sm text-slate-600">Messages are sent by the authenticated Edge Function; device tokens never reach this page.</p>
      <div className="mt-7 grid gap-6 xl:grid-cols-[1fr_22rem]">
        <form onSubmit={(event) => { event.preventDefault(); void invoke(); }} className="space-y-5 rounded-2xl border border-slate-200 bg-white p-6">
          <label className="block font-semibold text-[#002147]">Title<input value={title} maxLength={120} onChange={(event) => setTitle(event.target.value)} className="mt-2 min-h-11 w-full rounded-lg border border-slate-300 px-3" /></label>
          <label className="block font-semibold text-[#002147]">Body<textarea value={body} maxLength={500} rows={5} onChange={(event) => setBody(event.target.value)} className="mt-2 w-full rounded-lg border border-slate-300 p-3" /></label>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="font-semibold text-[#002147]">Category<select value={category} onChange={(event) => setCategory(event.target.value)} className="mt-2 min-h-11 w-full rounded-lg border border-slate-300 px-3"><option value="administrative_announcement">Administrative announcement</option><option value="new_resource">New resource</option><option value="past_question">Past question</option><option value="review_update">Review update</option><option value="account_security">Account security</option></select></label>
            <label className="font-semibold text-[#002147]">Internal destination<input value={targetUrl} onChange={(event) => setTargetUrl(event.target.value)} pattern="/.*" className="mt-2 min-h-11 w-full rounded-lg border border-slate-300 px-3" /></label>
            <label className="font-semibold text-[#002147]">Audience<select value={audienceType} onChange={(event) => setAudienceType(event.target.value as AudienceType)} className="mt-2 min-h-11 w-full rounded-lg border border-slate-300 px-3"><option value="everyone">Everyone</option><option value="program">Program</option><option value="term">Semester / term</option><option value="subject">Subject</option></select></label>
            {audienceType !== "everyone" && <label className="font-semibold text-[#002147]">{audienceType} UUID<input value={audienceId} onChange={(event) => setAudienceId(event.target.value)} className="mt-2 min-h-11 w-full rounded-lg border border-slate-300 px-3" /></label>}
          </div>
          {summary && <p role="status" className="rounded-lg bg-slate-100 p-3 text-sm">{summary}</p>}
          <div className="flex flex-wrap gap-3"><button disabled={busy} className="inline-flex min-h-11 items-center gap-2 rounded-lg bg-[#001b3a] px-5 font-bold text-white disabled:opacity-50"><Send size={18} />Send now</button><button type="button" disabled={busy} onClick={() => void invoke(true)} className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-[#c49b63] px-5 font-bold"><TestTube2 size={18} />Send test to me</button><button type="button" disabled={busy} onClick={() => void invoke(false, true)} className="min-h-11 rounded-lg border border-slate-300 px-5 font-bold">Estimate recipients</button></div>
        </form>
        <aside className="rounded-2xl border border-[#d8b37a] bg-[#fffaf2] p-6"><p className="text-xs font-bold uppercase tracking-wider text-[#85591f]">Preview</p><div className="mt-4 rounded-xl bg-white p-4 shadow"><strong className="text-[#001b3a]">{title || "Notification title"}</strong><p className="mt-2 text-sm text-slate-600">{body || "Notification body will appear here."}</p></div><p className="mt-5 text-xs leading-5 text-slate-600">Scheduling is intentionally unavailable until a secure scheduler is deployed.</p></aside>
      </div>
    </main>
  );
}
