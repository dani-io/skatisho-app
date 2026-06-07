const S3_BASE = process.env.NEXT_PUBLIC_S3_URL || "http://192.168.10.240:9000/sktsho";

export function fileUrl(key: string | null | undefined): string {
  if (!key) return "";
  if (key.startsWith("http")) return key;
  return `${S3_BASE}/${key}`;
}

// Server-side version using S3_ENDPOINT
export function serverFileUrl(key: string | null | undefined): string {
  if (!key) return "";
  if (key.startsWith("http")) return key;
  const base = process.env.S3_PUBLIC_URL || `${process.env.S3_ENDPOINT || "http://192.168.10.240:9000"}/${process.env.S3_BUCKET || "sktsho"}`;
  return `${base}/${key}`;
}
