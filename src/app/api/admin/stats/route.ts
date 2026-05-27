import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const [
    totalUsers,
    activeSubscriptions,
    totalCourses,
    totalLessons,
    totalProducts,
    totalPayments,
    recentUsers,
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
  ]);

  return NextResponse.json({
    stats: {
      totalUsers,
      activeSubscriptions,
      totalCourses,
      totalLessons,
      totalProducts,
      totalRevenue: totalPayments._sum.amount || 0,
    },
    recentUsers,
  });
}
