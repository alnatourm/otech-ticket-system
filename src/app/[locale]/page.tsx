import { Link } from "@/i18n/navigation";
import { getTranslations } from "next-intl/server";

export default async function HomePage() {
  const t = await getTranslations("home");

  return (
    <main className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <section className="mx-auto max-w-5xl px-4 py-16 text-center">
        <h1 className="text-4xl font-bold mb-3">{t("title")}</h1>
        <p className="text-gray-600 dark:text-gray-300 mb-10">{t("subtitle")}</p>

        <div className="grid gap-6 sm:grid-cols-3">
          <Link
            href="/tickets/new"
            className="rounded-xl border bg-white p-6 shadow-sm hover:shadow-md transition text-start"
          >
            <h2 className="text-lg font-semibold mb-1">{t("submitTicket")}</h2>
            <p className="text-sm text-gray-500">{t("submitTicketDesc")}</p>
          </Link>
          <Link
            href="/tickets"
            className="rounded-xl border bg-white p-6 shadow-sm hover:shadow-md transition text-start"
          >
            <h2 className="text-lg font-semibold mb-1">{t("trackTicket")}</h2>
            <p className="text-sm text-gray-500">{t("trackTicketDesc")}</p>
          </Link>
          <Link
            href="/kb"
            className="rounded-xl border bg-white p-6 shadow-sm hover:shadow-md transition text-start"
          >
            <h2 className="text-lg font-semibold mb-1">{t("knowledgeBase")}</h2>
            <p className="text-sm text-gray-500">{t("knowledgeBaseDesc")}</p>
          </Link>
        </div>
      </section>
    </main>
  );
}