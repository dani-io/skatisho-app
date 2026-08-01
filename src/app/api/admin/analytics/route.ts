import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { ADMIN_PHONES } from "@/lib/access";


export async function GET() {
  const session = await getSession();
  if (!session || !ADMIN_PHONES.includes(session.phone)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  // Gender distribution
  const allUsers = await db.user.findMany({
    select: { gender: true, birthDate: true, createdAt: true },
  });

  const genderStats = { male: 0, female: 0, unknown: 0 };
  allUsers.forEach((u: any) => {
    if (u.gender === "male") genderStats.male++;
    else if (u.gender === "female") genderStats.female++;
    else genderStats.unknown++;
  });

  // Age distribution
  const now = new Date();
  const ageGroups: Record<string, number> = {
    "زیر ۱۵": 0, "۱۵-۲۰": 0, "۲۰-۲۵": 0, "۲۵-۳۰": 0,
    "۳۰-۴۰": 0, "۴۰+": 0, "نامشخص": 0,
  };
  allUsers.forEach((u: any) => {
    if (!u.birthDate) { ageGroups["نامشخص"]++; return; }
    const age = Math.floor((now.getTime() - new Date(u.birthDate).getTime()) / (365.25 * 24 * 60 * 60 * 1000));
    if (age < 15) ageGroups["زیر ۱۵"]++;
    else if (age < 20) ageGroups["۱۵-۲۰"]++;
    else if (age < 25) ageGroups["۲۰-۲۵"]++;
    else if (age < 30) ageGroups["۲۵-۳۰"]++;
    else if (age < 40) ageGroups["۳۰-۴۰"]++;
    else ageGroups["۴۰+"]++;
  });

  // City distribution (from addresses)
  const addresses = await db.address.findMany({
    select: { city: true, province: true },
    distinct: ["userId"],
  });
  const cityStats: Record<string, number> = {};
  addresses.forEach((a: any) => {
    const key = a.city || a.province || "نامشخص";
    cityStats[key] = (cityStats[key] || 0) + 1;
  });
  const topCities = Object.entries(cityStats)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([city, count]) => ({ city, count }));

  // Monthly revenue (last 12 months)
  const twelveMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 11, 1);
  const payments = await db.payment.findMany({
    where: { status: "SUCCESS", createdAt: { gte: twelveMonthsAgo } },
    select: { amount: true, createdAt: true },
  });

  const monthlyRevenue: Record<string, number> = {};
  for (let i = 11; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    monthlyRevenue[key] = 0;
  }
  payments.forEach((p: any) => {
    const d = new Date(p.createdAt);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    if (key in monthlyRevenue) monthlyRevenue[key] += p.amount;
  });

  // Daily revenue (last 30 days)
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const recentPayments = await db.payment.findMany({
    where: { status: "SUCCESS", createdAt: { gte: thirtyDaysAgo } },
    select: { amount: true, createdAt: true },
  });

  const dailyRevenue: Record<string, number> = {};
  for (let i = 29; i >= 0; i--) {
    const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
    const key = d.toISOString().split("T")[0];
    dailyRevenue[key] = 0;
  }
  recentPayments.forEach((p: any) => {
    const key = new Date(p.createdAt).toISOString().split("T")[0];
    if (key in dailyRevenue) dailyRevenue[key] += p.amount;
  });

  // User growth (last 12 months)
  const userGrowth: Record<string, number> = {};
  for (let i = 11; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    userGrowth[key] = 0;
  }
  allUsers.forEach((u: any) => {
    const d = new Date(u.createdAt);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    if (key in userGrowth) userGrowth[key]++;
  });

  // Order stats by category
  const orderItems = await db.orderItem.findMany({
    include: { product: { select: { category: true } }, order: { select: { status: true } } },
  });
  const categoryStats: Record<string, { count: number; revenue: number }> = {};
  orderItems.forEach((item: any) => {
    if (item.order.status === "CANCELLED") return;
    const cat = item.product.category;
    if (!categoryStats[cat]) categoryStats[cat] = { count: 0, revenue: 0 };
    categoryStats[cat].count += item.quantity;
    categoryStats[cat].revenue += item.price * item.quantity;
  });

  return NextResponse.json({
    genderStats,
    ageGroups,
    topCities,
    monthlyRevenue,
    dailyRevenue,
    userGrowth,
    categoryStats,
    totalUsers: allUsers.length,
  });
}
