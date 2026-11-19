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

  const { data: attachments } = await supabase
    .from("ticket_attachments")
    .select("id,reply_id,file_path,file_name,content_type,created_at")
    .eq("ticket_id", id);

  let signedUrls: Array<{ path: string; signedUrl: string }> = [];
  if (attachments && attachments.length > 0) {
    const { data } = await supabase.storage
      .from("ticket-attachments")
      .createSignedUrls(
        attachments.map((a) => a.file_path),
        60 * 60
      );
    signedUrls = (data ?? [])
      .filter((item) => item.signedUrl)
      .map((item) => ({ path: item.path ?? "", signedUrl: item.signedUrl! }));
  }

  const ticketAttachments = (attachments ?? []).map((a) => ({
    ...a,
    url: signedUrls.find((s) => s.path === a.file_path)?.signedUrl ?? "",
  }));

  return (
    <TicketDetail
      ticket={ticket}
      replies={replies ?? []}
      attachments={ticketAttachments}
      authorName={user.fullName}
      authorEmail={user.email}
      userId={user.id}
      companyId={user.companyId}
      isAgent={isAgent}
    />
  );
}
