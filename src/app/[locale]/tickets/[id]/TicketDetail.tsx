"use client";

import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { ArrowLeft, ImagePlus, Send, X } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { createClient } from "@/lib/supabase/client";
import { uploadImages, type UploadedFile } from "@/lib/uploads";

type Reply = {
  id: string;
  body: string;
  is_agent: boolean;
  is_internal: boolean;
  author_name: string | null;
  created_at: string;
};

type Ticket = {
  id: string;
  title: string;
  description: string;
  status: string;
  priority: string;
  category: string;
  email: string;
  name: string | null;
  created_at: string;
  updated_at: string;
};

type Attachment = {
  id: string;
  reply_id: string | null;
  file_path: string;
  file_name: string;
  content_type: string;
  url: string;
};

type Props = {
  ticket: Ticket;
  replies: Reply[];
  attachments: Attachment[];
  authorName: string | null;
  authorEmail: string;
  userId: string;
  companyId: string | null;
  isAgent: boolean;
};

const PILL: Record<string, string> = {
  open: "pill-open",
  in_progress: "pill-progress",
  waiting: "pill-waiting",
  resolved: "pill-resolved",
  closed: "pill-closed",
};

const STATUSES = ["open", "in_progress", "waiting", "resolved", "closed"] as const;

function AttachmentGrid({ items, label }: { items: Attachment[]; label: string }) {
  if (items.length === 0) return null;
  return (
    <div className="mt-3 flex flex-wrap gap-2">
      {items.map((item) =>
        item.content_type.startsWith("image/") && item.url ? (
          <a key={item.id} href={item.url} target="_blank" rel="noreferrer" title={item.file_name}>
            <Image
              src={item.url}
              alt={`${label}: ${item.file_name}`}
              width={140}
              height={140}
              unoptimized
              className="h-28 w-28 rounded-xl border border-white/80 object-cover shadow-sm"
            />
          </a>
        ) : (
          <a
            key={item.id}
            href={item.url || "#"}
            target="_blank"
            rel="noreferrer"
            className="pill pill-open text-xs"
          >
            {item.file_name}
          </a>
        )
      )}
    </div>
  );
}

export default function TicketDetail({
  ticket,
  replies,
  attachments,
  authorName,
  authorEmail,
  userId,
  companyId,
  isAgent,
}: Props) {
  const t = useTranslations("ticket");
  const c = useTranslations("common");
  const a = useTranslations("agent");
  const router = useRouter();
  const [reply, setReply] = useState("");
  const [internal, setInternal] = useState(false);
  const [sending, setSending] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  async function handleFiles(e: React.ChangeEvent<HTMLInputElement>) {
    const selected = Array.from(e.target.files ?? []);
    if (selected.length === 0) return;
    setUploading(true);
    setUploadError(null);
    try {
      const uploaded = await uploadImages(selected, companyId, isAgent);
      setFiles((prev) => [...prev, ...uploaded]);
    } catch (err) {
      setUploadError(
        err instanceof Error && err.message === "FILE_TOO_LARGE"
          ? t("fileTooLarge")
          : t("uploadError")
      );
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  }

  async function changeStatus(status: string) {
    setUpdatingStatus(true);
    const supabase = createClient();
    const { error } = await supabase
      .from("tickets")
      .update({ status })
      .eq("id", ticket.id);
    if (!error) router.refresh();
    setUpdatingStatus(false);
  }

  async function sendReply(e: React.FormEvent) {
    e.preventDefault();
    if (!reply.trim() && files.length === 0) return;
    setSending(true);
    const supabase = createClient();
    const { data: createdReply, error } = await supabase
      .from("ticket_replies")
      .insert({
        ticket_id: ticket.id,
        body: reply.trim() || t("imageOnlyReply"),
        is_agent: isAgent,
        is_internal: isAgent && internal,
        author_name: authorName,
        author_email: authorEmail,
      })
      .select("id")
      .single();

    if (!error && createdReply && files.length > 0) {
      const { error: filesError } = await supabase
        .from("ticket_attachments")
        .insert(
          files.map((file) => ({
            ticket_id: ticket.id,
            reply_id: createdReply.id,
            file_path: file.path,
            file_name: file.file_name,
            content_type: file.content_type,
            size_bytes: file.size_bytes,
            uploaded_by: userId,
          }))
        );
      if (filesError) setUploadError(filesError.message);
    }

    if (!error) {
      setReply("");
      setFiles([]);
      router.refresh();
    }
    setSending(false);
  }

  return (
    <main className="space-y-5 pb-8">
      <Link href="/tickets" className="inline-flex items-center gap-1 text-sm font-medium text-indigo-600 hover:underline">
        <ArrowLeft size={15} /> {c("back")}
      </Link>

      <section className="glass p-5 sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <h1 className="text-xl font-bold text-slate-800">{ticket.title}</h1>
          {isAgent ? (
            <div className="min-w-40">
              <label className="mb-1 block text-[11px] font-medium text-slate-500">
                {a("changeStatus")}
              </label>
              <select
                value={ticket.status}
                onChange={(e) => changeStatus(e.target.value)}
                disabled={updatingStatus}
                className={`input py-1.5 text-xs ${PILL[ticket.status] ?? ""}`}
              >
                {STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {t(`statusOptions.${s}`)}
                  </option>
                ))}
              </select>
            </div>
          ) : (
            <span className={`pill ${PILL[ticket.status] ?? ""}`}>
              {t(`statusOptions.${ticket.status}`)}
            </span>
          )}
        </div>
        <p className="muted mt-1 text-xs">
          {t("ticketId")}: {ticket.id}
        </p>
        <p className="mt-5 whitespace-pre-wrap leading-relaxed text-slate-700">{ticket.description}</p>
        <div className="mt-5 grid grid-cols-2 gap-3 border-t border-white/80 pt-4 text-xs text-slate-500 sm:grid-cols-4">
          <span>{c("category")}: <b className="text-slate-700">{t(`categoryOptions.${ticket.category}`)}</b></span>
          <span>{c("priority")}: <b className="text-slate-700">{t(`priorityOptions.${ticket.priority}`)}</b></span>
          <span>{c("created")}: <b className="text-slate-700">{new Date(ticket.created_at).toLocaleString()}</b></span>
          <span>{c("updated")}: <b className="text-slate-700">{new Date(ticket.updated_at).toLocaleString()}</b></span>
        </div>
        <AttachmentGrid items={attachments.filter((a) => !a.reply_id)} label={t("attachments")} />
      </section>

      <section className="glass p-5 sm:p-6">
        <h2 className="section-title mb-4">{t("replies")}</h2>
        {replies.length === 0 ? (
          <p className="muted">{t("noReplies")}</p>
        ) : (
          <div className="space-y-2.5">
            {replies.map((r) => (
              <div
                key={r.id}
                className={`glass-soft p-4 ${r.is_internal ? "border-amber-200/70 bg-amber-50/60" : r.is_agent ? "border-indigo-200/70 bg-indigo-50/60" : ""}`}
              >
                <div className="mb-1 text-xs text-slate-500">
                  <b className="text-slate-700">{r.author_name ?? t("customer")}</b> ·{" "}
                  {new Date(r.created_at).toLocaleString()}
                  {r.is_internal && (
                    <span className="pill pill-progress ms-2">· {t("internal")}</span>
                  )}
                </div>
                <p className="whitespace-pre-wrap text-sm text-slate-700">{r.body}</p>
                <AttachmentGrid
                  items={attachments.filter((a) => a.reply_id === r.id)}
                  label={t("attachments")}
                />
              </div>
            ))}
          </div>
        )}

        <form onSubmit={sendReply} className="mt-6 space-y-3">
          <input
            value={reply}
            onChange={(e) => setReply(e.target.value)}
            placeholder={t("replyPlaceholder")}
            className="input"
          />
          {uploadError && <p className="text-xs text-rose-600">{uploadError}</p>}
          <label className="flex items-center gap-2 text-xs font-medium text-slate-600">
            <ImagePlus size={15} className="text-indigo-500" />
            {t("attachImages")}
          </label>
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            multiple
            onChange={handleFiles}
            disabled={uploading}
            className="block w-full text-xs file:me-3 file:rounded-lg file:border-0 file:bg-indigo-50 file:px-3 file:py-2 file:text-indigo-700"
          />
          {uploading && <p className="muted text-xs">{c("loading")}</p>}
          {files.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {files.map((file) => (
                <span
                  key={file.path}
                  className="inline-flex items-center gap-1.5 rounded-full bg-indigo-50 px-2.5 py-1 text-xs text-indigo-700"
                >
                  {file.file_name}
                  <button
                    type="button"
                    onClick={() => setFiles((prev) => prev.filter((f) => f.path !== file.path))}
                    aria-label={c("cancel")}
                  >
                    <X size={12} />
                  </button>
                </span>
              ))}
            </div>
          )}
          {isAgent && (
            <label className="flex items-center gap-2 text-sm text-slate-600">
              <input
                type="checkbox"
                checked={internal}
                onChange={(e) => setInternal(e.target.checked)}
                className="h-4 w-4 accent-indigo-600"
              />
              {t("internalNote")}
            </label>
          )}
          <button type="submit" disabled={sending || uploading} className="btn-primary">
            <Send size={15} /> {sending || uploading ? c("loading") : t("sendReply")}
          </button>
        </form>
      </section>
    </main>
  );
}
