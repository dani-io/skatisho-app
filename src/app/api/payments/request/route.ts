import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { requestPayment } from "@/lib/zarinpal";

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { type } = body;
  const origin = req.headers.get("origin") || "http://localhost:3000";

  let amount = 0;
  let description = "";
  let metaExtra: any = {};

  if (type === "subscription") {
    const { planTitle, planPrice, planDuration } = body;
    if (!planPrice || !planTitle) {
      return NextResponse.json({ error: "plan info required" }, { status: 400 });
    }
    amount = planPrice;
    description = `خرید اشتراک ${planTitle} - اسکیتی‌شو`;
    metaExtra = { planTitle, planDuration };
  } else if (type === "order") {
    const { cartItems } = body;
    if (!cartItems?.length) {
      return NextResponse.json({ error: "cart is empty" }, { status: 400 });
    }
    const productIds = cartItems.map((i: any) => i.productId);
    const products = await db.product.findMany({ where: { id: { in: productIds } } });
    const productMap = new Map(products.map((p: any) => [p.id, p]));

    for (const item of cartItems) {
      const product = productMap.get(item.productId);
      if (!product) {
        return NextResponse.json({ error: "product not found" }, { status: 404 });
      }
      amount += (product as any).price * item.quantity;
    }
    description = `خرید ${cartItems.length} محصول - اسکیتی‌شو`;
    metaExtra = { cartItems };
  } else {
    return NextResponse.json({ error: "invalid type" }, { status: 400 });
  }

  const payment = await db.payment.create({
    data: {
      userId: session.userId,
      amount,
      description,
      status: "PENDING",
    },
  });

  const metadata = JSON.stringify({ type, paymentId: payment.id, ...metaExtra });

  try {
    const user = await db.user.findUnique({ where: { id: session.userId }, select: { phone: true } });
    const { authority, payUrl } = await requestPayment({
      amount,
      description,
      callbackUrl: `${origin}/api/payments/verify?meta=${encodeURIComponent(metadata)}`,
      phone: user?.phone,
    });

    await db.payment.update({
      where: { id: payment.id },
      data: { authority },
    });

    return NextResponse.json({ payUrl, paymentId: payment.id });
  } catch (err: any) {
    await db.payment.update({
      where: { id: payment.id },
      data: { status: "FAILED" },
    });
    return NextResponse.json({ error: err.message, stack: err.stack }, { status: 500 });
  }
}
