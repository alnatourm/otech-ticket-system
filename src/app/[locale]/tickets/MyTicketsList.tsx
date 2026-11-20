"use client";

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { Search, Ticket, X } from "lucide-react";
import { Link } from "@/i18n/navigation";

export type TicketRow = {
  id: string;
  title: string;
  status: string;
  priority: string;
  category: string;
  email: string;
  created_at: string;
};

const PILL: Record<string, string> = {
  open: "pill-open",
  in_progress: "pill-progress",
  waiting: "pill-waiting",
  resolved: "pill-resolved",
  closed: "pill-closed",
};

const STATUSES = ["open", "in_progress", "waiting", "resolved", "closed"] as const;
const PAGE_SIZE = 20;

export default function MyTicketsList({ tickets }: { tickets: TicketRow[] }) {
  const t = useTranslations("ticket");
  const c = useTranslations("common");
  const d = useTranslations("dashboard");

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [page, setPage] = useState(1);

  // Client-side filtering on the already-fetched list is acceptable for 0.2; server-side search is required past ~500 tickets.
  const filtered = useMemo(() => {
    return tickets.filter((tk) => {
      if (statusFilter !== "all" && tk.status !== statusFilter) return false;

      if (search.trim()) {
        const q = search.trim().toLowerCase();
        const matchTitle = tk.title?.toLowerCase().includes(q);
        const matchEmail = tk.email?.toLowerCase().includes(q);
        if (!matchTitle && !matchEmail) return false;
      }
      return true;
    });
  }, [tickets, statusFilter, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const paginated = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  return (
    <section className="glass p-5">
      {tickets.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-indigo-200 bg-white/50 px-5 py-12 text-center">
          <Ticket size={30} className="mx-auto mb-3 text-indigo-400" />
          <p className="muted mb-4">{t("noTickets")}</p>
          <Link href="/tickets/new" className="btn-primary">
            {d("submitFirst")}
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
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
              placeholder={d("searchPlaceholder")}
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
              {t("allStatus")}
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

          {/* List or Empty State */}
          {filtered.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-200 bg-white/50 px-4 py-10 text-center">
              <p className="muted text-sm">{t("noMatchingTickets")}</p>
            </div>
          ) : (
            <ul className="space-y-2.5">
              {paginated.map((tk) => (
                <li key={tk.id}>
                  <Link
                    href={`/tickets/${tk.id}`}
                    className="glass-soft flex items-center justify-between gap-3 p-4 transition hover:bg-white/90"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-slate-800">{tk.title}</p>
                      <p className="muted mt-1 text-xs">
                        {t(`categoryOptions.${tk.category}`)} ·{" "}
                        {t(`priorityOptions.${tk.priority}`)} ·{" "}
                        {new Date(tk.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <span className={`pill shrink-0 ${PILL[tk.status] ?? ""}`}>
                      {t(`statusOptions.${tk.status}`)}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
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
      )}
    </section>
  );
}
