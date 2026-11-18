"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { createClient } from "@/lib/supabase/client";

type Ticket = {
  id: string;
  title: string;
  status: string;
  priority: string;
  category: string;
  created_at: string;
};

export default function MyTicketsPage() {
  const t = useTranslations("ticket");
  const c = useTranslations("common");
  const n = useTranslations("nav");
  const [email, setEmail] = useState("");
  const [tickets, setTickets] = useState<Ticket[] | null>(null);
  const [loading, setLoading] = useState(false);

  async function lookup(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const supabase = createClient();
    const { data } = await supabase
      .from("tickets")
      .select("id,title,status,priority,category,created_at")
      .eq("email", email)
      .order("created_at", { ascending: false });
    setTickets(data ?? []);
    setLoading(false);
  }

  return (
    <main className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="mx-auto max-w-3xl px-4 py-12">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">{n("myTickets")}</h1>
          <Link href="/tickets/new" className="rounded-md bg-blue-600 px-4 py-2 text-white text-sm">
            {n("newTicket")}
          </Link>
        </div>

        <form onSubmit={lookup} className="flex gap-2 mb-6">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder={t("email")}
            required
            className="flex-1 rounded-md border px-3 py-2"
          />
          <button
            type="submit"
            disabled={loading}
            className="rounded-md bg-blue-600 px-4 py-2 text-white text-sm disabled:opacity-50"
          >
            {loading ? c("loading") : "Look up"}
          </button>
        </form>

        {tickets === null ? null : tickets.length === 0 ? (
          <p className="text-gray-500">{t("noTickets")}</p>
        ) : (
          <ul className="space-y-3">
            {tickets.map((tk) => (
              <li key={tk.id}>
                <Link
                  href={`/tickets/${tk.id}`}
                  className="block rounded-lg border bg-white p-4 hover:shadow-sm"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{tk.title}</span>
                    <span className="text-xs rounded-full bg-gray-100 px-2 py-1">
                      {t(`statusOptions.${tk.status}`)}
                    </span>
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    {tk.category} · {tk.priority} ·{" "}
                    {new Date(tk.created_at).toLocaleDateString()}
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </main>
  );
}