import { getTranslations } from "next-intl/server";
import NewTicketForm from "./NewTicketForm";

export default async function NewTicketPage() {
  const t = await getTranslations("ticket");
  return (
    <main className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="mx-auto max-w-2xl px-4 py-12">
        <h1 className="text-2xl font-bold mb-6">{t("title")}</h1>
        <NewTicketForm />
      </div>
    </main>
  );
}