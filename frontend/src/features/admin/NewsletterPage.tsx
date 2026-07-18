import { useQuery } from "@tanstack/react-query";
import { Copy, Database, Mail, Plus, Send } from "lucide-react";
import type { FormEvent } from "react";
import { useState } from "react";
import {
  EmptyState,
  ErrorState,
  LoadingState,
} from "../../components/AsyncState";
import { Seo } from "../../components/Seo";
import {
  fetchSubscribers,
  subscribeToNewsletter,
} from "../../lib/supabase/newsletter";

const defaultNewsletterSubject = "JBC ATHENAEUM | New academic resources added";

const defaultNewsletterBody = `Greetings Scholar,

New academic resources have been added to the JBC ATHENAEUM archive.

Latest additions:
- New project and PDF resources
- Faculty notes and reference materials
- Exam preparation resources

Open the archive:
https://jbc.nirmalsanjel.com.np/

Warm regards,
JBC ATHENAEUM`;

export default function NewsletterPage() {
  const [subject, setSubject] = useState(defaultNewsletterSubject);
  const [body, setBody] = useState(defaultNewsletterBody);
  const [subscriberEmail, setSubscriberEmail] = useState("");
  const [addingSubscriber, setAddingSubscriber] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [messageType, setMessageType] = useState<"info" | "success" | "error">(
    "info",
  );

  const query = useQuery({
    queryKey: ["newsletter-subscribers"],
    queryFn: fetchSubscribers,
  });

  const subscribers = query.data ?? [];
  const emails = subscribers.map((subscriber) => subscriber.email);
  const bccList = emails.join(",");

  const notify = (text: string, type: "info" | "success" | "error") => {
    setMessage(text);
    setMessageType(type);
  };

  const copyText = async (label: string, value: string) => {
    if (!value.trim()) {
      notify(`No ${label.toLowerCase()} to copy.`, "error");
      return;
    }

    try {
      await navigator.clipboard.writeText(value);
      notify(`${label} copied.`, "success");
    } catch (error) {
      console.error(error);
      notify("Copy failed. Select and copy the text manually.", "error");
    }
  };

  const composeEmail = () => {
    if (emails.length === 0) {
      notify("No newsletter subscribers are available.", "error");
      return;
    }

    const mailtoUrl = `mailto:?bcc=${encodeURIComponent(
      bccList,
    )}&subject=${encodeURIComponent(
      subject.trim() || defaultNewsletterSubject,
    )}&body=${encodeURIComponent(body.trim())}`;

    if (mailtoUrl.length > 1800) {
      notify(
        "Subscriber list is large. Copy BCC, subject, and message into your email app manually.",
        "info",
      );
      return;
    }

    window.location.href = mailtoUrl;
  };

  const addSubscriber = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const email = subscriberEmail.trim();

    if (!email || !email.includes("@")) {
      notify("Enter a valid subscriber email address.", "error");
      return;
    }

    setAddingSubscriber(true);
    try {
      const inserted = await subscribeToNewsletter(email);
      setSubscriberEmail("");
      await query.refetch();
      notify(
        inserted ? "Subscriber added." : "That email was already subscribed.",
        "success",
      );
    } catch (error) {
      console.error(error);
      notify("Subscriber could not be added.", "error");
    } finally {
      setAddingSubscriber(false);
    }
  };

  return (
    <main id="main-content">
      <Seo
        title="Newsletter"
        description="Prepare manual subscriber bulletins."
        path="/admin/newsletter"
        noIndex
      />
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="font-serif text-3xl font-bold text-[#002147]">
            Newsletter
          </h1>
          <p className="mt-2 text-sm text-slate-600">
            Prepare a bulletin and send it from your own email app using BCC.
          </p>
        </div>
        <button
          onClick={() => void query.refetch()}
          disabled={query.isFetching}
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-4 text-sm font-bold text-slate-700 disabled:opacity-50"
        >
          <Database
            size={16}
            className={query.isFetching ? "animate-spin" : ""}
          />
          Refresh
        </button>
      </div>

      <section className="mt-6 rounded-xl border border-slate-200 bg-white p-5">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4">
          <div className="flex items-center gap-2 font-bold text-[#002147]">
            <Mail size={18} className="text-[#85591f]" />
            Manual bulletin
          </div>
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
            {subscribers.length} subscribers
          </span>
        </div>

        <div className="mt-5 space-y-5">
          <div>
            <label
              htmlFor="newsletter-subject"
              className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-500"
            >
              Subject
            </label>
            <input
              id="newsletter-subject"
              value={subject}
              onChange={(event) => setSubject(event.target.value)}
              className="w-full rounded-lg border border-slate-300 px-4 py-3 text-sm focus:border-[#002147] focus:outline-none"
            />
          </div>

          <div>
            <label
              htmlFor="newsletter-body"
              className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-500"
            >
              Message
            </label>
            <textarea
              id="newsletter-body"
              value={body}
              onChange={(event) => setBody(event.target.value)}
              rows={10}
              className="w-full rounded-lg border border-slate-300 px-4 py-3 text-sm leading-6 focus:border-[#002147] focus:outline-none"
            />
          </div>

          <div>
            <label
              htmlFor="newsletter-bcc"
              className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-500"
            >
              BCC recipients
            </label>
            <textarea
              id="newsletter-bcc"
              value={bccList}
              readOnly
              rows={3}
              className="w-full rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-xs leading-5 text-slate-600 focus:outline-none"
            />
          </div>

          {message && (
            <p
              className={`rounded-lg px-4 py-3 text-sm ${
                messageType === "success"
                  ? "bg-green-50 text-green-700"
                  : messageType === "error"
                    ? "bg-red-50 text-red-700"
                    : "bg-blue-50 text-blue-700"
              }`}
            >
              {message}
            </p>
          )}

          <div className="flex flex-wrap gap-3">
            <button
              onClick={composeEmail}
              disabled={emails.length === 0}
              className="inline-flex min-h-11 items-center gap-2 rounded-lg bg-[#85591f] px-5 text-sm font-bold text-white disabled:bg-slate-300"
            >
              <Send size={16} />
              Compose email
            </button>
            <button
              onClick={() => copyText("BCC recipients", bccList)}
              disabled={emails.length === 0}
              className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-slate-300 px-5 text-sm font-bold text-slate-700 disabled:opacity-50"
            >
              <Copy size={16} />
              Copy BCC
            </button>
            <button
              onClick={() =>
                copyText("Newsletter draft", `Subject: ${subject}\n\n${body}`)
              }
              className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-slate-300 px-5 text-sm font-bold text-slate-700"
            >
              <Copy size={16} />
              Copy draft
            </button>
          </div>
        </div>
      </section>

      <section className="mt-6 rounded-xl border border-slate-200 bg-white p-5">
        <h2 className="font-serif text-xl font-bold text-[#002147]">
          Add subscriber
        </h2>
        <form
          onSubmit={addSubscriber}
          className="mt-4 flex flex-col gap-3 sm:flex-row"
        >
          <label className="sr-only" htmlFor="subscriber-email">
            Subscriber email
          </label>
          <input
            id="subscriber-email"
            type="email"
            value={subscriberEmail}
            onChange={(event) => setSubscriberEmail(event.target.value)}
            placeholder="student@example.com"
            className="min-h-11 flex-1 rounded-lg border border-slate-300 px-4 text-sm focus:border-[#002147] focus:outline-none"
          />
          <button
            type="submit"
            disabled={addingSubscriber}
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-[#002147] px-5 text-sm font-bold text-white disabled:bg-slate-300"
          >
            <Plus size={16} />
            {addingSubscriber ? "Adding..." : "Add subscriber"}
          </button>
        </form>
      </section>

      <section className="mt-6">
        {query.isLoading ? (
          <LoadingState label="Loading subscribers" />
        ) : query.isError ? (
          <ErrorState
            message="Newsletter subscribers could not be loaded."
            retry={() => void query.refetch()}
          />
        ) : subscribers.length === 0 ? (
          <EmptyState
            title="No subscribers"
            message="Subscribers appear here after visitors use the footer signup form."
          />
        ) : (
          <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
            <table className="w-full min-w-[40rem] text-left text-sm">
              <thead className="bg-slate-50">
                <tr>
                  <th scope="col" className="p-3">
                    Email address
                  </th>
                  <th scope="col" className="p-3">
                    Subscription date
                  </th>
                </tr>
              </thead>
              <tbody>
                {subscribers.map((subscriber) => (
                  <tr key={subscriber.id} className="border-t border-slate-100">
                    <td className="p-3 font-semibold text-slate-800">
                      {subscriber.email}
                    </td>
                    <td className="p-3 text-slate-600">
                      {new Date(subscriber.created_at).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </main>
  );
}
