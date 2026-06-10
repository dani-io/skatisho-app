"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowRight, Crown, Wallet, Bell, Trash2, Send, ShoppingCart,
  Bookmark, Ticket, Award, MapPin, Clock, Globe, Smile,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatPrice, toPersianDigits } from "@/lib/utils";
import Link from "next/link";

const MOOD_MAP: Record<string, string> = {
  love: "😍 عاشقم", excited: "🤩 هیجان زده‌ام", cool: "😎 باحالم",
  happy: "😄 خوشحالم", kind: "🤗 مهربونم", satisfied: "😊 راضی‌ام",
  neutral: "😐 بی‌تفاوتم", tired: "😩 خسته‌ام", sad: "😢 ناراحتم",
  sick: "🤒 مریضم", angry: "😡 عصبانی‌ام", confused: "😵‍💫 گیجم",
};

export default function AdminUserDetailPage() {
  const { userId } = useParams();
  const router = useRouter();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [plans, setPlans] = useState<any[]>([]);
  const [showSub, setShowSub] = useState(false);
  const [showWallet, setShowWallet] = useState(false);
  const [showNotif, setShowNotif] = useState(false);
  const [subPlanId, setSubPlanId] = useState("");
  const [subDays, setSubDays] = useState("30");
  const [walletAmount, setWalletAmount] = useState("");
  const [walletDesc, setWalletDesc] = useState("");
  const [notifTitle, setNotifTitle] = useState("");
  const [notifMsg, setNotifMsg] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch(`/api/admin/users/${userId}`).then((r) => r.json()).then(setData).finally(() => setLoading(false));
    fetch("/api/admin/subscriptions?plans=1").then((r) => r.json()).then((d) => setPlans(d.plans || []));
  }, [userId]);

  async function doAction(body: any) {
    setSaving(true);
    await fetch(`/api/admin/users/${userId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const res = await fetch(`/api/admin/users/${userId}`);
    setData(await res.json());
    setSaving(false);
    setShowSub(false); setShowWallet(false); setShowNotif(false);
  }

  async function deleteUser() {
    if (!confirm("کاربر و تمام اطلاعاتش حذف شود؟")) return;
    await fetch(`/api/admin/users/${userId}`, { method: "DELETE" });
    router.push("/admin/users");
  }

  if (loading || !data) {
    return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-3 border-primary border-t-transparent rounded-full animate-spin" /></div>;
  }

  const { user, mood, orders, walletTx, courseAccess, tickets } = data;
  const sub = user.subscription;
  const isActive = sub?.isActive && new Date(sub.endDate) > new Date();

  return (
    <div className="max-w-3xl">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Link href="/admin/users"><ArrowRight className="w-5 h-5" /></Link>
        <h1 className="text-xl font-bold">جزئیات کاربر</h1>
      </div>

      {/* User Card */}
      <div className="bg-white rounded-[var(--radius-card)] border border-surface-container p-5 mb-4">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden shrink-0">
            {user.avatar ? (
              <img src={user.avatar} alt="" className="w-full h-full object-cover" />
            ) : (
              <span className="text-2xl font-bold text-primary">{user.name?.charAt(0) || "؟"}</span>
            )}
          </div>
          <div className="flex-1">
            <h2 className="font-bold text-lg">{user.name || "بدون نام"}</h2>
            <p className="text-sm text-on-surface-muted" dir="ltr">{user.phone}</p>
            {mood && <p className="text-xs mt-1">{MOOD_MAP[mood] || mood}</p>}
          </div>
          <div className="text-left">
            {isActive ? (
              <span className="bg-green-100 text-green-700 text-xs px-3 py-1 rounded-full font-medium">اشتراک فعال</span>
            ) : (
              <span className="bg-red-100 text-red-600 text-xs px-3 py-1 rounded-full font-medium">بدون اشتراک</span>
            )}
          </div>
        </div>

        {/* Quick Info */}
        <div className="grid grid-cols-2 gap-3 mt-4 text-xs">
          <div className="flex items-center gap-2 text-on-surface-muted">
            <Clock className="w-3.5 h-3.5" />
            <span>عضویت: {new Date(user.createdAt).toLocaleDateString("fa-IR")}</span>
          </div>
          <div className="flex items-center gap-2 text-on-surface-muted">
            <Clock className="w-3.5 h-3.5" />
            <span>آخرین ورود: {user.lastLoginAt ? new Date(user.lastLoginAt).toLocaleDateString("fa-IR") : "—"}</span>
          </div>
          <div className="flex items-center gap-2 text-on-surface-muted">
            <Globe className="w-3.5 h-3.5" />
            <span dir="ltr">{user.lastLoginIp || "—"}</span>
          </div>
          <div className="flex items-center gap-2 text-on-surface-muted">
            <Wallet className="w-3.5 h-3.5" />
            <span>کیف پول: {formatPrice(user.walletBalance)}</span>
          </div>
        </div>

        {/* Stats Row */}
        <div className="flex items-center gap-4 mt-4 pt-4 border-t border-surface-container text-xs text-on-surface-muted">
          <span><Award className="w-3 h-3 inline ml-1" />{toPersianDigits(user._count.progress)} درس</span>
          <span><Bookmark className="w-3 h-3 inline ml-1" />{toPersianDigits(user._count.lessonBookmarks)} نشان</span>
          <span><ShoppingCart className="w-3 h-3 inline ml-1" />{toPersianDigits(user._count.orders)} سفارش</span>
          <span><Ticket className="w-3 h-3 inline ml-1" />{toPersianDigits(user._count.tickets)} تیکت</span>
        </div>
      </div>

      {/* Actions */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-4">
        <Button variant="outline" onClick={() => setShowSub(true)} className="text-xs">
          <Crown className="w-3.5 h-3.5 ml-1" />اشتراک
        </Button>
        <Button variant="outline" onClick={() => setShowWallet(true)} className="text-xs">
          <Wallet className="w-3.5 h-3.5 ml-1" />شارژ کیف پول
        </Button>
        <Button variant="outline" onClick={() => setShowNotif(true)} className="text-xs">
          <Bell className="w-3.5 h-3.5 ml-1" />ارسال نوتیف
        </Button>
        <Button variant="outline" onClick={deleteUser} className="text-xs text-red-500 border-red-200">
          <Trash2 className="w-3.5 h-3.5 ml-1" />حذف کاربر
        </Button>
      </div>

      {/* Subscribe Modal */}
      {showSub && (
        <div className="bg-white rounded-[var(--radius-card)] border border-primary/30 p-4 mb-4">
          <h3 className="text-sm font-bold mb-3">مدیریت اشتراک</h3>
          {isActive && (
            <div className="bg-green-50 rounded-xl p-3 mb-3 text-xs">
              <p>پلن: <b>{sub.plan.title}</b></p>
              <p>شروع: {new Date(sub.startDate).toLocaleDateString("fa-IR")} — پایان: {new Date(sub.endDate).toLocaleDateString("fa-IR")}</p>
            </div>
          )}
          <div className="grid grid-cols-2 gap-2 mb-3">
            <select value={subPlanId} onChange={(e) => setSubPlanId(e.target.value)}
              className="h-9 px-3 text-xs border border-surface-container rounded-lg">
              <option value="">انتخاب پلن</option>
              {plans.map((p: any) => <option key={p.id} value={p.id}>{p.title}</option>)}
            </select>
            <select value={subDays} onChange={(e) => setSubDays(e.target.value)}
              className="h-9 px-3 text-xs border border-surface-container rounded-lg">
              <option value="7">۷ روز</option>
              <option value="30">۱ ماه</option>
              <option value="90">۳ ماه</option>
              <option value="180">۶ ماه</option>
              <option value="365">۱ سال</option>
            </select>
          </div>
          <div className="flex gap-2">
            <Button onClick={() => doAction({ action: "subscribe", planId: subPlanId, days: parseInt(subDays) })}
              disabled={!subPlanId || saving} className="text-xs flex-1">فعال‌سازی</Button>
            {isActive && (
              <Button variant="outline" onClick={() => doAction({ action: "unsubscribe" })}
                disabled={saving} className="text-xs text-red-500">غیرفعال</Button>
            )}
          </div>
        </div>
      )}

      {/* Wallet Modal */}
      {showWallet && (
        <div className="bg-white rounded-[var(--radius-card)] border border-primary/30 p-4 mb-4">
          <h3 className="text-sm font-bold mb-3">شارژ کیف پول</h3>
          <div className="space-y-2">
            <input type="number" value={walletAmount} onChange={(e) => setWalletAmount(e.target.value)}
              placeholder="مبلغ (تومان)" className="w-full h-9 px-3 text-xs border border-surface-container rounded-lg focus:border-primary focus:outline-none" />
            <input value={walletDesc} onChange={(e) => setWalletDesc(e.target.value)}
              placeholder="توضیحات (مثلاً: هدیه تولد)" className="w-full h-9 px-3 text-xs border border-surface-container rounded-lg focus:border-primary focus:outline-none" />
            <Button onClick={() => doAction({ action: "addWallet", amount: parseInt(walletAmount), description: walletDesc })}
              disabled={!walletAmount || saving} className="text-xs" size="full">شارژ {walletAmount ? formatPrice(parseInt(walletAmount)) : ""}</Button>
          </div>
        </div>
      )}

      {/* Notification Modal */}
      {showNotif && (
        <div className="bg-white rounded-[var(--radius-card)] border border-primary/30 p-4 mb-4">
          <h3 className="text-sm font-bold mb-3">ارسال نوتیفیکیشن</h3>
          <div className="space-y-2">
            <input value={notifTitle} onChange={(e) => setNotifTitle(e.target.value)}
              placeholder="عنوان" className="w-full h-9 px-3 text-xs border border-surface-container rounded-lg focus:border-primary focus:outline-none" />
            <textarea value={notifMsg} onChange={(e) => setNotifMsg(e.target.value)}
              placeholder="متن پیام" rows={3} className="w-full px-3 py-2 text-xs border border-surface-container rounded-lg focus:border-primary focus:outline-none resize-none" />
            <Button onClick={() => doAction({ action: "sendNotification", title: notifTitle, message: notifMsg })}
              disabled={!notifTitle || !notifMsg || saving} className="text-xs" size="full">
              <Send className="w-3 h-3 ml-1" />ارسال
            </Button>
          </div>
        </div>
      )}

      {/* Subscription Info */}
      {isActive && (
        <div className="bg-green-50 rounded-[var(--radius-card)] border border-green-200 p-4 mb-4">
          <div className="flex items-center gap-2 mb-1">
            <Crown className="w-4 h-4 text-green-600" />
            <h3 className="text-sm font-bold text-green-700">اشتراک فعال — {sub.plan.title}</h3>
          </div>
          <p className="text-xs text-green-600">
            {new Date(sub.startDate).toLocaleDateString("fa-IR")} تا {new Date(sub.endDate).toLocaleDateString("fa-IR")}
          </p>
        </div>
      )}

      {/* Purchased Courses */}
      {courseAccess.length > 0 && (
        <div className="bg-white rounded-[var(--radius-card)] border border-surface-container p-4 mb-4">
          <h3 className="text-sm font-bold mb-3">دوره‌های خریداری شده</h3>
          <div className="space-y-2">
            {courseAccess.map((ca: any) => (
              <div key={ca.id} className="flex items-center justify-between text-xs p-2 bg-surface-dim rounded-lg">
                <span>{ca.course.title}</span>
                <span className="text-on-surface-muted">{formatPrice(ca.amount)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Wallet Transactions */}
      {walletTx.length > 0 && (
        <div className="bg-white rounded-[var(--radius-card)] border border-surface-container p-4 mb-4">
          <h3 className="text-sm font-bold mb-3">تراکنش‌های کیف پول</h3>
          <div className="space-y-2">
            {walletTx.map((tx: any) => (
              <div key={tx.id} className="flex items-center justify-between text-xs">
                <div>
                  <p>{tx.description}</p>
                  <p className="text-[10px] text-on-surface-muted">{new Date(tx.createdAt).toLocaleDateString("fa-IR")}</p>
                </div>
                <span className={`font-bold ${tx.amount > 0 ? "text-green-600" : "text-red-500"}`}>
                  {tx.amount > 0 ? "+" : ""}{tx.amount.toLocaleString()}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent Orders */}
      {orders.length > 0 && (
        <div className="bg-white rounded-[var(--radius-card)] border border-surface-container p-4 mb-4">
          <h3 className="text-sm font-bold mb-3">سفارشات اخیر</h3>
          <div className="space-y-2">
            {orders.map((o: any) => (
              <Link key={o.id} href={`/admin/orders`}
                className="flex items-center justify-between text-xs p-2 bg-surface-dim rounded-lg">
                <span>{formatPrice(o.totalAmount)}</span>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${
                  o.status === "PAID" ? "bg-green-100 text-green-600" :
                  o.status === "PENDING" ? "bg-yellow-100 text-yellow-700" : "bg-gray-100 text-gray-600"
                }`}>{o.status === "PAID" ? "پرداخت شده" : o.status === "PENDING" ? "در انتظار" : o.status}</span>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Tickets */}
      {tickets.length > 0 && (
        <div className="bg-white rounded-[var(--radius-card)] border border-surface-container p-4 mb-4">
          <h3 className="text-sm font-bold mb-3">تیکت‌ها</h3>
          <div className="space-y-2">
            {tickets.map((t: any) => (
              <Link key={t.id} href={`/admin/tickets/${t.id}`}
                className="flex items-center justify-between text-xs p-2 bg-surface-dim rounded-lg">
                <span>{t.subject}</span>
                <span className="text-on-surface-muted">{toPersianDigits(t._count.messages)} پیام</span>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Addresses */}
      {user.addresses?.length > 0 && (
        <div className="bg-white rounded-[var(--radius-card)] border border-surface-container p-4 mb-4">
          <h3 className="text-sm font-bold mb-3">آدرس‌ها</h3>
          <div className="space-y-2">
            {user.addresses.map((a: any) => (
              <div key={a.id} className="flex items-start gap-2 text-xs p-2 bg-surface-dim rounded-lg">
                <MapPin className="w-3 h-3 mt-0.5 text-primary shrink-0" />
                <span>{a.province}، {a.city}، {a.address}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
