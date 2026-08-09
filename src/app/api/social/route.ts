import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/access";


export async function GET() {
  const links = await db.socialLink.findMany({
    where: { isActive: true },
    orderBy: { order: "asc" },
  });
  return NextResponse.json({ links });
}

export async function POST(req: NextRequest) {
  const denied = await requireAdmin();
  if (denied) return denied;
  const body = await req.json();
  if (body.id) {
    await db.socialLink.update({ where: { id: body.id }, data: { platform: body.platform, url: body.url, isActive: body.isActive ?? true } });
  } else {
    await db.socialLink.create({ data: { platform: body.platform, url: body.url } });
  }
  return NextResponse.json({ success: true });
}

export async function DELETE(req: NextRequest) {
  const denied = await requireAdmin();
  if (denied) return denied;
  const { id } = await req.json();
  await db.socialLink.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
