"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import {
  ArrowUpRight,
  CircleCheck,
  Clock3,
  Search,
  ShieldCheck,
  Ticket,
  UserCheck,
  Users,
  X,
} from "lucide-react";
import { Link } from "@/i18n/navigation";
import { createClient } from "@/lib/supabase/client";

export type AgentTicket = {
  id: string;
  title: string;
  email: string;
  name: string | null;
  status: string;
  priority: string;
  category: string;
  created_at: string;
  assigned_to?: string | null;
  companies: { name: string } | null;
};

export type Assignee = {
  id: string;
  fullName: string | null;
  role: string;
};

const STATUSES = ["open", "in_progress", "waiting", "resolved", "closed"] as const;
const PAGE_SIZE = 20;

const PILL: Record<string, string> = {
  open: "pill-open",
  in_progress: "pill-progress",
  waiting: "pill-waiting",
  resolved: "pill-resolved",
  closed: "pill-closed",
};

export default function AgentDashboard({
  tickets,
  assignees,
  currentUserId,
}: {
  tickets: AgentTicket[];
  assignees: Assignee[];
  currentUserId: string;
}) {
  const t = useTranslations("ticket");
  const a = useTranslations("agent");
  const d = useTranslations("dashboard");
  const c = useTranslations("common");
  const router = useRouter();

  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [assigneeFilter, setAssigneeFilter] = useState<"all" | "mine" | "unassigned">("all");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<AgentTicket | null>(null);
  const [note, setNote] = useState("");
  const [updatingAssignee, setUpdatingAssignee] = useState(false);

  const assigneeMap = useMemo(() => {
    const map = new Map<string, string>();
    assignees.forEach((ag) => {
      map.set(ag.id, ag.fullName || ag.id);
    });
    return map;
  }, [assignees]);

  async function changeStatus(id: string, status: string) {
    const supabase = createClient();
    await supabase.from("tickets").update({ status }).eq("id", id);
    if (selected?.id === id) setSelected({ ...selected, status });
    router.refresh();
  }

  async function changeAssignee(id: string, assignedTo: string) {
    setUpdatingAssignee(true);
    const supabase = createClient();
    const val = assignedTo === "" ? null : assignedTo;
    const { error } = await supabase.from("tickets").update({ assigned_to: val }).eq("id", id);
    if (!error) {
      if (selected?.id === id) setSelected({ ...selected, assigned_to: val });
      router.refresh();
    }
    setUpdatingAssignee(false);
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

  // Client-side filtering on the already-fetched list is acceptable for 0.2; server-side search is required past ~500 tickets.
  const filtered = useMemo(() => {
    return tickets.filter((tk) => {
      // Status filter
      if (statusFilter !== "all" && tk.status !== statusFilter) return false;

      // Assignee filter
      if (assigneeFilter === "mine" && tk.assigned_to !== currentUserId) return false;
      if (assigneeFilter === "unassigned" && Boolean(tk.assigned_to)) return false;

      // Immediate case-insensitive search on title, company name (agent view), requester email
      if (search.trim()) {
        const q = search.trim().toLowerCase();
        const matchTitle = tk.title?.toLowerCase().includes(q);
        const matchCompany = tk.companies?.name?.toLowerCase().includes(q);
        const matchEmail = tk.email?.toLowerCase().includes(q);
        if (!matchTitle && !matchCompany && !matchEmail) return false;
      }

      return true;
    });
  }, [tickets, statusFilter, assigneeFilter, search, currentUserId]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const paginated = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

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
        <div className="mb-5 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="section-title">{a("inbox")}</h2>
          </div>

          {/* Search box sitting above the list */}
          <div className="relative">
            <Search size={15} className="pointer-events-none absolute inset-y-0 start-3 my-auto text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder={a("searchPlaceholder")}
              className="input w-full ps-9 text-sm"
            />
            {search && (
              <button
                type="button"
                onClick={() => {
                  setSearch("");
                  setPage(1);
                }}
                className="absolute inset-y-0 end-3 my-auto text-slate-400 hover:text-slate-600"
                aria-label={c("cancel")}
              >
                <X size={14} />
              </button>
            )}
          </div>

          {/* Combined Filters: Status + Assignee */}
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            {/* Status filters */}
            <div className="flex flex-wrap gap-1.5">
              <button
                type="button"
                onClick={() => {
                  setStatusFilter("all");
                  setPage(1);
                }}
                className={`pill ${statusFilter === "all" ? "pill-open" : ""}`}
              >
                {a("allTickets")}
              </button>
              {STATUSES.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => {
                    setStatusFilter(s);
                    setPage(1);
                  }}
                  className={`pill ${statusFilter === s ? "pill-open" : ""}`}
                >
                  {t(`statusOptions.${s}`)}
                </button>
              ))}
            </div>

            {/* Assignee filter: All · Mine · Unassigned */}
            <div className="flex flex-wrap items-center gap-1.5 border-t border-slate-200/60 pt-2 lg:border-t-0 lg:pt-0">
              <span className="me-1 text-xs font-medium text-slate-500">{a("assigneeFilter")}:</span>
              <button
                type="button"
                onClick={() => {
                  setAssigneeFilter("all");
                  setPage(1);
                }}
                className={`pill ${assigneeFilter === "all" ? "pill-open" : ""}`}
              >
                {a("filterAll")}
              </button>
              <button
                type="button"
                onClick={() => {
                  setAssigneeFilter("mine");
                  setPage(1);
                }}
                className={`pill ${assigneeFilter === "mine" ? "pill-open" : ""}`}
              >
                {a("filterMine")}
              </button>
              <button
                type="button"
                onClick={() => {
                  setAssigneeFilter("unassigned");
                  setPage(1);
                }}
                className={`pill ${assigneeFilter === "unassigned" ? "pill-open" : ""}`}
              >
                {a("filterUnassigned")}
              </button>
            </div>
          </div>
        </div>

        <div className="grid gap-4 lg:grid-cols-3">
          <div className="space-y-2.5 lg:col-span-2">
            {filtered.length === 0 ? (
              <div className="rounded-xl border border-dashed border-slate-200 bg-white/50 px-4 py-10 text-center">
                <p className="muted text-sm">{a("noMatchingTickets")}</p>
              </div>
            ) : (
              paginated.map((tk) => {
                const assigneeName = tk.assigned_to ? assigneeMap.get(tk.assigned_to) : null;
                return (
                  <button
                    key={tk.id}
                    onClick={() => setSelected(tk)}
                    className={`glass-soft flex w-full items-center justify-between gap-3 p-4 text-start transition hover:bg-white/90 ${selected?.id === tk.id ? "ring-2 ring-indigo-400" : ""}`}
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-slate-800">{tk.title}</p>
                      <div className="mt-1 flex flex-wrap items-center gap-1.5 text-xs text-slate-500">
                        <span>
                          {tk.companies?.name ?? tk.name ?? tk.email} ·{" "}
                          {new Date(tk.created_at).toLocaleDateString()}
                        </span>
                        {assigneeName && (
                          <span className="inline-flex items-center gap-1 rounded-md bg-indigo-50 px-2 py-0.5 text-[11px] font-medium text-indigo-700">
                            <UserCheck size={11} /> {assigneeName}
                          </span>
                        )}
                      </div>
                    </div>
                    <span className={`pill shrink-0 ${PILL[tk.status] ?? ""}`}>
                      {t(`statusOptions.${tk.status}`)}
                    </span>
                  </button>
                );
              })
            )}

            {/* Pagination */}
            {filtered.length > 0 && (
              <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200/60 pt-4 text-xs">
                <button
                  type="button"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage <= 1}
                  className="btn-soft px-3 py-1.5 text-xs disabled:cursor-not-allowed disabled:opacity-40"
                >
                  {c("previous")}
                </button>
                <span className="muted font-medium">
                  {c("pageOf", { current: currentPage, total: totalPages })}
                </span>
                <button
                  type="button"
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage >= totalPages}
                  className="btn-soft px-3 py-1.5 text-xs disabled:cursor-not-allowed disabled:opacity-40"
                >
                  {c("next")}
                </button>
              </div>
            )}
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

                {/* Assignee control */}
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-slate-600">
                    {a("assignee")}
                  </label>
                  <select
                    value={selected.assigned_to ?? ""}
                    onChange={(e) => changeAssignee(selected.id, e.target.value)}
                    disabled={updatingAssignee}
                    className="input"
                  >
                    <option value="">{a("unassigned")}</option>
                    {assignees.map((agent) => (
                      <option key={agent.id} value={agent.id}>
                        {agent.fullName || agent.id}
                      </option>
                    ))}
                  </select>
                </div>

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
