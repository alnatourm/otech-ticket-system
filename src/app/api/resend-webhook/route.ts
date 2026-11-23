import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { Resend } from "resend";

// Initialize Supabase client
function getSupabase() {
  const url =
    process.env.NEXT_PUBLIC_SUPABASE_URL ||
    "https://rsmevpbbilqtjoccayla.supabase.co";
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!key) {
    throw new Error(
      "Missing Supabase API key (NEXT_PUBLIC_SUPABASE_ANON_KEY or SUPABASE_SERVICE_ROLE_KEY)"
    );
  }

  return createClient(url, key, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

// Helper to parse "Name <email@domain.com>" or "email@domain.com"
function parseEmailSender(sender: string): { name: string | null; email: string } {
  if (!sender) return { name: null, email: "unknown@sender.com" };
  const match = sender.match(/^(.*?)\s*<([^>]+)>/);
  if (match) {
    const rawName = match[1].replace(/^["']|["']$/g, "").trim();
    const email = match[2].trim();
    return { name: rawName || null, email };
  }
  return { name: null, email: sender.trim() };
}

// Extract UUID ticket ID from subject if present (e.g. "Re: Ticket #d1f8... - Subject")
function extractTicketId(subject: string): string | null {
  if (!subject) return null;
  const match = subject.match(
    /(?:ticket\s*#?|#)\s*([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})/i
  );
  return match ? match[1] : null;
}

export async function GET() {
  return NextResponse.json({
    status: "ok",
    service: "otech-tickets-resend-webhook",
    endpoint: "/api/resend-webhook",
    domain: "o-tech.space",
    resendConfigured: !!process.env.RESEND_API_KEY,
    timestamp: new Date().toISOString(),
  });
}

export async function POST(req: NextRequest) {
  try {
    const payload = await req.json();

    // Support both single event object and array of events
    const events = Array.isArray(payload) ? payload : [payload];
    const results = [];

    const supabase = getSupabase();
    const resendApiKey = process.env.RESEND_API_KEY;
    const resendFrom = process.env.RESEND_FROM || "support@o-tech.space";

    for (const event of events) {
      // Event type validation - Resend sends 'email.received'
      if (event.type && event.type !== "email.received") {
        results.push({
          skipped: true,
          type: event.type,
          reason: "Unhandled event type (expected email.received)",
        });
        continue;
      }

      const data = event.data || event;
      const rawFrom = data.from || event.from || "";
      const { name, email } = parseEmailSender(rawFrom);
      const subject = (data.subject || event.subject || "Support Request via Email").trim();
      const emailId = data.email_id || data.id;

      let textBody = data.text || event.text || "";
      let htmlBody = data.html || event.html || "";

      // If body is missing but we have an email_id and Resend API key, fetch via Resend Receiving API
      if (!textBody && !htmlBody && emailId && resendApiKey) {
        try {
          const res = await fetch(
            `https://api.resend.com/emails/receiving/${emailId}`,
            {
              headers: {
                Authorization: `Bearer ${resendApiKey}`,
              },
            }
          );
          if (res.ok) {
            const fetched = await res.json();
            textBody = fetched.text || "";
            htmlBody = fetched.html || "";
          } else {
            console.warn(
              `Resend Receiving API returned status ${res.status} for email ${emailId}`
            );
          }
        } catch (fetchErr) {
          console.error("Failed to fetch email details from Resend API:", fetchErr);
        }
      }

      // Prepare ticket description
      let description = textBody.trim();
      if (!description && htmlBody) {
        // Strip HTML tags for clean plain description
        description = htmlBody
          .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
          .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
          .replace(/<[^>]+>/g, " ")
          .replace(/\s+/g, " ")
          .trim();
      }
      if (!description) {
        description =
          subject || `Incoming email to support@o-tech.space from ${email}`;
      }

      // Check if this is a reply to an existing ticket
      const existingTicketId = extractTicketId(subject);
      if (existingTicketId) {
        const { data: existingTicket } = await supabase
          .from("tickets")
          .select("id")
          .eq("id", existingTicketId)
          .single();

        if (existingTicket) {
          const ticketId = existingTicket.id;
          const { error: replyError } = await supabase
            .from("ticket_replies")
            .insert({
              ticket_id: ticketId,
              author_email: email,
              author_name: name,
              is_agent: false,
              is_internal: false,
              body: description,
            });

          if (replyError) {
            console.error("Error inserting ticket reply:", replyError);
            throw replyError;
          }

          results.push({
            success: true,
            action: "reply_added",
            ticket_id: ticketId,
          });
          continue;
        }
      }

      // Insert new ticket into Supabase tickets table
      let createdTicketId: string | null = null;

      const { data: newTicket, error: insertError } = await supabase
        .from("tickets")
        .insert({
          title: subject,
          description: description,
          email: email,
          name: name,
          category: "general",
          priority: "medium",
          status: "open",
        })
        .select("id")
        .single();

      if (insertError) {
        console.warn(
          "Direct ticket insert returned error, falling back to create_inbound_email_ticket RPC:",
          insertError.message
        );

        const { data: rpcTicketId, error: rpcError } = await supabase.rpc(
          "create_inbound_email_ticket",
          {
            p_title: subject,
            p_description: description,
            p_email: email,
            p_name: name,
            p_category: "general",
            p_priority: "medium",
          }
        );

        if (rpcError) {
          console.error("RPC ticket creation also failed:", rpcError);
          throw insertError;
        }

        createdTicketId = rpcTicketId;
      } else {
        createdTicketId = newTicket.id;
      }

      // Optionally send automated confirmation email if Resend API key is configured
      if (resendApiKey && email) {
        try {
          const resend = new Resend(resendApiKey);
          await resend.emails.send({
            from: resendFrom,
            to: email,
            subject: `[Ticket #${createdTicketId}] ${subject}`,
            text: `Hello ${name || "Customer"},\n\nThank you for contacting OTECH Support. We have received your message and created a support ticket.\n\nTicket Reference: ${createdTicketId}\nSubject: ${subject}\n\nOur engineering team will review your inquiry and follow up shortly.\n\nBest regards,\nOTECH Support Hub\nsupport@o-tech.space`,
          });
        } catch (emailErr) {
          console.warn("Could not send automated ticket confirmation email:", emailErr);
        }
      }

      results.push({
        success: true,
        action: "ticket_created",
        ticket_id: createdTicketId,
      });
    }

    return NextResponse.json({
      success: true,
      processed: results.length,
      results,
    });
  } catch (err: any) {
    console.error("[resend-webhook] Error processing webhook:", err);
    return NextResponse.json(
      {
        success: false,
        error:
          err.message || "Internal server error processing Resend webhook",
      },
      { status: 500 }
    );
  }
}
