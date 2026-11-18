import { getTranslations } from "next-intl/server";
import { requireUser } from "@/lib/auth";
import NewTicketForm from "./NewTicketForm";

export default async function NewTicketPage() {
  const t = await getTranslations("ticket");
  const user = await requireUser();

  return (
    <main className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="mx-auto max-w-2xl px-4 py-12">
        <h1 className="text-2xl font-bold mb-2">{t("newTicketTitle")}</h1>
        <p className="text-sm text-gray-500 mb-6">
          {user.companyName ?? user.email}
        </p>
        <NewTicketForm />
      </div>
    </main>
  );
}
