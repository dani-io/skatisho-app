"use client";

import { useEffect, useState } from "react";
import { formatPrice, toPersianDigits } from "@/lib/utils";

interface Subscription {
  id: string;
  startDate: string;
  endDate: string;
  isActive: boolean;
  user: { name: string | null; phone: string };
  plan: { title: string; price: number };
}

export default function AdminSubscriptionsPage() {
  const [subs, setSubs] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/subscriptions")
      .then((r) => r.json())
      .then((d) => setSubs(d.subscriptions || []))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-3 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-xl font-bold mb-6">مدیریت اشتراک‌ها</h1>

      <div className="bg-white rounded-[var(--radius-card)] border border-surface-container overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-surface-dim">
            <tr>
              <th className="text-right p-3 font-medium">کاربر</th>
              <th className="text-right p-3 font-medium">پلن</th>
              <th className="text-right p-3 font-medium">مبلغ</th>
              <th className="text-right p-3 font-medium">شروع</th>
              <th className="text-right p-3 font-medium">پایان</th>
              <th className="text-right p-3 font-medium">وضعیت</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-surface-container">
            {subs.map((s) => (
              <tr key={s.id} className="hover:bg-surface-dim/50">
                <td className="p-3">
                  <p className="font-medium">{s.user.name || "بدون نام"}</p>
                  <p className="text-xs text-on-surface-muted" dir="ltr">{s.user.phone}</p>
                </td>
                <td className="p-3">{s.plan.title}</td>
                <td className="p-3">{formatPrice(s.plan.price)}</td>
                <td className="p-3 text-xs">{new Date(s.startDate).toLocaleDateString("fa-IR")}</td>
                <td className="p-3 text-xs">{new Date(s.endDate).toLocaleDateString("fa-IR")}</td>
                <td className="p-3">
                  <span className={`text-xs px-2 py-0.5 rounded-full ${
                    s.isActive && new Date(s.endDate) > new Date()
                      ? "bg-green-100 text-green-600"
                      : "bg-red-100 text-red-600"
                  }`}>
                    {s.isActive && new Date(s.endDate) > new Date() ? "فعال" : "منقضی"}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {subs.length === 0 && (
          <p className="p-6 text-center text-on-surface-muted text-sm">اشتراکی ثبت نشده</p>
        )}
      </div>
    </div>
  );
}
