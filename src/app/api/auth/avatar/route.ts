import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { uploadFile } from "@/lib/s3";
import { serverFileUrl } from "@/lib/storage";

const MAX_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED = ["image/jpeg", "image/png", "image/webp"];

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const formData = await req.formData();
  const file = formData.get("file") as File | null;

  if (!file) {
    return NextResponse.json({ error: "فایلی انتخاب نشده" }, { status: 400 });
  }

  if (!ALLOWED.includes(file.type)) {
    return NextResponse.json({ error: "فرمت مجاز: JPG, PNG, WebP" }, { status: 400 });
  }

  if (file.size > MAX_SIZE) {
    return NextResponse.json({ error: "حداکثر حجم ۵ مگابایت" }, { status: 400 });
  }

  const ext = file.name.split(".").pop() || "jpg";
  const key = `avatars/${session.userId}-${Date.now()}.${ext}`;
  const buffer = Buffer.from(await file.arrayBuffer());

  await uploadFile(buffer, key, file.type);

  await db.user.update({
    where: { id: session.userId },
    data: { avatar: key },
  });

  return NextResponse.json({ avatar: serverFileUrl(key) });
}
