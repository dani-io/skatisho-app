"use client";

import { useEffect, useState } from "react";
import { toPersianDigits } from "@/lib/utils";

interface User {
  id: string;
  name: string | null;
  phone: string;
  skillLevel: string | null;
  createdAt: string;
  subscription: { isActive: boolean; plan: { title: string } } | null;
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);

  useEffect(() => {
    fetch("/api/admin/users").then((r) => r.json()).then((d) => setUsers(d.users || []));
  }, []);

  return (
    <div>
      <h1 className="text-xl font-bold mb-6">مدیریت کاربران</h1>
      <div className="bg-white rounded-[var(--radius-card)] border border-surface-container overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-surface-dim">
            <tr>
              <th className="text-right p-3 font-medium">نام</th>
              <th className="text-right p-3 font-medium">شماره</th>
              <th className="text-right p-3 font-medium">سطح</th>
              <th className="text-right p-3 font-medium">اشتراک</th>
              <th className="text-right p-3 font-medium">تاریخ</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-surface-container">
            {users.map((u) => (
              <tr key={u.id} className="hover:bg-surface-dim/50">
                <td className="p-3">{u.name || "—"}</td>
                <td className="p-3" dir="ltr">{u.phone}</td>
                <td className="p-3">{u.skillLevel || "—"}</td>
                <td className="p-3">
                  {u.subscription?.isActive ? (
                    <span className="bg-green-100 text-green-600 text-xs px-2 py-0.5 rounded-full">{u.subscription.plan.title}</span>
                  ) : (
                    <span className="text-on-surface-muted text-xs">ندارد</span>
                  )}
                </td>
                <td className="p-3 text-xs text-on-surface-muted">{new Date(u.createdAt).toLocaleDateString("fa-IR")}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
