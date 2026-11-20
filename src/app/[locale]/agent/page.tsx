import { requireAgent } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import AgentDashboard, { type AgentTicket, type Assignee } from "./AgentDashboard";

export type { AgentTicket, Assignee };

export default async function AgentPage() {
  const user = await requireAgent();
  const supabase = await createClient();
  const [{ data: ticketsData }, { data: profilesData }] = await Promise.all([
    supabase
      .from("tickets")
      .select("id,title,email,name,status,priority,category,created_at,assigned_to,companies(name)")
      .order("created_at", { ascending: false }),
    supabase
      .from("profiles")
      .select("id,full_name,role")
      .in("role", ["agent", "admin"])
      .order("full_name", { ascending: true }),
  ]);

  const assignees: Assignee[] = (profilesData ?? []).map((p) => ({
    id: p.id,
    fullName: p.full_name,
    role: p.role,
  }));

  return (
    <AgentDashboard
      tickets={(ticketsData ?? []) as unknown as AgentTicket[]}
      assignees={assignees}
      currentUserId={user.id}
    />
  );
}
