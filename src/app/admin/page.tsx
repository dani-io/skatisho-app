"use client";

import { useEffect, useState } from "react";
import {
  Users,
  Crown,
  BookOpen,
  PlayCircle,
  ShoppingBag,
  DollarSign,
  Package,
  Clock,
  Truck,
  CheckCircle,
  XCircle,
  CreditCard,
  TrendingUp,
} from "lucide-react";
import { formatPrice, toPersianDigits } from "@/lib/utils";

interface Stats {
  totalUsers: number;
  activeSubscriptions: number;
  totalCourses: number;
  totalLessons: number;
  totalProducts: number;
  totalRevenue: number;
}

interface RecentUser {
  id: string;
  name: string | null;
  phone: string;
  createdAt: string;
}

interface RecentOrder {
  id: string;
  totalAmount: number;
  status: string;
  createdAt: string;
  user: { name: string | null; phone: string };
  items: { quantity: number; product: { title: string } }[];
}

interface RecentPayment {
  id: string;
  amount: number;
  status: string;
  description: string | null;
  createdAt: string;
  user: { name: string | null; phone: string };
}

const STAT_CARDS = [
  { key: "totalUsers", label: "کاربران", icon: Users, color: "bg-blue-50 text-blue-600" },
  { key: "activeSubscriptions", label: "اشتراک فعال", icon: Crown, color: "bg-gold-50 text-gold-600" },
  { key: "totalCourses", label: "دوره‌ها", icon: BookOpen, color: "bg-green-50 text-green-600" },
  { key: "totalLessons", label: "دروس", icon: PlayCircle, color: "bg-purple-50 text-purple-600" },
  { key: "totalProducts", label: "محصولات", icon: ShoppingBag, color: "bg-red-50 text-red-600" },
  { key: "totalRevenue", label: "درآمد کل", icon: DollarSign, color: "bg-emerald-50 text-emerald-600", isCurrency: true },
];

const ORDER_STATUS_MAP: Record<string, { label: string; icon: typeof Clock; color: string }> = {
  PENDING: { label: "در انتظار", icon: Clock, color: "text-amber-600 bg-amber-50" },
  PAID: { label: "پرداخت شده", icon: CreditCard, color: "text-blue-600 bg-blue-50" },
  SHIPPED: { label: "ارسال شده", icon: Truck, color: "text-purple-600 bg-purple-50" },
  DELIVERED: { label: "تحویل شده", icon: CheckCircle, color: "text-green-600 bg-green-50" },
  CANCELLED: { label: "لغو شده", icon: XCircle, color: "text-red-600 bg-red-50" },
};

const PAYMENT_STATUS_MAP: Record<string, { label: string; color: string }> = {
  PENDING: { label: "در انتظار", color: "bg-amber-100 text-amber-700" },
  SUCCESS: { label: "موفق", color: "bg-green-100 text-green-700" },
  FAILED: { label: "ناموفق", color: "bg-red-100 text-red-700" },
};

const PERSIAN_MONTHS = [
  "فروردین", "اردیبهشت", "خرداد", "تیر", "مرداد", "شهریور",
  "مهر", "آبان", "آذر", "دی", "بهمن", "اسفند",
];

function getMonthLabel(key: string) {
  const [y, m] = key.split("-").map(Number);
  try {
    const d = new Date(y, m - 1, 15);
    const parts = new Intl.DateTimeFormat("fa-IR", { month: "long" }).formatToParts(d);
    const monthPart = parts.find((p) => p.type === "month");
    return monthPart?.value || key;
  } catch {
    return key;
  }
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [orderStats, setOrderStats] = useState<Record<string, number>>({});
  const [recentUsers, setRecentUsers] = useState<RecentUser[]>([]);
  const [recentOrders, setRecentOrders] = useState<RecentOrder[]>([]);
  const [recentPayments, setRecentPayments] = useState<RecentPayment[]>([]);
  const [monthlyRevenue, setMonthlyRevenue] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"orders" | "payments" | "users">("orders");

  useEffect(() => {
    fetch("/api/admin/stats")
      .then((r) => r.json())
      .then((data) => {
        setStats(data.stats);
        setOrderStats(data.orderStats || {});
        setRecentUsers(data.recentUsers || []);
        setRecentOrders(data.recentOrders || []);
        setRecentPayments(data.recentPayments || []);
        setMonthlyRevenue(data.monthlyRevenue || {});
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-3 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const maxRevenue = Math.max(...Object.values(monthlyRevenue), 1);

  return (
    <div>
      <h1 className="text-xl font-bold mb-6">داشبورد</h1>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
        {STAT_CARDS.map((card) => {
          const value = stats?.[card.key as keyof Stats] ?? 0;
          return (
            <div
              key={card.key}
              className="bg-white rounded-[var(--radius-card)] border border-surface-container p-4"
            >
              <div className="flex items-center gap-3 mb-3">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${card.color}`}>
                  <card.icon className="w-4.5 h-4.5" />
                </div>
                <span className="text-xs text-on-surface-muted">{card.label}</span>
              </div>
              <p className="text-2xl font-bold">
                {card.isCurrency
                  ? formatPrice(value as number)
                  : toPersianDigits(value)}
              </p>
            </div>
          );
        })}
      </div>

      {/* Order Status Cards */}
      <div className="mb-6">
        <h2 className="font-bold text-sm mb-3">وضعیت سفارشات</h2>
        <div className="grid grid-cols-3 md:grid-cols-5 gap-3">
          {Object.entries(ORDER_STATUS_MAP).map(([status, info]) => (
            <div
              key={status}
              className="bg-white rounded-[var(--radius-card)] border border-surface-container p-3 text-center"
            >
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center mx-auto mb-2 ${info.color}`}>
                <info.icon className="w-4 h-4" />
              </div>
              <p className="text-lg font-bold">{toPersianDigits(orderStats[status] || 0)}</p>
              <p className="text-[11px] text-on-surface-muted">{info.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Monthly Revenue Chart */}
      {Object.keys(monthlyRevenue).length > 0 && (
        <div className="bg-white rounded-[var(--radius-card)] border border-surface-container p-4 mb-6">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="w-4 h-4 text-primary" />
            <h2 className="font-bold text-sm">درآمد ماهانه</h2>
          </div>
          <div className="flex items-end gap-2 h-32">
            {Object.entries(monthlyRevenue).map(([key, value]) => (
              <div key={key} className="flex-1 flex flex-col items-center gap-1">
                <span className="text-[10px] text-on-surface-muted font-medium">
                  {value > 0 ? formatPrice(value) : "—"}
                </span>
                <div
                  className="w-full bg-primary/20 rounded-t-md relative overflow-hidden"
                  style={{ height: `${Math.max((value / maxRevenue) * 100, 4)}%` }}
                >
                  <div
                    className="absolute bottom-0 w-full bg-primary rounded-t-md"
                    style={{ height: value > 0 ? "100%" : "0%" }}
                  />
                </div>
                <span className="text-[10px] text-on-surface-muted">
                  {getMonthLabel(key)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tabs: Orders / Payments / Users */}
      <div className="bg-white rounded-[var(--radius-card)] border border-surface-container">
        <div className="flex border-b border-surface-container">
          {[
            { id: "orders" as const, label: "سفارشات اخیر", icon: Package },
            { id: "payments" as const, label: "پرداخت‌ها", icon: CreditCard },
            { id: "users" as const, label: "کاربران جدید", icon: Users },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 flex items-center justify-center gap-1.5 py-3 text-xs font-medium transition-colors ${
                activeTab === tab.id
                  ? "text-primary border-b-2 border-primary"
                  : "text-on-surface-muted"
              }`}
            >
              <tab.icon className="w-3.5 h-3.5" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Orders Tab */}
        {activeTab === "orders" && (
          <div className="divide-y divide-surface-container">
            {recentOrders.map((order) => {
              const statusInfo = ORDER_STATUS_MAP[order.status] || ORDER_STATUS_MAP.PENDING;
              return (
                <div key={order.id} className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <p className="text-sm font-medium">
                        {order.user.name || "بدون نام"}
                      </p>
                      <p className="text-[11px] text-on-surface-muted" dir="ltr">
                        {order.user.phone}
                      </p>
                    </div>
                    <div className="text-left">
                      <span className={`inline-block text-[10px] px-2 py-0.5 rounded-full font-medium ${statusInfo.color}`}>
                        {statusInfo.label}
                      </span>
                      <p className="text-[11px] text-on-surface-muted mt-1">
                        {new Date(order.createdAt).toLocaleDateString("fa-IR")}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <p className="text-[11px] text-on-surface-muted">
                      {order.items.map((item) => `${item.product.title} (${toPersianDigits(item.quantity)})`).join("، ")}
                    </p>
                    <p className="text-sm font-bold text-primary">
                      {formatPrice(order.totalAmount)}
                    </p>
                  </div>
                </div>
              );
            })}
            {recentOrders.length === 0 && (
              <p className="p-6 text-sm text-on-surface-muted text-center">سفارشی ثبت نشده</p>
            )}
          </div>
        )}

        {/* Payments Tab */}
        {activeTab === "payments" && (
          <div className="divide-y divide-surface-container">
            {recentPayments.map((payment) => {
              const statusInfo = PAYMENT_STATUS_MAP[payment.status] || PAYMENT_STATUS_MAP.PENDING;
              return (
                <div key={payment.id} className="flex items-center justify-between p-4">
                  <div>
                    <p className="text-sm font-medium">
                      {payment.user.name || "بدون نام"}
                    </p>
                    <p className="text-[11px] text-on-surface-muted">
                      {payment.description || "پرداخت"}
                    </p>
                    <p className="text-[11px] text-on-surface-muted" dir="ltr">
                      {payment.user.phone}
                    </p>
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-bold">{formatPrice(payment.amount)}</p>
                    <span className={`inline-block text-[10px] px-2 py-0.5 rounded-full font-medium mt-1 ${statusInfo.color}`}>
                      {statusInfo.label}
                    </span>
                    <p className="text-[11px] text-on-surface-muted mt-1">
                      {new Date(payment.createdAt).toLocaleDateString("fa-IR")}
                    </p>
                  </div>
                </div>
              );
            })}
            {recentPayments.length === 0 && (
              <p className="p-6 text-sm text-on-surface-muted text-center">پرداختی ثبت نشده</p>
            )}
          </div>
        )}

        {/* Users Tab */}
        {activeTab === "users" && (
          <div className="divide-y divide-surface-container">
            {recentUsers.map((user) => (
              <div key={user.id} className="flex items-center justify-between p-4">
                <div>
                  <p className="text-sm font-medium">{user.name || "بدون نام"}</p>
                  <p className="text-xs text-on-surface-muted" dir="ltr">{user.phone}</p>
                </div>
                <span className="text-xs text-on-surface-muted">
                  {new Date(user.createdAt).toLocaleDateString("fa-IR")}
                </span>
              </div>
            ))}
            {recentUsers.length === 0 && (
              <p className="p-6 text-sm text-on-surface-muted text-center">کاربری ثبت نشده</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
