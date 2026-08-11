import { NextRequest, NextResponse } from "next/server";
import { getLiveSession } from "@/lib/presence";
import { db } from "@/lib/db";
import { requestPayment } from "@/lib/zarinpal";

export async function POST(req: NextRequest) {
  const session = await getLiveSession();
  if (!session) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { type } = body;
    const url = new URL(req.url);
    const origin = process.env.APP_URL || url.origin;

    let amount = 0;
    let description = "";
    let metadata: any = { type };

    if (type === "subscription") {
      const { planTitle, planPrice, planDuration } = body;
      if (!planPrice || !planTitle) {
        return NextResponse.json({ error: "plan info required" }, { status: 400 });
      }
      amount = planPrice;
      description = `خرید اشتراک ${planTitle}`;
      metadata = { type, planTitle, planDuration };
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
      description = `خرید ${cartItems.length} محصول`;
      metadata = { type, cartItems };
    } else {
      return NextResponse.json({ error: "invalid type" }, { status: 400 });
    }
    // Handle wallet payment
    const { useWallet, walletDeduction } = body;
    let walletUsed = 0;

    if (useWallet && walletDeduction > 0) {
      const userWallet = await db.user.findUnique({
        where: { id: session.userId },
        select: { walletBalance: true },
      });
      walletUsed = Math.min(walletDeduction, userWallet?.walletBalance || 0, amount);
      amount -= walletUsed;

      // If wallet covers everything
      if (amount <= 0) {
        await db.$transaction([
          db.user.update({
            where: { id: session.userId },
            data: { walletBalance: { decrement: walletUsed } },
          }),
          db.walletTransaction.create({
            data: {
              userId: session.userId,
              amount: -walletUsed,
              type: "ORDER_PAYMENT",
              description: `پرداخت سفارش از کیف پول`,
            },
          }),
          db.payment.create({
            data: {
              userId: session.userId,
              amount: walletUsed,
              description: JSON.stringify(metadata),
              status: "SUCCESS",
              refId: "WALLET",
            },
          }),
        ]);
        return NextResponse.json({ paidByWallet: true });
      }

      // Partial wallet: deduct now, rest via Zarinpal
      await db.$transaction([
        db.user.update({
          where: { id: session.userId },
          data: { walletBalance: { decrement: walletUsed } },
        }),
        db.walletTransaction.create({
          data: {
            userId: session.userId,
            amount: -walletUsed,
            type: "ORDER_PAYMENT",
            description: `پرداخت بخشی از سفارش از کیف پول`,
          },
        }),
      ]);
      metadata.walletUsed = walletUsed;
    }
    
    const payment = await db.payment.create({
      data: {
        userId: session.userId,
        amount,
        description: JSON.stringify(metadata),
        status: "PENDING",
      },
    });

    const user = await db.user.findUnique({ where: { id: session.userId }, select: { phone: true } });

    const callbackUrl = `${origin}/api/payments/verify?paymentId=${payment.id}`;

    const { authority, payUrl } = await requestPayment({
      amount,
      description,
      callbackUrl,
      // phone is nullable since Google-only admins have none; Zarinpal's
      // optional mobile metadata wants undefined rather than null.
      phone: user?.phone ?? undefined,
    });

    await db.payment.update({
      where: { id: payment.id },
      data: { authority },
    });

    return NextResponse.json({ payUrl });
  } catch (err: any) {
    return NextResponse.json({ error: err.message, detail: String(err) }, { status: 500 });
  }
}
