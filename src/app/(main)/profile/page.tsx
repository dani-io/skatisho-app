"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  User,
  Crown,
  Share2,
  HelpCircle,
  ChevronLeft,
  LogOut,
  MapPin,
  Plus,
  Edit3,
  Trash2,
  Award,
  Target,
  Star,
  X,
  Save,
  Package,
  ShoppingBag,
  TrendingUp,
  Gift,
  Loader2,
  BookmarkCheck,
  StickyNote,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { toPersianDigits, formatPrice } from "@/lib/utils";

interface UserData {
  id: string;
  phone: string;
  name: string | null;
  avatar: string | null;
  
  skillLevel: string | null;
  goal: string | null;
  birthDate: string | null;
  gender: string | null;
  height: number | null;
  weight: number | null;
  points: number;
  referralCode: string;
  walletBalance: number;
  createdAt: string;
  subscription: { isActive: boolean; plan: { title: string }; endDate: string } | null;
  _count: { progress: number; badges: number; orders: number; favorites: number };
}

interface Address {
  id: string;
  title: string;
  province: string;
  city: string;
  address: string;
  postalCode: string | null;
  phone: string | null;
  isDefault: boolean;
}

const GENDER_OPTIONS = [
  { id: "male", label: "مرد" },
  { id: "female", label: "زن" },
];

const GOAL_MAP: Record<string, string> = {
  fun: "تفریح و سرگرمی",
  fitness: "تناسب اندام",
  professional: "مسیر حرفه‌ای",
  transport: "حمل و نقل شهری",
};

const LEVEL_MAP: Record<string, string> = {
  BEGINNER: "مبتدی",
  INTERMEDIATE: "متوسط",
  ADVANCED: "پیشرفته",
};

function calcBMI(h: number | null, w: number | null) {
  if (!h || !w || h < 50) return null;
  const m = h / 100;
  return (w / (m * m)).toFixed(1);
}

function bmiCategory(bmi: number): { label: string; color: string } {
  if (bmi < 18.5) return { label: "کمبود وزن", color: "text-blue-600" };
  if (bmi < 25) return { label: "نرمال", color: "text-green-600" };
  if (bmi < 30) return { label: "اضافه وزن", color: "text-amber-600" };
  return { label: "چاقی", color: "text-red-600" };
}

function profileCompletion(user: UserData): number {
  let filled = 0;
  const fields = [user.name, user.skillLevel, user.goal, user.birthDate, user.gender, user.height, user.weight];
  fields.forEach((f) => { if (f) filled++; });
  return Math.round((filled / fields.length) * 100);
}

function BookmarksList() {
  const [bookmarks, setBookmarks] = useState<any[]>([]);
  const [loadingBm, setLoadingBm] = useState(true);

  useEffect(() => {
    fetch("/api/bookmarks")
      .then((r) => r.json())
      .then((data) => setBookmarks(data.bookmarks || []))
      .finally(() => setLoadingBm(false));
  }, []);

  if (loadingBm) return <div className="py-4 text-center"><div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" /></div>;

  if (bookmarks.length === 0) return <p className="text-xs text-on-surface-muted text-center py-4">درسی نشان نشده</p>;

  return (
    <div className="space-y-2">
      {bookmarks.map((bm: any) => (
        <a key={bm.id} href={`/courses/${bm.lesson.chapter.course.id}/${bm.lessonId}`}
          className="flex items-center gap-3 p-2 rounded-xl hover:bg-surface-dim transition-colors">
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
            <BookmarkCheck className="w-4 h-4 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium truncate">{bm.lesson.title}</p>
            <p className="text-[10px] text-on-surface-muted truncate">{bm.lesson.chapter.course.title} — {bm.lesson.chapter.title}</p>
          </div>
          {bm.note && <StickyNote className="w-3 h-3 text-primary shrink-0" />}
        </a>
      ))}
    </div>
  );
} 

export default function ProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState<UserData | null>(null);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(true);
  const [showEdit, setShowEdit] = useState(false);
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [saving, setSaving] = useState(false);

  // Edit form state
  const [editName, setEditName] = useState("");
  const [editBirth, setEditBirth] = useState("");
  const [editGender, setEditGender] = useState("");
  const [editHeight, setEditHeight] = useState("");
  const [editWeight, setEditWeight] = useState("");

  // Address form state
  const [addrTitle, setAddrTitle] = useState("");
  const [addrProvince, setAddrProvince] = useState("");
  const [addrCity, setAddrCity] = useState("");
  const [addrAddress, setAddrAddress] = useState("");
  const [addrPostal, setAddrPostal] = useState("");
  const [addrPhone, setAddrPhone] = useState("");
  const [giftCode, setGiftCode] = useState("");
  const [giftLoading, setGiftLoading] = useState(false);
  const [giftMsg, setGiftMsg] = useState<{ok:boolean;text:string}|null>(null);

  useEffect(() => {
    Promise.all([
      fetch("/api/auth/me").then((r) => r.json()),
      fetch("/api/addresses").then((r) => r.json()),
    ]).then(([userData, addrData]) => {
      setUser(userData.user);
      setAddresses(addrData.addresses || []);
      if (userData.user) {
        setEditName(userData.user.name || "");
        setEditBirth(userData.user.birthDate ? userData.user.birthDate.split("T")[0] : "");
        setEditGender(userData.user.gender || "");
        setEditHeight(userData.user.height?.toString() || "");
        setEditWeight(userData.user.weight?.toString() || "");
      }
    }).finally(() => setLoading(false));
  }, []);

  async function saveProfile() {
    setSaving(true);
    try {
      await fetch("/api/auth/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: editName,
          birthDate: editBirth || null,
          gender: editGender || null,
          height: editHeight || null,
          weight: editWeight || null,
        }),
      });
      const res = await fetch("/api/auth/me").then((r) => r.json());
      setUser(res.user);
      setShowEdit(false);
    } finally {
      setSaving(false);
    }
  }

  async function saveAddress() {
    setSaving(true);
    try {
      await fetch("/api/addresses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: addrTitle,
          province: addrProvince,
          city: addrCity,
          address: addrAddress,
          postalCode: addrPostal,
          phone: addrPhone,
          isDefault: addresses.length === 0,
        }),
      });
      const res = await fetch("/api/addresses").then((r) => r.json());
      setAddresses(res.addresses || []);
      setShowAddressForm(false);
      setAddrTitle(""); setAddrProvince(""); setAddrCity("");
      setAddrAddress(""); setAddrPostal(""); setAddrPhone("");
    } finally {
      setSaving(false);
    }
  }

  async function deleteAddress(id: string) {
    await fetch(`/api/addresses/${id}`, { method: "DELETE" });
    setAddresses((prev) => prev.filter((a) => a.id !== id));
  }

  async function redeemGift() {
    if (!giftCode.trim()) return;
    setGiftLoading(true); setGiftMsg(null);
    try {
      const res = await fetch("/api/gift-cards/redeem", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: giftCode }),
      });
      const data = await res.json();
      if (data.success) {
        setGiftMsg({ ok: true, text: `${data.amount.toLocaleString()} تومان به کیف پول اضافه شد` });
        setGiftCode("");
        setUser((prev: any) => prev ? { ...prev, walletBalance: data.newBalance } : prev);
      } else {
        setGiftMsg({ ok: false, text: data.error });
      }
    } catch { setGiftMsg({ ok: false, text: "خطا در شارژ کارت" }); }
    finally { setGiftLoading(false); }
  }
  
  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
  }

  if (loading || !user) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-3 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const completion = profileCompletion(user);
  const bmi = calcBMI(user.height, user.weight);
  const bmiInfo = bmi ? bmiCategory(parseFloat(bmi)) : null;

  return (
    <div className="px-4 pb-24">
      {/* Avatar & Name */}
      <div className="flex flex-col items-center pt-8 pb-4">
        <div className="relative">
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center mb-3 overflow-hidden">
            {user.avatar ? (
              <img src={user.avatar} alt="" className="w-full h-full object-cover" />
            ) : (
              <span className="text-3xl font-bold text-primary">
                {user.name?.charAt(0) || "؟"}
              </span>
            )}
          </div>
          <label className="absolute bottom-2 right-0 w-7 h-7 bg-primary rounded-full flex items-center justify-center cursor-pointer shadow-md">
            <Edit3 className="w-3.5 h-3.5 text-white" />
            <input type="file" accept="image/jpeg,image/png,image/webp" className="hidden"
              onChange={async (e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                const fd = new FormData();
                fd.append("file", file);
                const res = await fetch("/api/auth/avatar", { method: "POST", body: fd });
                const data = await res.json();
                if (data.avatar) {
                  setUser((prev: any) => prev ? { ...prev, avatar: data.avatar } : prev);
                }
              }}
            />
          </label>
        </div>
        <h2 className="font-bold text-lg">{user.name || "کاربر اسکیتی‌شو"}</h2>
        <p className="text-sm text-on-surface-muted mt-0.5" dir="ltr">
          {toPersianDigits(user.phone)}
        </p>
      </div>

      {/* Profile Completion */}
      <div className="bg-white rounded-[var(--radius-card)] border border-surface-container p-4 mb-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-bold">تکمیل پروفایل</span>
          <span className="text-xs font-bold text-primary">{toPersianDigits(completion)}٪</span>
        </div>
        <div className="h-2 bg-surface-dim rounded-full overflow-hidden">
          <div
            className="h-full bg-primary rounded-full transition-all duration-500"
            style={{ width: `${completion}%` }}
          />
        </div>
        {completion < 100 && (
          <button
            onClick={() => setShowEdit(true)}
            className="text-[11px] text-primary font-medium mt-2"
          >
            اطلاعاتت رو کامل کن!
          </button>
        )}
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-3 gap-3 mb-4">
        <div className="bg-white rounded-[var(--radius-card)] border border-surface-container p-3 text-center">
          <Star className="w-4 h-4 text-primary mx-auto mb-1" />
          <p className="text-lg font-bold">{toPersianDigits(user.points)}</p>
          <p className="text-[10px] text-on-surface-muted">امتیاز</p>
        </div>
        <div className="bg-white rounded-[var(--radius-card)] border border-surface-container p-3 text-center">
          <Award className="w-4 h-4 text-primary mx-auto mb-1" />
          <p className="text-lg font-bold">{toPersianDigits(user._count.badges)}</p>
          <p className="text-[10px] text-on-surface-muted">مدال</p>
        </div>
        <div className="bg-white rounded-[var(--radius-card)] border border-surface-container p-3 text-center">
          <Target className="w-4 h-4 text-primary mx-auto mb-1" />
          <p className="text-lg font-bold">{toPersianDigits(user._count.progress)}</p>
          <p className="text-[10px] text-on-surface-muted">درس تموم‌شده</p>
        </div>
      </div>

      {/* Personal Info Card */}
      <div className="bg-white rounded-[var(--radius-card)] border border-surface-container p-4 mb-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-bold">اطلاعات شخصی</h3>
          <button onClick={() => setShowEdit(true)} className="text-xs text-primary font-medium flex items-center gap-1">
            <Edit3 className="w-3 h-3" /> ویرایش
          </button>
        </div>
        <div className="space-y-2.5 text-sm">
          <div className="flex justify-between">
            <span className="text-on-surface-muted">سطح مهارت</span>
            <span className="font-medium">{LEVEL_MAP[user.skillLevel || ""] || "—"}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-on-surface-muted">هدف</span>
            <span className="font-medium">{GOAL_MAP[user.goal || ""] || "—"}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-on-surface-muted">جنسیت</span>
            <span className="font-medium">{user.gender === "male" ? "مرد" : user.gender === "female" ? "زن" : "—"}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-on-surface-muted">تاریخ تولد</span>
            <span className="font-medium">
              {user.birthDate ? new Date(user.birthDate).toLocaleDateString("fa-IR") : "—"}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-on-surface-muted">قد</span>
            <span className="font-medium">{user.height ? `${toPersianDigits(user.height)} سانتی‌متر` : "—"}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-on-surface-muted">وزن</span>
            <span className="font-medium">{user.weight ? `${toPersianDigits(user.weight)} کیلوگرم` : "—"}</span>
          </div>
          {bmi && bmiInfo && (
            <div className="flex justify-between pt-2 border-t border-surface-container">
              <span className="text-on-surface-muted">BMI</span>
              <span className={`font-bold ${bmiInfo.color}`}>
                {toPersianDigits(bmi)} — {bmiInfo.label}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Addresses */}
      <div className="bg-white rounded-[var(--radius-card)] border border-surface-container p-4 mb-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-bold">آدرس‌ها</h3>
          <button onClick={() => setShowAddressForm(true)} className="text-xs text-primary font-medium flex items-center gap-1">
            <Plus className="w-3 h-3" /> افزودن
          </button>
        </div>
        {addresses.length > 0 ? (
          <div className="space-y-3">
            {addresses.map((addr) => (
              <div key={addr.id} className="flex items-start gap-3 p-3 bg-surface-dim rounded-xl">
                <MapPin className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-xs font-bold">{addr.title}</p>
                    {addr.isDefault && (
                      <span className="text-[9px] px-1.5 py-0.5 rounded bg-primary/10 text-primary font-medium">پیش‌فرض</span>
                    )}
                  </div>
                  <p className="text-[11px] text-on-surface-muted mt-1">
                    {addr.province}، {addr.city}، {addr.address}
                  </p>
                  {addr.postalCode && (
                    <p className="text-[10px] text-on-surface-muted mt-0.5" dir="ltr">
                      کد پستی: {toPersianDigits(addr.postalCode)}
                    </p>
                  )}
                </div>
                <button onClick={() => deleteAddress(addr.id)} className="text-on-surface-muted hover:text-error">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-on-surface-muted text-center py-4">آدرسی ثبت نشده</p>
        )}
      </div>
      {/* Bookmarks */}
      <div className="bg-white rounded-[var(--radius-card)] border border-surface-container p-4 mb-4">
        <h3 className="text-sm font-bold mb-3">نشان‌شده‌ها</h3>
        <BookmarksList />
      </div>

      {/* Wallet + Gift Card */}
      <div className="bg-white rounded-[var(--radius-card)] border border-surface-container p-4 mb-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-bold">کیف پول</h3>
          <span className="text-lg font-bold text-primary">{formatPrice(user.walletBalance)}</span>
        </div>
        <div className="border-t border-surface-container pt-3">
          <p className="text-xs text-on-surface-muted mb-2">کارت هدیه دارید؟ کد رو وارد کنید:</p>
          <div className="flex gap-2">
            <input type="text" placeholder="کد کارت هدیه" value={giftCode}
              onChange={(e) => { setGiftCode(e.target.value.toUpperCase()); setGiftMsg(null); }}
              dir="ltr"
              className="flex-1 border border-surface-container rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-primary" />
            <Button variant="secondary" onClick={redeemGift} disabled={giftLoading || !giftCode.trim()}>
              {giftLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Gift className="w-4 h-4 ml-1" />شارژ</>}
            </Button>
          </div>
          {giftMsg && (
            <p className={`text-xs mt-2 ${giftMsg.ok ? "text-green-600" : "text-error"}`}>{giftMsg.text}</p>
          )}
        </div>
      </div>
      {/* Menu */}
      <div className="bg-white rounded-[var(--radius-card)] border border-surface-container mb-4">
        {[
          { label: "خرید اشتراک", icon: Crown, href: "/subscription" },
          { label: "فروشگاه", icon: Package, href: "/shop" },
          { label: "سفارشات من", icon: Package, href: "/orders" },
          { label: "معرفی به دوستان", icon: Share2, href: "/referral" },
          { label: "سوالات متداول", icon: HelpCircle, href: "/faq" },
        ].map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="flex items-center justify-between py-3.5 px-4 border-b border-surface-container last:border-0"
          >
            <div className="flex items-center gap-3">
              <item.icon className="w-4.5 h-4.5 text-primary" />
              <span className="text-sm">{item.label}</span>
            </div>
            <ChevronLeft className="w-4 h-4 text-on-surface-muted" />
          </Link>
        ))}
      </div>
{/* Footer */}
      <div className="text-center py-6">
        <p className="text-xs text-on-surface-muted mb-3">Made with 💙 in Iran</p>
        <div className="flex items-center justify-center gap-4">
          <a href="https://instagram.com/skatisho" target="_blank" className="text-on-surface-muted hover:text-primary transition-colors">
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>
          </a>
          <a href="https://t.me/skatisho" target="_blank" className="text-on-surface-muted hover:text-primary transition-colors">
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor"><path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/></svg>
          </a>
          <a href="https://linkedin.com/company/skatisho" target="_blank" className="text-on-surface-muted hover:text-primary transition-colors">
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
          </a>
        </div>
      </div>
      {/* Logout */}
      <button
        onClick={handleLogout}
        className="flex items-center justify-center gap-2 w-full py-3 text-error text-sm font-medium"
      >
        <LogOut className="w-4 h-4" />
        خروج از حساب
      </button>

      {/* Edit Modal */}
      {showEdit && (
        <div className="fixed inset-0 z-50 flex items-end justify-center">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowEdit(false)} />
          <div className="relative w-full max-w-lg bg-white rounded-t-2xl p-5 pb-24 animate-slide-up">
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-bold text-sm">ویرایش اطلاعات شخصی</h2>
              <button onClick={() => setShowEdit(false)}><X className="w-5 h-5" /></button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-[11px] text-on-surface-muted mb-1 block">نام و نام خانوادگی</label>
                <input type="text" value={editName} onChange={(e) => setEditName(e.target.value)}
                  className="w-full border border-surface-container rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-primary" />
              </div>
              <div>
                <label className="text-[11px] text-on-surface-muted mb-1 block">تاریخ تولد</label>
                <input type="date" value={editBirth} onChange={(e) => setEditBirth(e.target.value)}
                  className="w-full border border-surface-container rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-primary" />
              </div>
              <div>
                <label className="text-[11px] text-on-surface-muted mb-1 block">جنسیت</label>
                <div className="flex gap-3">
                  {GENDER_OPTIONS.map((g) => (
                    <button key={g.id} onClick={() => setEditGender(g.id)}
                      className={`flex-1 py-2.5 rounded-xl text-sm font-medium border-2 transition-colors ${
                        editGender === g.id ? "border-primary bg-primary/5" : "border-surface-container"
                      }`}>
                      {g.label}
                    </button>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] text-on-surface-muted mb-1 block">قد (cm)</label>
                  <input type="number" value={editHeight} onChange={(e) => setEditHeight(e.target.value)}
                    placeholder="۱۷۵"
                    className="w-full border border-surface-container rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-primary" />
                </div>
                <div>
                  <label className="text-[11px] text-on-surface-muted mb-1 block">وزن (kg)</label>
                  <input type="number" value={editWeight} onChange={(e) => setEditWeight(e.target.value)}
                    placeholder="۷۰"
                    className="w-full border border-surface-container rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-primary" />
                </div>
              </div>
            </div>
            <Button size="full" className="mt-5" onClick={saveProfile} disabled={saving}>
              {saving ? "ذخیره..." : (
                <><Save className="w-4 h-4 ml-2" /> ذخیره تغییرات</>
              )}
            </Button>
          </div>
        </div>
      )}

      {/* Address Modal */}
      {showAddressForm && (
        <div className="fixed inset-0 z-50 flex items-end justify-center">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowAddressForm(false)} />
          <div className="relative w-full max-w-lg bg-white rounded-t-2xl p-5 pb-24 animate-slide-up">
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-bold text-sm">آدرس جدید</h2>
              <button onClick={() => setShowAddressForm(false)}><X className="w-5 h-5" /></button>
            </div>
            <div className="space-y-3">
              <input type="text" placeholder="عنوان (مثلاً: خانه)" value={addrTitle}
                onChange={(e) => setAddrTitle(e.target.value)}
                className="w-full border border-surface-container rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-primary" />
              <div className="grid grid-cols-2 gap-3">
                <input type="text" placeholder="استان" value={addrProvince}
                  onChange={(e) => setAddrProvince(e.target.value)}
                  className="w-full border border-surface-container rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-primary" />
                <input type="text" placeholder="شهر" value={addrCity}
                  onChange={(e) => setAddrCity(e.target.value)}
                  className="w-full border border-surface-container rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-primary" />
              </div>
              <textarea placeholder="آدرس کامل" value={addrAddress}
                onChange={(e) => setAddrAddress(e.target.value)} rows={2}
                className="w-full border border-surface-container rounded-xl px-4 py-2.5 text-sm resize-none focus:outline-none focus:border-primary" />
              <div className="grid grid-cols-2 gap-3">
                <input type="text" placeholder="کد پستی" value={addrPostal}
                  onChange={(e) => setAddrPostal(e.target.value)}
                  className="w-full border border-surface-container rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-primary" />
                <input type="text" placeholder="تلفن تماس" value={addrPhone}
                  onChange={(e) => setAddrPhone(e.target.value)}
                  className="w-full border border-surface-container rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-primary" />
              </div>
            </div>
            <Button size="full" className="mt-5" onClick={saveAddress}
              disabled={!addrTitle.trim() || !addrProvince.trim() || !addrCity.trim() || !addrAddress.trim() || saving}>
              {saving ? "ذخیره..." : (
                <><MapPin className="w-4 h-4 ml-2" /> ذخیره آدرس</>
              )}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
