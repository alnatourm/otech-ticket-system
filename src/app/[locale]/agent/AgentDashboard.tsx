"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { ArrowUpRight, CircleCheck, Clock3, ShieldCheck, Ticket, Users } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { createClient } from "@/lib/supabase/client";
import type { AgentTicket } from "./page";

const STATUSES = ["open", "in_progress", "waiting", "resolved", "closed"] as const;

const PILL: Record<string, string> = {
  open: "pill-open",
  in_progress: "pill-progress",
  waiting: "pill-waiting",
  resolved: "pill-resolved",
  closed: "pill-closed",
};

export default function AgentDashboard({ tickets }: { tickets: AgentTicket[] }) {
  const t = useTranslations("ticket");
  const a = useTranslations("agent");
  const d = useTranslations("dashboard");
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
  const count = (status: string) => tickets.filter((tk) => tk.status === status).length;
  const companies = new Set(tickets.map((tk) => tk.companies?.name).filter(Boolean)).size;

  const stats = [
    { label: d("totalTickets"), value: tickets.length, icon: Ticket, tint: "from-indigo-500 to-violet-600" },
    { label: d("openTickets"), value: count("open"), icon: Clock3, tint: "from-sky-500 to-blue-600" },
    { label: d("inProgress"), value: count("in_progress"), icon: ShieldCheck, tint: "from-amber-500 to-orange-600" },
    { label: d("resolved"), value: count("resolved"), icon: CircleCheck, tint: "from-emerald-500 to-teal-600" },
  ];

  return (
    <main className="space-y-5 pb-8">
      <section className="flex flex-wrap items-end justify-between gap-3 px-1">
        <div>
          <h1 className="gradient-text text-2xl font-bold tracking-tight">{a("title")}</h1>
          <p className="muted mt-1">{d("subtitle")}</p>
        </div>
        <span className="pill pill-open">
          <Users size={13} /> {companies} {d("companyLabel")}
        </span>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map(({ label, value, icon: Icon, tint }) => (
          <div key={label} className="stat-card">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="muted text-xs font-medium uppercase tracking-wide">{label}</p>
                <p className="stat-value mt-2">{value}</p>
              </div>
              <span className={`stat-icon bg-gradient-to-br ${tint} text-white`}>
                <Icon size={18} />
              </span>
            </div>
          </div>
        ))}
      </section>

      <section className="glass p-5 sm:p-6">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <h2 className="section-title">{a("inbox")}</h2>
          <div className="flex flex-wrap gap-1.5">
            <button
              onClick={() => setFilter("all")}
              className={`pill ${filter === "all" ? "pill-open" : ""}`}
            >
              {a("allTickets")}
            </button>
            {STATUSES.map((s) => (
              <button
                key={s}
                onClick={() => setFilter(s)}
                className={`pill ${filter === s ? "pill-open" : ""}`}
              >
                {t(`statusOptions.${s}`)}
              </button>
            ))}
          </div>
        </div>

        <div className="grid gap-4 lg:grid-cols-3">
          <div className="space-y-2.5 lg:col-span-2">
            {filtered.map((tk) => (
              <button
                key={tk.id}
                onClick={() => setSelected(tk)}
                className={`glass-soft flex w-full items-center justify-between gap-3 p-4 text-start transition hover:bg-white/90 ${selected?.id === tk.id ? "ring-2 ring-indigo-400" : ""}`}
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-slate-800">{tk.title}</p>
                  <p className="muted mt-1 text-xs">
                    {tk.companies?.name ?? tk.name ?? tk.email} ·{" "}
                    {new Date(tk.created_at).toLocaleDateString()}
                  </p>
                </div>
                <span className={`pill ${PILL[tk.status] ?? ""}`}>
                  {t(`statusOptions.${tk.status}`)}
                </span>
              </button>
            ))}
          </div>

          <div className="glass-soft p-5">
            {selected ? (
              <div className="space-y-4">
                <div>
                  <h3 className="section-title">{selected.title}</h3>
                  <p className="muted mt-1 text-xs">{selected.companies?.name ?? selected.email}</p>
                </div>
                <Link
                  href={`/tickets/${selected.id}`}
                  className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:underline"
                >
                  {a("openTicket")} <ArrowUpRight size={13} />
                </Link>
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-slate-600">
                    {a("changeStatus")}
                  </label>
                  <select
                    value={selected.status}
                    onChange={(e) => changeStatus(selected.id, e.target.value)}
                    className="input"
                  >
                    {STATUSES.map((s) => (
                      <option key={s} value={s}>
                        {t(`statusOptions.${s}`)}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-slate-600">
                    {a("internalNote")}
                  </label>
                  <textarea
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    rows={3}
                    className="input"
                  />
                  <button onClick={addNote} className="btn-primary mt-2 w-full">
                    {a("addNote")}
                  </button>
                </div>
              </div>
            ) : (
              <div className="py-8 text-center">
                <ShieldCheck size={26} className="mx-auto mb-3 text-indigo-300" />
                <p className="muted">{a("selectTicket")}</p>
              </div>
            )}
          </div>
        </div>
      </section>
    </main>
  );
}
