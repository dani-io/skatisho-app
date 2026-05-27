# 🛼 اسکیتی‌شو — نسخه جدید

اپلیکیشن آموزش اسکیت | Next.js 16 + TypeScript + Tailwind v4 + PostgreSQL

---

## 🚀 شروع سریع

### پیش‌نیازها
- Node.js 20+
- Docker & Docker Compose
- فونت IRANSansX (فایل‌های woff2 را در `public/fonts/` قرار دهید)

### ۱. کلون و نصب
```bash
git clone <your-repo>
cd skatisho-app
cp .env.example .env
npm install
```

### ۲. دیتابیس
```bash
docker compose up db -d
npx prisma migrate dev --name init
npx prisma studio    # مشاهده دیتابیس (اختیاری)
```

### ۳. اجرا
```bash
npm run dev
```

---

## 📁 ساختار پروژه

```
src/
├── app/
│   ├── (auth)/          # ورود/ثبت‌نام (بدون bottom nav)
│   ├── (main)/          # صفحات اصلی (با bottom nav)
│   │   ├── courses/     # دوره‌ها
│   │   ├── profile/     # پروفایل
│   │   ├── wallet/      # کیف پول
│   │   ├── tickets/     # پشتیبانی
│   │   └── subscription/# اشتراک
│   └── api/             # API Routes
├── components/
│   ├── ui/              # Button, Input, ...
│   ├── layout/          # Bottom Nav, Header
│   ├── course/          # Course Card, List
│   └── player/          # Video Player
├── lib/                 # utils, db
├── hooks/               # Custom hooks
├── store/               # Zustand
└── types/               # TypeScript
```

## 🎨 فونت
فایل‌های woff2 فونت IRANSansX در: `public/fonts/`

## 🐳 Docker
```bash
docker compose up --build -d          # همه
docker compose up db -d               # فقط DB
```

## 📱 آیکون‌ PWA
```
public/icons/  →  icon-192.png, icon-512.png, logo.svg
```
