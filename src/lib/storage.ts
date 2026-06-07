const S3_BASE = process.env.NEXT_PUBLIC_S3_URL || "http://192.168.10.240:9000/sktsho";

export function fileUrl(key: string | null | undefined): string {
  if (!key) return "";
  if (key.startsWith("http")) return key; // legacy full URLs
  return `${S3_BASE}/${key}`;
}
