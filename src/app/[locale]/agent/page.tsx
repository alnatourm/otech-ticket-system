"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { createClient } from "@/lib/supabase/client";

type Ticket = {
  id: string;
  title: string;
  email: string;
  name: string | null;
  status: string;
  priority: string;
  category: string;
  created_at: string;
};

const STATUSES = ["open", "in_progress", "waiting", "resolved", "closed"] as const;

export default function AgentDashboard() {
  const t = useTranslations("ticket");
  const a = useTranslations("agent");
  const c = useTranslations("common");
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("all");
  const [selected, setSelected] = useState<Ticket | null>(null);
  const [note, setNote] = useState("");

  async function load() {
    const supabase = createClient();
    const { data } = await supabase
      .from("tickets")
      .select("id,title,email,name,status,priority,category,created_at")
      .order("created_at", { ascending: false });
    setTickets(data ?? []);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  async function changeStatus(id: string, status: string) {
    const supabase = createClient();
    await supabase.from("tickets").update({ status }).eq("id", id);
    await load();
    if (selected?.id === id) setSelected({ ...selected, status });
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
    open: tickets.filter((t) => t.status === "open").length,
    in_progress: tickets.filter((t) => t.status === "in_progress").length,
    resolved: tickets.filter((t) => t.status === "resolved").length,
  };

  return (
    <main className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="mx-auto max-w-6xl px-4 py-8">
        <h1 className="text-2xl font-bold mb-6">{a("title")}</h1>

        <div className="grid grid-cols-3 gap-4 mb-6">
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

        <div className="flex gap-2 mb-4">
          <button
            onClick={() => setFilter("all")}
            className={`px-3 py-1 rounded text-sm ${filter === "all" ? "bg-blue-600 text-white" : "bg-white border"}`}
          >
            {a("allTickets")}
          </button>
          {STATUSES.map((s) => (
            <button
              key={s}
              onClick={() => setFilter(s)}
              className={`px-3 py-1 rounded text-sm ${filter === s ? "bg-blue-600 text-white" : "bg-white border"}`}
            >
              {t(`statusOptions.${s}`)}
            </button>
          ))}
        </div>

        {loading ? (
          <p>{c("loading")}</p>
        ) : (
          <div className="grid gap-4 lg:grid-cols-3">
            <div className="lg:col-span-2 space-y-2">
              {filtered.map((tk) => (
                <button
                  key={tk.id}
                  onClick={() => setSelected(tk)}
                  className={`w-full text-start rounded-lg border bg-white p-4 hover:shadow-sm ${selected?.id === tk.id ? "ring-2 ring-blue-500" : ""}`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{tk.title}</span>
                    <span className="text-xs rounded-full bg-gray-100 px-2 py-1">
                      {t(`statusOptions.${tk.status}`)}
                    </span>
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    {tk.name ?? tk.email} · {tk.category} · {tk.priority} ·{" "}
                    {new Date(tk.created_at).toLocaleDateString()}
                  </div>
                </button>
              ))}
            </div>

            <div className="rounded-lg border bg-white p-4">
              {selected ? (
                <div className="space-y-4">
                  <h2 className="font-semibold">{selected.title}</h2>
                  <div>
                    <label className="block text-sm font-medium mb-1">{a("changeStatus")}</label>
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
                    <label className="block text-sm font-medium mb-1">{a("internalNote")}</label>
                    <textarea
                      value={note}
                      onChange={(e) => setNote(e.target.value)}
                      rows={3}
                      className="w-full rounded-md border px-3 py-2 text-sm"
                    />
                    <button
                      onClick={addNote}
                      className="mt-2 rounded-md bg-gray-800 px-3 py-1.5 text-white text-sm"
                    >
                      {a("addNote")}
                    </button>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-gray-500">Select a ticket.</p>
              )}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}