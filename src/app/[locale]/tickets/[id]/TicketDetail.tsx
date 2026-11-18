"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
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

export default function TicketDetail({ id }: { id: string }) {
  const t = useTranslations("ticket");
  const c = useTranslations("common");
  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [replies, setReplies] = useState<Reply[]>([]);
  const [loading, setLoading] = useState(true);
  const [reply, setReply] = useState("");
  const [sending, setSending] = useState(false);

  async function load() {
    const supabase = createClient();
    const { data: tk } = await supabase
      .from("tickets")
      .select("*")
      .eq("id", id)
      .single();
    const { data: rps } = await supabase
      .from("ticket_replies")
      .select("*")
      .eq("ticket_id", id)
      .eq("is_internal", false)
      .order("created_at", { ascending: true });
    setTicket(tk ?? null);
    setReplies(rps ?? []);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, [id]);

  async function sendReply(e: React.FormEvent) {
    e.preventDefault();
    if (!reply.trim() || !ticket) return;
    setSending(true);
    const supabase = createClient();
    await supabase.from("ticket_replies").insert({
      ticket_id: id,
      body: reply,
      is_agent: false,
      is_internal: false,
      author_name: ticket.name,
      author_email: ticket.email,
    });
    setReply("");
    await load();
    setSending(false);
  }

  if (loading) return <p>{c("loading")}</p>;
  if (!ticket) return <p>Ticket not found.</p>;

  return (
    <div>
      <Link href="/tickets" className="text-sm text-blue-600 hover:underline">
        ← {c("back")}
      </Link>

      <div className="mt-4 rounded-lg border bg-white p-6">
        <div className="flex items-start justify-between gap-4">
          <h1 className="text-xl font-bold">{ticket.title}</h1>
          <span className="text-xs rounded-full bg-gray-100 px-2 py-1">
            {t(`statusOptions.${ticket.status}`)}
          </span>
        </div>
        <p className="text-sm text-gray-500 mt-1">
          {t("ticketId")}: {ticket.id}
        </p>
        <p className="mt-4 whitespace-pre-wrap">{ticket.description}</p>
        <div className="mt-4 text-xs text-gray-500 grid grid-cols-2 gap-2">
          <span>{c("category")}: {t(`categoryOptions.${ticket.category}`)}</span>
          <span>{c("priority")}: {t(`priorityOptions.${ticket.priority}`)}</span>
          <span>{c("created")}: {new Date(ticket.created_at).toLocaleString()}</span>
          <span>{c("updated")}: {new Date(ticket.updated_at).toLocaleString()}</span>
        </div>
      </div>

      <div className="mt-6 space-y-3">
        <h2 className="font-semibold">Replies</h2>
        {replies.length === 0 && <p className="text-sm text-gray-500">No replies yet.</p>}
        {replies.map((r) => (
          <div
            key={r.id}
            className={`rounded-lg border p-4 ${r.is_agent ? "bg-blue-50" : "bg-white"}`}
          >
            <div className="text-xs text-gray-500 mb-1">
              {r.author_name ?? "Customer"} · {new Date(r.created_at).toLocaleString()}
            </div>
            <p className="whitespace-pre-wrap">{r.body}</p>
          </div>
        ))}
      </div>

      <form onSubmit={sendReply} className="mt-6 flex gap-2">
        <input
          value={reply}
          onChange={(e) => setReply(e.target.value)}
          placeholder={t("replyPlaceholder")}
          className="flex-1 rounded-md border px-3 py-2"
        />
        <button
          type="submit"
          disabled={sending}
          className="rounded-md bg-blue-600 px-4 py-2 text-white text-sm disabled:opacity-50"
        >
          {sending ? c("loading") : t("sendReply")}
        </button>
      </form>
    </div>
  );
}