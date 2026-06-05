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
  Ruler,
  Weight,
  Cake,
  Heart,
  ShoppingBag,
  TrendingUp,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { toPersianDigits, formatPrice } from "@/lib/utils";

interface UserData {
  id: string;
  phone: string;
  name: string | null;
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
        <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center mb-3">
          <span className="text-3xl font-bold text-primary">
            {user.name?.charAt(0) || "؟"}
          </span>
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

      {/* Menu */}
      <div className="bg-white rounded-[var(--radius-card)] border border-surface-container mb-4">
        {[
          { label: "خرید اشتراک", icon: Crown, href: "/subscription" },
          { label: "فروشگاه", icon: ShoppingBag, href: "/shop" },
          { label: "کیف پول", icon: TrendingUp, href: "/wallet" },
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
          <div className="relative w-full max-w-lg bg-white rounded-t-2xl p-5 pb-8 animate-slide-up">
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
          <div className="relative w-full max-w-lg bg-white rounded-t-2xl p-5 pb-8 animate-slide-up">
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
