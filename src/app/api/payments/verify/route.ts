import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { verifyPayment } from "@/lib/zarinpal";
import { createNotification } from "@/lib/notifications";

const DURATION_MAP: Record<string, number> = {
  "۷ روز": 7,
  "۱ ماه": 30,
  "۳ ماه": 90,
  "۶ ماه": 180,
  "۱۲ ماه": 365,
};

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const authority = url.searchParams.get("Authority");
  const status = url.searchParams.get("Status");
  const paymentId = url.searchParams.get("paymentId");
  const origin = process.env.APP_URL || url.origin;

  if (!authority || !paymentId) {
    return NextResponse.redirect(`${origin}/payment/result?status=error`);
  }

  const payment = await db.payment.findFirst({
    where: { id: paymentId },
  });

  if (!payment) {
    return NextResponse.redirect(`${origin}/payment/result?status=error`);
  }

  let metadata: any = {};
  try {
    metadata = JSON.parse(payment.description || "{}");
  } catch {}

  if (status !== "OK") {
    await db.payment.update({
      where: { id: payment.id },
      data: { status: "FAILED" },
    });
    return NextResponse.redirect(`${origin}/payment/result?status=cancelled`);
  }

  try {
    const { refId } = await verifyPayment({
      authority,
      amount: payment.amount,
    });

    await db.payment.update({
      where: { id: payment.id },
      data: { status: "SUCCESS", refId: String(refId) },
    });

    // Handle subscription
    if (metadata.type === "subscription") {
      const days = DURATION_MAP[metadata.planDuration] || 30;
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + days);

      let plan = await db.subscriptionPlan.findFirst({
        where: { title: metadata.planTitle },
      });
      if (!plan) {
        plan = await db.subscriptionPlan.create({
          data: {
            title: metadata.planTitle,
            durationDays: days,
            price: payment.amount,
          },
        });
      }

      await db.subscription.upsert({
        where: { userId: payment.userId },
        create: {
          userId: payment.userId,
          planId: plan.id,
          startDate: new Date(),
          endDate,
          isActive: true,
        },
        update: {
          planId: plan.id,
          startDate: new Date(),
          endDate,
          isActive: true,
        },
      });

      await createNotification({
        userId: payment.userId,
        title: "اشتراک فعال شد!",
        message: `اشتراک ${metadata.planTitle} با موفقیت فعال شد`,
        type: "SUBSCRIPTION",
        link: "/subscription",
      });
    }

    // Handle order
    if (metadata.type === "order" && metadata.cartItems?.length > 0) {
      const user = await db.user.findUnique({
        where: { id: payment.userId },
        select: {
          phone: true,
          addresses: { where: { isDefault: true }, take: 1 },
        },
      });

      await db.order.create({
        data: {
          userId: payment.userId,
          totalAmount: payment.amount,
          status: "PAID",
          phone: user?.phone,
          address: user?.addresses[0]?.address || null,
          items: {
            create: metadata.cartItems.map((item: any) => ({
              productId: item.productId,
              quantity: item.quantity,
              price: item.price,
            })),
          },
        },
      });

      await createNotification({
        userId: payment.userId,
        title: "سفارش ثبت شد!",
        message: "سفارش شما با موفقیت ثبت و پرداخت شد",
        type: "ORDER_UPDATE",
        link: "/profile",
      });
    }

    return NextResponse.redirect(`${origin}/payment/result?status=success&refId=${refId}`);
  } catch {
    await db.payment.update({
      where: { id: payment.id },
      data: { status: "FAILED" },
    });
    return NextResponse.redirect(`${origin}/payment/result?status=failed`);
  }
}
