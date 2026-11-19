"use client";

import { useActionState, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { ImagePlus, X } from "lucide-react";
import { submitTicketAction, type FormState } from "@/app/actions/auth";
import { uploadImages, type UploadedFile } from "@/lib/uploads";

const CATEGORIES = ["technical", "billing", "general", "feature"] as const;
const PRIORITIES = ["low", "medium", "high", "urgent"] as const;

const initialState: FormState = {};

type Props = {
  companyId: string | null;
  isAgent: boolean;
};

export default function NewTicketForm({ companyId, isAgent }: Props) {
  const t = useTranslations("ticket");
  const c = useTranslations("common");
  const formRef = useRef<HTMLFormElement>(null);
  const [attachments, setAttachments] = useState<UploadedFile[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  async function clientAction(prev: FormState, formData: FormData): Promise<FormState> {
    const result = await submitTicketAction(prev, formData);
    if (result.message) {
      formRef.current?.reset();
      setAttachments([]);
    }
    return result;
  }

  const [state, action, pending] = useActionState(clientAction, initialState);
  const fields = state.fieldErrors ?? {};

  async function handleFiles(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    if (files.length === 0) return;
    setUploading(true);
    setUploadError(null);
    try {
      const uploaded = await uploadImages(files, companyId, isAgent);
      setAttachments((prev) => [...prev, ...uploaded]);
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

  return (
    <form ref={formRef} action={action} className="space-y-5">
      {state.error && (
        <p className="rounded-xl border border-rose-200 bg-rose-50/80 p-3 text-sm text-rose-700">
          {state.error}
        </p>
      )}
      {state.message && (
        <p className="rounded-xl border border-emerald-200 bg-emerald-50/80 p-3 text-sm text-emerald-800">
          {state.message}
        </p>
      )}
      {uploadError && <p className="text-xs text-rose-600">{uploadError}</p>}

      <input type="hidden" name="attachments" value={JSON.stringify(attachments)} />

      <div>
        <label htmlFor="title" className="block text-sm font-medium mb-1">
          {t("title")}
        </label>
        <input
          id="title"
          name="title"
          required
          placeholder={t("titlePlaceholder")}
          className="w-full rounded-md border px-3 py-2"
        />
        {fields.title && <p className="mt-1 text-xs text-red-600">{fields.title}</p>}
      </div>

      <div>
        <label htmlFor="description" className="block text-sm font-medium mb-1">
          {t("description")}
        </label>
        <textarea
          id="description"
          name="description"
          required
          rows={5}
          placeholder={t("descriptionPlaceholder")}
          className="w-full rounded-md border px-3 py-2"
        />
        {fields.description && (
          <p className="mt-1 text-xs text-red-600">{fields.description}</p>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="category" className="block text-sm font-medium mb-1">
            {t("category")}
          </label>
          <select id="category" name="category" className="w-full rounded-md border px-3 py-2">
            {CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>
                {t(`categoryOptions.${cat}`)}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="priority" className="block text-sm font-medium mb-1">
            {t("priority")}
          </label>
          <select id="priority" name="priority" className="w-full rounded-md border px-3 py-2">
            {PRIORITIES.map((p) => (
              <option key={p} value={p}>
                {t(`priorityOptions.${p}`)}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label className="mb-2 flex items-center gap-2 text-sm font-medium">
          <ImagePlus size={16} className="text-indigo-500" />
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
        {uploading && <p className="muted mt-1 text-xs">{c("loading")}</p>}
        {attachments.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-2">
            {attachments.map((file) => (
              <span
                key={file.path}
                className="inline-flex items-center gap-1.5 rounded-full bg-indigo-50 px-2.5 py-1 text-xs text-indigo-700"
              >
                {file.file_name}
                <button
                  type="button"
                  onClick={() =>
                    setAttachments((prev) => prev.filter((a) => a.path !== file.path))
                  }
                  aria-label={c("cancel")}
                >
                  <X size={12} />
                </button>
              </span>
            ))}
          </div>
        )}
      </div>

      <button
        type="submit"
        disabled={pending || uploading}
        className="rounded-md bg-blue-600 px-5 py-2 text-white font-medium hover:bg-blue-700 disabled:opacity-50"
      >
        {pending || uploading ? c("loading") : c("submit")}
      </button>
    </form>
  );
}
