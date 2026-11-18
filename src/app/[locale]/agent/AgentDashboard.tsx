"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { createClient } from "@/lib/supabase/client";
import type { AgentTicket } from "./page";

const STATUSES = ["open", "in_progress", "waiting", "resolved", "closed"] as const;

export default function AgentDashboard({ tickets }: { tickets: AgentTicket[] }) {
  const t = useTranslations("ticket");
  const a = useTranslations("agent");
  const router = useRouter();
  const [filter, setFilter] = useState<string>("all");
  const [selected, setSelected] = useState<AgentTicket | null>(null);
  const [note, setNote] = useState("");

  async function changeStatus(id: string, status: string) {
    const supabase = createClient();
    await supabase.from("tickets").update({ status }).eq("id", id);
    if (selected?.id === id) setSelected({ ...selected, status });
    router.refresh();
  }

  async function addNote() {
    if (!note.trim() || !selected) return;
    const supabase = createClient();
    await supabase.from("ticket_replies").insert({
      ticket_id: selected.id,
      body: note,
      is_agent: true,
      is_internal: true,
      author_name: "Agent",
    });
    setNote("");
  }

  const filtered =
    filter === "all" ? tickets : tickets.filter((tk) => tk.status === filter);

  const counts = {
    open: tickets.filter((tk) => tk.status === "open").length,
    in_progress: tickets.filter((tk) => tk.status === "in_progress").length,
    resolved: tickets.filter((tk) => tk.status === "resolved").length,
  };

  return (
    <main className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="mx-auto max-w-6xl px-4 py-8">
        <h1 className="mb-6 text-2xl font-bold">{a("title")}</h1>

        <div className="mb-6 grid grid-cols-3 gap-4">
          <div className="rounded-lg border bg-white p-4">
            <div className="text-sm text-gray-500">{a("stats.open")}</div>
            <div className="text-2xl font-bold">{counts.open}</div>
          </div>
          <div className="rounded-lg border bg-white p-4">
            <div className="text-sm text-gray-500">{a("stats.inProgress")}</div>
            <div className="text-2xl font-bold">{counts.in_progress}</div>
          </div>
          <div className="rounded-lg border bg-white p-4">
            <div className="text-sm text-gray-500">{a("stats.resolved")}</div>
            <div className="text-2xl font-bold">{counts.resolved}</div>
          </div>
        </div>

        <div className="mb-4 flex flex-wrap gap-2">
          <button
            onClick={() => setFilter("all")}
            className={`rounded px-3 py-1 text-sm ${filter === "all" ? "bg-blue-600 text-white" : "border bg-white"}`}
          >
            {a("allTickets")}
          </button>
          {STATUSES.map((s) => (
            <button
              key={s}
              onClick={() => setFilter(s)}
              className={`rounded px-3 py-1 text-sm ${filter === s ? "bg-blue-600 text-white" : "border bg-white"}`}
            >
              {t(`statusOptions.${s}`)}
            </button>
          ))}
        </div>

        <div className="grid gap-4 lg:grid-cols-3">
          <div className="space-y-2 lg:col-span-2">
            {filtered.map((tk) => (
              <button
                key={tk.id}
                onClick={() => setSelected(tk)}
                className={`w-full rounded-lg border bg-white p-4 text-start hover:shadow-sm ${selected?.id === tk.id ? "ring-2 ring-blue-500" : ""}`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="font-medium">{tk.title}</span>
                  <span className="rounded-full bg-gray-100 px-2 py-1 text-xs">
                    {t(`statusOptions.${tk.status}`)}
                  </span>
                </div>
                <div className="mt-1 text-xs text-gray-500">
                  {tk.companies?.name ?? tk.name ?? tk.email} ·{" "}
                  {t(`categoryOptions.${tk.category}`)} ·{" "}
                  {new Date(tk.created_at).toLocaleDateString()}
                </div>
              </button>
            ))}
          </div>

          <div className="rounded-lg border bg-white p-4">
            {selected ? (
              <div className="space-y-4">
                <h2 className="font-semibold">{selected.title}</h2>
                <Link
                  href={`/tickets/${selected.id}`}
                  className="inline-block text-sm text-blue-600 hover:underline"
                >
                  {a("openTicket")}
                </Link>
                <div>
                  <label className="mb-1 block text-sm font-medium">
                    {a("changeStatus")}
                  </label>
                  <select
                    value={selected.status}
                    onChange={(e) => changeStatus(selected.id, e.target.value)}
                    className="w-full rounded-md border px-3 py-2 text-sm"
                  >
                    {STATUSES.map((s) => (
                      <option key={s} value={s}>
                        {t(`statusOptions.${s}`)}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium">
                    {a("internalNote")}
                  </label>
                  <textarea
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    rows={3}
                    className="w-full rounded-md border px-3 py-2 text-sm"
                  />
                  <button
                    onClick={addNote}
                    className="mt-2 rounded-md bg-gray-800 px-3 py-1.5 text-sm text-white"
                  >
                    {a("addNote")}
                  </button>
                </div>
              </div>
            ) : (
              <p className="text-sm text-gray-500">{a("selectTicket")}</p>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
