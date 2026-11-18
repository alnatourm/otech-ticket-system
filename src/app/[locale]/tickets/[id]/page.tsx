import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import TicketDetail from "./TicketDetail";

export default async function TicketDetailPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { id } = await params;
  const t = await getTranslations("ticket");
  return (
    <main className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="mx-auto max-w-3xl px-4 py-12">
        <TicketDetail id={id} />
      </div>
    </main>
  );
}