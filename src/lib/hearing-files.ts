/**
 * Case hearing `file` from API: JSON string in DB, may be legacy string URLs or
 * objects { url, original_name, mime }.
 */

export type HearingFileKind = "image" | "video" | "pdf" | "archive" | "document" | "generic";

export type NormalizedHearingAttachment = {
  url: string;
  label: string;
  kind: HearingFileKind;
  mime?: string;
};

function fileNameFromUrl(url: string): string {
  try {
    const pathname = new URL(url).pathname;
    const last = pathname.split("/").pop() || url;
    return decodeURIComponent(last.split("?")[0] || last);
  } catch {
    const segment = url.split("/").pop() || url;
    return segment.split("?")[0] || url;
  }
}

function classifyKind(label: string, mime?: string): HearingFileKind {
  const m = (mime ?? "").toLowerCase();
  const ext = (label.includes(".") ? label.split(".").pop() : "")?.toLowerCase() ?? "";

  if (m.startsWith("video/")) {
    return "video";
  }
  if (["mp4", "webm", "mov", "avi", "mkv", "m4v"].includes(ext)) {
    return "video";
  }

  if (m.startsWith("image/")) {
    return "image";
  }
  if (["jpg", "jpeg", "png", "gif", "webp", "bmp", "svg", "ico"].includes(ext)) {
    return "image";
  }

  if (m === "application/pdf" || ext === "pdf") {
    return "pdf";
  }

  if (
    m.includes("zip") ||
    m.includes("compressed") ||
    ["zip", "rar", "7z", "tar", "gz", "tgz"].includes(ext)
  ) {
    return "archive";
  }

  if (
    ["doc", "docx", "xls", "xlsx", "ppt", "pptx", "txt", "csv", "rtf", "odt", "ods"].includes(
      ext
    ) ||
    m.includes("wordprocessingml") ||
    m.includes("spreadsheetml") ||
    m.includes("msword")
  ) {
    return "document";
  }

  return "generic";
}

/**
 * Normalize API `file` field into a list of attachments with display labels and coarse type.
 */
export function normalizeHearingAttachments(raw: unknown): NormalizedHearingAttachment[] {
  if (raw == null || raw === "") {
    return [];
  }

  let items: unknown[] = [];

  if (typeof raw === "string") {
    try {
      const parsed = JSON.parse(raw) as unknown;
      if (Array.isArray(parsed)) {
        items = parsed;
      } else if (typeof parsed === "string") {
        items = [parsed];
      } else {
        items = [raw];
      }
    } catch {
      items = [raw];
    }
  } else if (Array.isArray(raw)) {
    items = raw;
  } else {
    return [];
  }

  const out: NormalizedHearingAttachment[] = [];

  for (const item of items) {
    if (typeof item === "string" && item !== "") {
      const url = item;
      const label = fileNameFromUrl(url);
      out.push({ url, label, kind: classifyKind(label, undefined) });
      continue;
    }

    if (item && typeof item === "object" && "url" in item) {
      const o = item as { url?: string; original_name?: string; mime?: string };
      if (!o.url) {
        continue;
      }
      const label = o.original_name?.trim() || fileNameFromUrl(o.url);
      out.push({
        url: o.url,
        label,
        kind: classifyKind(label, o.mime),
        mime: o.mime,
      });
    }
  }

  return out;
}
