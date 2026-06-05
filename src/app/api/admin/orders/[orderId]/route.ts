import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { createNotification } from "@/lib/notifications";

const ADMIN_PHONES = ["09123456789", "09179498400"];

const STATUS_LABELS: Record<string, string> = {
  PENDING: "در انتظار پرداخت",
  PAID: "پرداخت شده",
  SHIPPED: "ارسال شده",
  DELIVERED: "تحویل داده شده",
  CANCELLED: "لغو شده",
};

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ orderId: string }> }
) {
  const session = await getSession();
  if (!session || !ADMIN_PHONES.includes(session.phone)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const { orderId } = await params;
  const { status, trackingCode } = await req.json();

  const data: any = {};
  if (status) data.status = status;
  if (trackingCode !== undefined) data.trackingCode = trackingCode;

  const order = await db.order.update({
    where: { id: orderId },
    data,
  });

  // Notify user
  if (status) {
    let message = `وضعیت سفارش شما به «${STATUS_LABELS[status] || status}» تغییر کرد`;
    if (status === "SHIPPED" && trackingCode) {
      message += ` — کد رهگیری: ${trackingCode}`;
    }
    await createNotification({
      userId: order.userId,
      title: "بروزرسانی سفارش",
      message,
      type: "ORDER_UPDATE",
      link: "/orders",
    });
  }

  return NextResponse.json({ order });
}
