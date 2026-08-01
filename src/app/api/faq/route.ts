import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { ADMIN_PHONES } from "@/lib/access";


// GET: public
export async function GET() {
  const categories = await db.faqCategory.findMany({
    orderBy: { order: "asc" },
    include: { items: { orderBy: { order: "asc" } } },
  });
  return NextResponse.json({ categories });
}

// POST: admin - create category or item
export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session || !ADMIN_PHONES.includes(session.phone)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const body = await req.json();

  if (body.type === "category") {
    const cat = await db.faqCategory.create({
      data: { title: body.title, order: body.order || 0 },
    });
    return NextResponse.json({ category: cat }, { status: 201 });
  }

  if (body.type === "item") {
    const item = await db.faqItem.create({
      data: {
        categoryId: body.categoryId,
        question: body.question,
        answer: body.answer,
        order: body.order || 0,
      },
    });
    return NextResponse.json({ item }, { status: 201 });
  }

  return NextResponse.json({ error: "invalid type" }, { status: 400 });
}

// PUT: admin - update
export async function PUT(req: NextRequest) {
  const session = await getSession();
  if (!session || !ADMIN_PHONES.includes(session.phone)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const body = await req.json();

  if (body.type === "category") {
    await db.faqCategory.update({
      where: { id: body.id },
      data: { title: body.title, order: body.order },
    });
  } else {
    await db.faqItem.update({
      where: { id: body.id },
      data: { question: body.question, answer: body.answer, order: body.order },
    });
  }
  return NextResponse.json({ success: true });
}

// DELETE: admin
export async function DELETE(req: NextRequest) {
  const session = await getSession();
  if (!session || !ADMIN_PHONES.includes(session.phone)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const { id, type } = await req.json();

  if (type === "category") {
    await db.faqCategory.delete({ where: { id } });
  } else {
    await db.faqItem.delete({ where: { id } });
  }
  return NextResponse.json({ success: true });
}
