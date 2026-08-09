import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/access";

export async function GET() {
  const denied = await requireAdmin();
  if (denied) return denied;

  const now = new Date();
  const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1);

  const [
    totalUsers,
    activeSubscriptions,
    totalCourses,
    totalLessons,
    totalProducts,
    totalPayments,
    recentUsers,
    // Order stats
    ordersByStatus,
    totalOrderRevenue,
    recentOrders,
    recentPayments,
    // Monthly revenue (payments)
    monthlyPayments,
  ] = await Promise.all([
    db.user.count(),
    db.subscription.count({ where: { isActive: true } }),
    db.course.count(),
    db.lesson.count(),
    db.product.count(),
    db.payment.aggregate({
      where: { status: "SUCCESS" },
      _sum: { amount: true },
    }),
    db.user.findMany({
      take: 5,
      orderBy: { createdAt: "desc" },
      select: { id: true, name: true, phone: true, createdAt: true },
    }),
    // Orders grouped by status
    db.order.groupBy({
      by: ["status"],
      _count: { id: true },
    }),
    // Total order revenue (PAID + SHIPPED + DELIVERED)
    db.order.aggregate({
      where: { status: { in: ["PAID", "SHIPPED", "DELIVERED"] } },
      _sum: { totalAmount: true },
    }),
    // Recent orders
    db.order.findMany({
      take: 10,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        totalAmount: true,
        status: true,
        createdAt: true,
        user: { select: { name: true, phone: true } },
        items: {
          select: {
            quantity: true,
            product: { select: { title: true } },
          },
        },
      },
    }),
    // Recent payments
    db.payment.findMany({
      take: 10,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        amount: true,
        status: true,
        description: true,
        createdAt: true,
        user: { select: { name: true, phone: true } },
      },
    }),
    // Monthly payments (last 6 months)
    db.payment.findMany({
      where: {
        status: "SUCCESS",
        createdAt: { gte: sixMonthsAgo },
      },
      select: { amount: true, createdAt: true },
    }),
  ]);

  // Aggregate monthly revenue
  const monthlyRevenue: Record<string, number> = {};
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    monthlyRevenue[key] = 0;
  }
  for (const p of monthlyPayments) {
    const d = new Date(p.createdAt);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    if (key in monthlyRevenue) {
      monthlyRevenue[key] += p.amount;
    }
  }

  // Order status map
  const orderStats: Record<string, number> = {
    PENDING: 0, PAID: 0, SHIPPED: 0, DELIVERED: 0, CANCELLED: 0,
  };
  for (const g of ordersByStatus) {
    orderStats[g.status] = g._count.id;
  }

  return NextResponse.json({
    stats: {
      totalUsers,
      activeSubscriptions,
      totalCourses,
      totalLessons,
      totalProducts,
      totalRevenue: (totalPayments._sum.amount || 0) + (totalOrderRevenue._sum.totalAmount || 0),
    },
    orderStats,
    recentUsers,
    recentOrders,
    recentPayments,
    monthlyRevenue,
  });
}
