"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
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
    <div>
      <Link href="/tickets" className="text-sm text-blue-600 hover:underline">
        ← {c("back")}
      </Link>

      <div className="mt-4 rounded-lg border bg-white p-6">
        <div className="flex items-start justify-between gap-4">
          <h1 className="text-xl font-bold">{ticket.title}</h1>
          <span className="rounded-full bg-gray-100 px-2 py-1 text-xs">
            {t(`statusOptions.${ticket.status}`)}
          </span>
        </div>
        <p className="mt-1 text-sm text-gray-500">
          {t("ticketId")}: {ticket.id}
        </p>
        <p className="mt-4 whitespace-pre-wrap">{ticket.description}</p>
        <div className="mt-4 grid grid-cols-2 gap-2 text-xs text-gray-500">
          <span>{c("category")}: {t(`categoryOptions.${ticket.category}`)}</span>
          <span>{c("priority")}: {t(`priorityOptions.${ticket.priority}`)}</span>
          <span>{c("created")}: {new Date(ticket.created_at).toLocaleString()}</span>
          <span>{c("updated")}: {new Date(ticket.updated_at).toLocaleString()}</span>
        </div>
      </div>

      <div className="mt-6 space-y-3">
        <h2 className="font-semibold">{t("replies")}</h2>
        {replies.length === 0 && <p className="text-sm text-gray-500">{t("noReplies")}</p>}
        {replies.map((r) => (
          <div
            key={r.id}
            className={`rounded-lg border p-4 ${r.is_internal ? "bg-yellow-50" : r.is_agent ? "bg-blue-50" : "bg-white"}`}
          >
            <div className="mb-1 text-xs text-gray-500">
              {r.author_name ?? t("customer")} ·{" "}
              {new Date(r.created_at).toLocaleString()}
              {r.is_internal && <span className="ms-2 font-semibold">· {t("internal")}</span>}
            </div>
            <p className="whitespace-pre-wrap">{r.body}</p>
          </div>
        ))}
      </div>

      <form onSubmit={sendReply} className="mt-6 space-y-3">
        <input
          value={reply}
          onChange={(e) => setReply(e.target.value)}
          placeholder={t("replyPlaceholder")}
          className="w-full rounded-md border px-3 py-2"
        />
        {isAgent && (
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={internal}
              onChange={(e) => setInternal(e.target.checked)}
            />
            {t("internalNote")}
          </label>
        )}
        <button
          type="submit"
          disabled={sending}
          className="rounded-md bg-blue-600 px-4 py-2 text-sm text-white disabled:opacity-50"
        >
          {sending ? c("loading") : t("sendReply")}
        </button>
      </form>
    </div>
  );
}
