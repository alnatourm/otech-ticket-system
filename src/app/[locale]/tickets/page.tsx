import { Link } from "@/i18n/navigation";
import { getTranslations } from "next-intl/server";
import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

type Ticket = {
  id: string;
  title: string;
  status: string;
  priority: string;
  category: string;
  created_at: string;
};

export default async function MyTicketsPage() {
  const t = await getTranslations("ticket");
  const n = await getTranslations("nav");
  const c = await getTranslations("common");
  const user = await requireUser();

  const supabase = await createClient();
  const { data } = await supabase
    .from("tickets")
    .select("id,title,status,priority,category,created_at")
    .order("created_at", { ascending: false });

  const tickets = (data ?? []) as Ticket[];

  return (
    <main className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="mx-auto max-w-3xl px-4 py-12">
        <div className="mb-6 flex items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">{n("myTickets")}</h1>
            {user.companyName && (
              <p className="text-sm text-gray-500">{user.companyName}</p>
            )}
          </div>
          <Link
            href="/tickets/new"
            className="rounded-md bg-blue-600 px-4 py-2 text-sm text-white"
          >
            {n("newTicket")}
          </Link>
        </div>

        {tickets.length === 0 ? (
          <p className="text-gray-500">{t("noTickets")}</p>
        ) : (
          <ul className="space-y-3">
            {tickets.map((tk) => (
              <li key={tk.id}>
                <Link
                  href={`/tickets/${tk.id}`}
                  className="block rounded-lg border bg-white p-4 hover:shadow-sm"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-medium">{tk.title}</span>
                    <span className="rounded-full bg-gray-100 px-2 py-1 text-xs">
                      {t(`statusOptions.${tk.status}`)}
                    </span>
                  </div>
                  <div className="mt-1 text-xs text-gray-500">
                    {t(`categoryOptions.${tk.category}`)} ·{" "}
                    {t(`priorityOptions.${tk.priority}`)} ·{" "}
                    {new Date(tk.created_at).toLocaleDateString()}
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
        <p className="mt-6 text-xs text-gray-400">{c("brand")}</p>
      </div>
    </main>
  );
}
