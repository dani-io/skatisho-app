import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";

const ADMIN_PHONES = ["09123456789", "09179498400"];

export async function GET() {
  const links = await db.socialLink.findMany({
    where: { isActive: true },
    orderBy: { order: "asc" },
  });
  return NextResponse.json({ links });
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session || !ADMIN_PHONES.includes(session.phone)) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const body = await req.json();
  if (body.id) {
    await db.socialLink.update({ where: { id: body.id }, data: { platform: body.platform, url: body.url, isActive: body.isActive ?? true } });
  } else {
    await db.socialLink.create({ data: { platform: body.platform, url: body.url } });
  }
  return NextResponse.json({ success: true });
}

export async function DELETE(req: NextRequest) {
  const session = await getSession();
  if (!session || !ADMIN_PHONES.includes(session.phone)) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const { id } = await req.json();
  await db.socialLink.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
