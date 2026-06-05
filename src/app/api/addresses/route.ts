import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";

// GET: list addresses
export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const addresses = await db.address.findMany({
    where: { userId: session.userId },
    orderBy: [{ isDefault: "desc" }, { createdAt: "desc" }],
  });

  return NextResponse.json({ addresses });
}

// POST: create address
export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const { title, province, city, address, postalCode, phone, isDefault } = await req.json();

  if (!title?.trim() || !province?.trim() || !city?.trim() || !address?.trim()) {
    return NextResponse.json({ error: "required fields missing" }, { status: 400 });
  }

  // If setting as default, unset others
  if (isDefault) {
    await db.address.updateMany({
      where: { userId: session.userId },
      data: { isDefault: false },
    });
  }

  const newAddress = await db.address.create({
    data: {
      userId: session.userId,
      title: title.trim(),
      province: province.trim(),
      city: city.trim(),
      address: address.trim(),
      postalCode: postalCode?.trim() || null,
      phone: phone?.trim() || null,
      isDefault: isDefault || false,
    },
  });

  return NextResponse.json({ address: newAddress }, { status: 201 });
}
