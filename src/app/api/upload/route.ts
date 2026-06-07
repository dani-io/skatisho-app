import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { uploadFile } from "@/lib/s3";

const ADMIN_PHONES = ["09123456789", "09179498400"];

const MAX_IMAGE_SIZE = 10 * 1024 * 1024; // 10MB
const MAX_VIDEO_SIZE = 500 * 1024 * 1024; // 500MB

const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];
const ALLOWED_VIDEO_TYPES = ["video/mp4", "video/webm", "video/quicktime"];

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session || !ADMIN_PHONES.includes(session.phone)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const formData = await req.formData();
  const file = formData.get("file") as File | null;
  const folder = (formData.get("folder") as string) || "misc";

  if (!file) {
    return NextResponse.json({ error: "no file" }, { status: 400 });
  }

  const isImage = ALLOWED_IMAGE_TYPES.includes(file.type);
  const isVideo = ALLOWED_VIDEO_TYPES.includes(file.type);

  if (!isImage && !isVideo) {
    return NextResponse.json({ error: "فرمت فایل مجاز نیست" }, { status: 400 });
  }

  if (isImage && file.size > MAX_IMAGE_SIZE) {
    return NextResponse.json({ error: "حداکثر حجم تصویر ۱۰ مگابایت" }, { status: 400 });
  }

  if (isVideo && file.size > MAX_VIDEO_SIZE) {
    return NextResponse.json({ error: "حداکثر حجم ویدیو ۵۰۰ مگابایت" }, { status: 400 });
  }

  const ext = file.name.split(".").pop() || "bin";
  const timestamp = Date.now();
  const key = `${folder}/${timestamp}-${Math.random().toString(36).slice(2, 8)}.${ext}`;

  const buffer = Buffer.from(await file.arrayBuffer());
  const url = await uploadFile(buffer, key, file.type);

  return NextResponse.json({ url, key });
}
