"use client";

import { createClient } from "@/lib/supabase/client";

export type UploadedFile = {
  path: string;
  file_name: string;
  content_type: string;
  size_bytes: number;
};

const MAX_SIZE = 5 * 1024 * 1024;
const ALLOWED = ["image/jpeg", "image/png", "image/webp", "image/gif"];

export async function uploadImages(
  files: File[],
  companyId: string | null,
  isAgent: boolean
): Promise<UploadedFile[]> {
  const allowed = files.filter((f) => ALLOWED.includes(f.type));
  if (allowed.length !== files.length) throw new Error("INVALID_TYPE");
  if (allowed.some((f) => f.size > MAX_SIZE)) throw new Error("FILE_TOO_LARGE");

  const supabase = createClient();
  const folder = isAgent ? "agents" : companyId ?? "unassigned";
  const uploaded: UploadedFile[] = [];

  for (const file of allowed) {
    const ext = file.name.split(".").pop()?.replace(/[^a-zA-Z0-9]/g, "") || "img";
    const path = `${folder}/${crypto.randomUUID()}.${ext}`;
    const { error } = await supabase.storage
      .from("ticket-attachments")
      .upload(path, file, { contentType: file.type, upsert: false });
    if (error) throw error;
    uploaded.push({
      path,
      file_name: file.name,
      content_type: file.type,
      size_bytes: file.size,
    });
  }

  return uploaded;
}
