import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";

// DELETE
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ addressId: string }> }
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const { addressId } = await params;

  await db.address.deleteMany({
    where: { id: addressId, userId: session.userId },
  });

  return NextResponse.json({ ok: true });
}

// PUT
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ addressId: string }> }
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const { addressId } = await params;
  const { title, province, city, address, postalCode, phone, isDefault } = await req.json();

  if (isDefault) {
    await db.address.updateMany({
      where: { userId: session.userId },
      data: { isDefault: false },
    });
  }

  const updated = await db.address.update({
    where: { id: addressId },
    data: {
      title: title?.trim(),
      province: province?.trim(),
      city: city?.trim(),
      address: address?.trim(),
      postalCode: postalCode?.trim() || null,
      phone: phone?.trim() || null,
      isDefault: isDefault ?? undefined,
    },
  });

  return NextResponse.json({ address: updated });
}
