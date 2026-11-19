import { Link } from "@/i18n/navigation";
import { getTranslations } from "next-intl/server";
import { Ticket, TicketPlus } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

type TicketRow = {
  id: string;
  title: string;
  status: string;
  priority: string;
  category: string;
  created_at: string;
};

const PILL: Record<string, string> = {
  open: "pill-open",
  in_progress: "pill-progress",
  waiting: "pill-waiting",
  resolved: "pill-resolved",
  closed: "pill-closed",
};

export default async function MyTicketsPage() {
  const t = await getTranslations("ticket");
  const d = await getTranslations("dashboard");
  const n = await getTranslations("nav");
  const user = await requireUser();

  const supabase = await createClient();
  const { data } = await supabase
    .from("tickets")
    .select("id,title,status,priority,category,created_at")
    .order("created_at", { ascending: false });

  const tickets = (data ?? []) as TicketRow[];

  return (
    <main className="space-y-5 pb-8">
      <section className="glass flex flex-wrap items-center justify-between gap-3 px-5 py-4">
        <div>
          <h1 className="section-title flex items-center gap-2 text-lg">
            <Ticket size={19} className="text-indigo-500" /> {n("myTickets")}
          </h1>
          <p className="muted mt-1 text-xs">
            {user.companyName ? `${d("companyLabel")}: ${user.companyName}` : user.email}
          </p>
        </div>
        <Link href="/tickets/new" className="btn-primary">
          <TicketPlus size={16} /> {n("newTicket")}
        </Link>
      </section>

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
          <ul className="space-y-2.5">
            {tickets.map((tk) => (
              <li key={tk.id}>
                <Link
                  href={`/tickets/${tk.id}`}
                  className="glass-soft flex items-center justify-between gap-3 p-4 transition hover:bg-white/90"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-slate-800">{tk.title}</p>
                    <p className="muted mt-1 text-xs">
                      {t(`categoryOptions.${tk.category}`)} ·{" "}
                      {t(`priorityOptions.${tk.priority}`)} ·{" "}
                      {new Date(tk.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <span className={`pill ${PILL[tk.status] ?? ""}`}>
                    {t(`statusOptions.${tk.status}`)}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
