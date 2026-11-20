import { Link } from "@/i18n/navigation";
import { getTranslations } from "next-intl/server";
import { Ticket, TicketPlus } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import MyTicketsList, { type TicketRow } from "./MyTicketsList";

export default async function MyTicketsPage() {
  const d = await getTranslations("dashboard");
  const n = await getTranslations("nav");
  const user = await requireUser();

  const supabase = await createClient();
  const { data } = await supabase
    .from("tickets")
    .select("id,title,status,priority,category,email,created_at")
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

      <MyTicketsList tickets={tickets} />
    </main>
  );
}
