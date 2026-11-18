import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import TicketDetail from "./TicketDetail";

export default async function TicketDetailPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { id } = await params;
  const user = await requireUser();
  const isAgent = user.role === "agent" || user.role === "admin";
  const supabase = await createClient();

  const { data: ticket } = await supabase
    .from("tickets")
    .select("*")
    .eq("id", id)
    .single();
  if (!ticket) notFound();

  let repliesQuery = supabase
    .from("ticket_replies")
    .select("*")
    .eq("ticket_id", id);
  if (!isAgent) repliesQuery = repliesQuery.eq("is_internal", false);
  const { data: replies } = await repliesQuery.order("created_at", {
    ascending: true,
  });

  return (
    <main className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="mx-auto max-w-3xl px-4 py-12">
        <TicketDetail
          ticket={ticket}
          replies={replies ?? []}
          authorName={user.fullName}
          authorEmail={user.email}
          isAgent={isAgent}
        />
      </div>
    </main>
  );
}
