"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { ArrowLeft, Send } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { createClient } from "@/lib/supabase/client";

type Reply = {
  id: string;
  body: string;
  is_agent: boolean;
  is_internal: boolean;
  author_name: string | null;
  created_at: string;
};

type Ticket = {
  id: string;
  title: string;
  description: string;
  status: string;
  priority: string;
  category: string;
  email: string;
  name: string | null;
  created_at: string;
  updated_at: string;
};

type Props = {
  ticket: Ticket;
  replies: Reply[];
  authorName: string | null;
  authorEmail: string;
  isAgent: boolean;
};

const PILL: Record<string, string> = {
  open: "pill-open",
  in_progress: "pill-progress",
  waiting: "pill-waiting",
  resolved: "pill-resolved",
  closed: "pill-closed",
};

export default function TicketDetail({
  ticket,
  replies,
  authorName,
  authorEmail,
  isAgent,
}: Props) {
  const t = useTranslations("ticket");
  const c = useTranslations("common");
  const router = useRouter();
  const [reply, setReply] = useState("");
  const [internal, setInternal] = useState(false);
  const [sending, setSending] = useState(false);

  async function sendReply(e: React.FormEvent) {
    e.preventDefault();
    if (!reply.trim()) return;
    setSending(true);
    const supabase = createClient();
    const { error } = await supabase.from("ticket_replies").insert({
      ticket_id: ticket.id,
      body: reply,
      is_agent: isAgent,
      is_internal: isAgent && internal,
      author_name: authorName,
      author_email: authorEmail,
    });
    if (!error) {
      setReply("");
      router.refresh();
    }
    setSending(false);
  }

  return (
    <main className="space-y-5 pb-8">
      <Link href="/tickets" className="inline-flex items-center gap-1 text-sm font-medium text-indigo-600 hover:underline">
        <ArrowLeft size={15} /> {c("back")}
      </Link>

      <section className="glass p-5 sm:p-6">
        <div className="flex items-start justify-between gap-4">
          <h1 className="text-xl font-bold text-slate-800">{ticket.title}</h1>
          <span className={`pill ${PILL[ticket.status] ?? ""}`}>
            {t(`statusOptions.${ticket.status}`)}
          </span>
        </div>
        <p className="muted mt-1 text-xs">
          {t("ticketId")}: {ticket.id}
        </p>
        <p className="mt-5 whitespace-pre-wrap leading-relaxed text-slate-700">{ticket.description}</p>
        <div className="mt-5 grid grid-cols-2 gap-3 border-t border-white/80 pt-4 text-xs text-slate-500 sm:grid-cols-4">
          <span>{c("category")}: <b className="text-slate-700">{t(`categoryOptions.${ticket.category}`)}</b></span>
          <span>{c("priority")}: <b className="text-slate-700">{t(`priorityOptions.${ticket.priority}`)}</b></span>
          <span>{c("created")}: <b className="text-slate-700">{new Date(ticket.created_at).toLocaleString()}</b></span>
          <span>{c("updated")}: <b className="text-slate-700">{new Date(ticket.updated_at).toLocaleString()}</b></span>
        </div>
      </section>

      <section className="glass p-5 sm:p-6">
        <h2 className="section-title mb-4">{t("replies")}</h2>
        {replies.length === 0 ? (
          <p className="muted">{t("noReplies")}</p>
        ) : (
          <div className="space-y-2.5">
            {replies.map((r) => (
              <div
                key={r.id}
                className={`glass-soft p-4 ${r.is_internal ? "border-amber-200/70 bg-amber-50/60" : r.is_agent ? "border-indigo-200/70 bg-indigo-50/60" : ""}`}
              >
                <div className="mb-1 text-xs text-slate-500">
                  <b className="text-slate-700">{r.author_name ?? t("customer")}</b> ·{" "}
                  {new Date(r.created_at).toLocaleString()}
                  {r.is_internal && (
                    <span className="pill pill-progress ms-2">· {t("internal")}</span>
                  )}
                </div>
                <p className="whitespace-pre-wrap text-sm text-slate-700">{r.body}</p>
              </div>
            ))}
          </div>
        )}

        <form onSubmit={sendReply} className="mt-6 space-y-3">
          <input
            value={reply}
            onChange={(e) => setReply(e.target.value)}
            placeholder={t("replyPlaceholder")}
            className="input"
          />
          {isAgent && (
            <label className="flex items-center gap-2 text-sm text-slate-600">
              <input
                type="checkbox"
                checked={internal}
                onChange={(e) => setInternal(e.target.checked)}
                className="h-4 w-4 accent-indigo-600"
              />
              {t("internalNote")}
            </label>
          )}
          <button type="submit" disabled={sending} className="btn-primary">
            <Send size={15} /> {sending ? c("loading") : t("sendReply")}
          </button>
        </form>
      </section>
    </main>
  );
}
