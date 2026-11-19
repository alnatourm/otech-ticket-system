import { getTranslations } from "next-intl/server";
import { TicketPlus } from "lucide-react";
import { requireUser } from "@/lib/auth";
import NewTicketForm from "./NewTicketForm";

export default async function NewTicketPage() {
  const t = await getTranslations("ticket");
  const d = await getTranslations("dashboard");
  const user = await requireUser();

  return (
    <main className="space-y-5 pb-8">
      <section className="glass flex flex-wrap items-center justify-between gap-3 px-5 py-4">
        <div>
          <h1 className="section-title flex items-center gap-2 text-lg">
            <TicketPlus size={19} className="text-indigo-500" /> {t("newTicketTitle")}
          </h1>
          <p className="muted mt-1 text-xs">
            {user.companyName ?? user.email}
          </p>
        </div>
        <span className="pill pill-open">{d("companyLabel")}: {user.companyName ?? "—"}</span>
      </section>

      <section className="glass p-5 sm:p-6">
        <NewTicketForm
          companyId={user.companyId}
          isAgent={user.role === "agent" || user.role === "admin"}
        />
      </section>
    </main>
  );
}
