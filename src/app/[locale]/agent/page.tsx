import { requireAgent } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import AgentDashboard from "./AgentDashboard";

export type AgentTicket = {
  id: string;
  title: string;
  email: string;
  name: string | null;
  status: string;
  priority: string;
  category: string;
  created_at: string;
  companies: { name: string } | null;
};

export default async function AgentPage() {
  await requireAgent();
  const supabase = await createClient();
  const { data } = await supabase
    .from("tickets")
    .select("id,title,email,name,status,priority,category,created_at,companies(name)")
    .order("created_at", { ascending: false });

  return <AgentDashboard tickets={(data ?? []) as unknown as AgentTicket[]} />;
}
