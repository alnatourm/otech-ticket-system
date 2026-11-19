import Image from "next/image";
import { Link } from "@/i18n/navigation";
import { getTranslations } from "next-intl/server";
import {
  ArrowUpRight,
  BookOpen,
  CircleCheck,
  Clock3,
  LifeBuoy,
  ShieldCheck,
  Ticket,
  TicketPlus,
} from "lucide-react";
import { getCurrentUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

type Row = {
  id: string;
  title: string;
  status: string;
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

export default async function HomePage() {
  const t = await getTranslations("home");
  const d = await getTranslations("dashboard");
  const tt = await getTranslations("ticket");
  const a = await getTranslations("auth");
  const n = await getTranslations("nav");
  const user = await getCurrentUser();

  let tickets: Row[] = [];
  if (user) {
    const supabase = await createClient();
    const { data } = await supabase
      .from("tickets")
      .select("id,title,status,category,created_at")
      .order("created_at", { ascending: false });
    tickets = (data ?? []) as Row[];
  }

  const count = (status: string) => tickets.filter((tk) => tk.status === status).length;
  const total = tickets.length;
  const stats = [
    { label: d("totalTickets"), value: total, icon: Ticket, tint: "from-indigo-500 to-violet-600" },
    { label: d("openTickets"), value: count("open"), icon: Clock3, tint: "from-sky-500 to-blue-600" },
    { label: d("inProgress"), value: count("in_progress"), icon: LifeBuoy, tint: "from-amber-500 to-orange-600" },
    { label: d("resolved"), value: count("resolved"), icon: CircleCheck, tint: "from-emerald-500 to-teal-600" },
  ];

  const statuses = ["open", "in_progress", "waiting", "resolved", "closed"];

  return (
    <main className="space-y-5 pb-8">
      {!user ? (
        <>
          <section className="glass relative overflow-hidden px-6 py-12 text-center sm:px-12 sm:py-16">
            <div className="pointer-events-none absolute -start-20 -top-24 h-64 w-64 rounded-full bg-indigo-300/30 blur-3xl" />
            <div className="pointer-events-none absolute -end-16 bottom-0 h-64 w-64 rounded-full bg-sky-300/30 blur-3xl" />
            <Image
              src="/logo.jpg"
              alt="OTECH"
              width={64}
              height={64}
              className="mx-auto mb-5 h-16 w-16 rounded-full object-cover shadow-xl shadow-indigo-300/50"
              priority
            />
            <h1 className="gradient-text text-3xl font-bold tracking-tight sm:text-4xl">
              {d("heroTitle")}
            </h1>
            <p className="muted mx-auto mt-3 max-w-xl">{d("heroSubtitle")}</p>
            <div className="mt-7 flex flex-wrap justify-center gap-3">
              <Link href="/signup" className="btn-primary">
                {d("getStarted")} <ArrowUpRight size={16} />
              </Link>
              <Link href="/login" className="btn-soft">
                {a("signIn")}
              </Link>
            </div>
          </section>

          <section className="grid gap-4 md:grid-cols-3">
            {[
              { href: "/tickets/new", title: t("submitTicket"), desc: t("submitTicketDesc"), icon: TicketPlus },
              { href: "/tickets", title: t("trackTicket"), desc: t("trackTicketDesc"), icon: Ticket },
              { href: "/login", title: t("knowledgeBase"), desc: t("knowledgeBaseDesc"), icon: BookOpen },
            ].map(({ href, title, desc, icon: Icon }) => (
              <Link key={href} href={href} className="glass group p-5 transition hover:-translate-y-0.5">
                <span className="stat-icon mb-4">
                  <Icon size={20} />
                </span>
                <h2 className="section-title flex items-center gap-1">
                  {title} <ArrowUpRight size={14} className="opacity-0 transition group-hover:opacity-100" />
                </h2>
                <p className="muted mt-1">{desc}</p>
              </Link>
            ))}
          </section>
        </>
      ) : (
        <>
          <section className="flex flex-wrap items-end justify-between gap-3 px-1">
            <div>
              <h1 className="gradient-text text-2xl font-bold tracking-tight sm:text-3xl">
                {d("welcome")}, {user.fullName?.split(" ")[0] ?? user.companyName ?? ""}
              </h1>
              <p className="muted mt-1">{d("subtitle")}</p>
            </div>
            {user.companyName && (
              <span className="pill pill-open">
                <ShieldCheck size={13} /> {d("companyLabel")}: {user.companyName}
              </span>
            )}
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

          <section className="grid gap-4 lg:grid-cols-3">
            <div className="glass p-5 lg:col-span-2">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="section-title">{d("recentTickets")}</h2>
                <Link href="/tickets" className="text-xs font-semibold text-indigo-600 hover:underline">
                  {d("viewAll")} →
                </Link>
              </div>

              {tickets.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-indigo-200 bg-white/50 px-5 py-10 text-center">
                  <Ticket size={28} className="mx-auto mb-3 text-indigo-400" />
                  <p className="muted mb-4">{d("noTickets")}</p>
                  <Link href="/tickets/new" className="btn-primary">
                    {d("submitFirst")}
                  </Link>
                </div>
              ) : (
                <ul className="space-y-2.5">
                  {tickets.slice(0, 5).map((tk) => (
                    <li key={tk.id}>
                      <Link
                        href={`/tickets/${tk.id}`}
                        className="glass-soft flex items-center justify-between gap-3 p-3.5 transition hover:bg-white/85"
                      >
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-slate-800">{tk.title}</p>
                          <p className="muted mt-0.5 text-xs">
                            {tt(`categoryOptions.${tk.category}`)} ·{" "}
                            {new Date(tk.created_at).toLocaleDateString()}
                          </p>
                        </div>
                        <span className={`pill ${PILL[tk.status] ?? ""}`}>
                          {tt(`statusOptions.${tk.status}`)}
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="space-y-4">
              <div className="glass p-5">
                <h2 className="section-title mb-4">{d("statusBreakdown")}</h2>
                <div className="space-y-3.5">
                  {statuses.map((s) => {
                    const value = count(s);
                    const percent = total ? Math.round((value / total) * 100) : 0;
                    return (
                      <div key={s}>
                        <div className="mb-1.5 flex items-center justify-between text-xs">
                          <span className="text-slate-600">{tt(`statusOptions.${s}`)}</span>
                          <span className="font-semibold text-slate-700">{value}</span>
                        </div>
                        <div className="progress-track">
                          <div className="progress-fill" style={{ width: `${percent}%` }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="glass p-5">
                <h2 className="section-title mb-3">{d("quickActions")}</h2>
                <div className="space-y-2">
                  <Link href="/tickets/new" className="btn-primary w-full">
                    <TicketPlus size={16} /> {n("newTicket")}
                  </Link>
                  <Link href="/tickets" className="btn-soft w-full">
                    <Ticket size={16} /> {n("myTickets")}
                  </Link>
                </div>
              </div>
            </div>
          </section>
        </>
      )}
    </main>
  );
}
