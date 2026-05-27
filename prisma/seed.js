const { PrismaClient } = require("@prisma/client");

const db = new PrismaClient();

async function main() {
  console.log("🌱 Seeding database...");

  // Coaches
  const coach1 = await db.coach.upsert({
    where: { id: "coach-mojtabi" },
    update: {},
    create: {
      id: "coach-mojtabi",
      name: "مجتبی احمدی",
      bio: "مربی اسکیت عمومی، با تجربه و باسابقه در آموزش اسکیت",
      specialty: "آموزش عمومی",
    },
  });

  const coach2 = await db.coach.upsert({
    where: { id: "coach-kimia" },
    update: {},
    create: {
      id: "coach-kimia",
      name: "کیمیا بروجردی",
      bio: "مربی اسکیت عمومی",
      specialty: "آموزش عمومی",
    },
  });

  const coach3 = await db.coach.upsert({
    where: { id: "coach-amirreza" },
    update: {},
    create: {
      id: "coach-amirreza",
      name: "امیررضا بحرینی مقدم",
      bio: "مربی اسکیت سرعت، اولین قهرمان اسکیت ایران در آسیا",
      specialty: "اسکیت سرعت",
    },
  });

  // Course 1: General Skating
  const course1 = await db.course.upsert({
    where: { id: "course-general" },
    update: {},
    create: {
      id: "course-general",
      title: "آموزش اسکیت عمومی (پایه)",
      description:
        "اگر تصمیم گرفته‌اید اسکیت را شروع کنید، مهم‌ترین مرحله‌ای که پیش رویتان است «آموزش اسکیت عمومی» است. در این بخش، پایه و اساس تمام مهارت‌های اسکیت محبوب آموزش داده می‌شود.",
      category: "GENERAL",
      level: "BEGINNER",
      coachId: "coach-mojtabi",
      order: 1,
      isPublished: true,
    },
  });

  // Chapters for Course 1
  const ch1 = await db.chapter.upsert({
    where: { id: "ch-general-1" },
    update: {},
    create: {
      id: "ch-general-1",
      title: "فصل ۱: آشنایی با اسکیت",
      order: 1,
      courseId: "course-general",
    },
  });

  const ch2 = await db.chapter.upsert({
    where: { id: "ch-general-2" },
    update: {},
    create: {
      id: "ch-general-2",
      title: "فصل ۲: مهارت‌های پایه",
      order: 2,
      courseId: "course-general",
    },
  });

  const ch3 = await db.chapter.upsert({
    where: { id: "ch-general-3" },
    update: {},
    create: {
      id: "ch-general-3",
      title: "فصل ۳: حرکت و کنترل",
      order: 3,
      courseId: "course-general",
    },
  });

  // Sample lessons
  const lessons = [
    { id: "l-1", title: "معرفی قطعات اسکیت", ch: "ch-general-1", order: 1, duration: 420, free: true },
    { id: "l-2", title: "انتخاب اسکیت مناسب", ch: "ch-general-1", order: 2, duration: 360, free: true },
    { id: "l-3", title: "نحوه پوشیدن اسکیت", ch: "ch-general-1", order: 3, duration: 300, free: false },
    { id: "l-4", title: "ایستادن صحیح روی اسکیت", ch: "ch-general-2", order: 1, duration: 480, free: false },
    { id: "l-5", title: "حفظ تعادل و کنترل بدن", ch: "ch-general-2", order: 2, duration: 540, free: false },
    { id: "l-6", title: "حرکت کردن اصولی", ch: "ch-general-2", order: 3, duration: 600, free: false },
    { id: "l-7", title: "ترمز گرفتن ایمن", ch: "ch-general-3", order: 1, duration: 450, free: false },
    { id: "l-8", title: "کنترل سرعت", ch: "ch-general-3", order: 2, duration: 390, free: false },
    { id: "l-9", title: "اجرای حرکات با اطمینان", ch: "ch-general-3", order: 3, duration: 510, free: false },
  ];

  for (const l of lessons) {
    await db.lesson.upsert({
      where: { id: l.id },
      update: {},
      create: {
        id: l.id,
        title: l.title,
        videoUrl: `/media/sample.mp4`,
        duration: l.duration,
        isFree: l.free,
        order: l.order,
        chapterId: l.ch,
      },
    });
  }

  // Course 2: Speed Skating
  await db.course.upsert({
    where: { id: "course-speed" },
    update: {},
    create: {
      id: "course-speed",
      title: "آموزش اسکیت سرعت",
      description:
        "اسکیت سرعت یکی از پرطرفدارترین و هیجان‌انگیزترین شاخه‌های اسکیت است. در این دوره، تکنیک‌های پایه و تخصصی اسکیت سرعت آموزش داده می‌شود.",
      category: "SPEED",
      level: "INTERMEDIATE",
      coachId: "coach-amirreza",
      order: 2,
      isPublished: true,
    },
  });

  // Subscription Plans
  const plans = [
    { id: "plan-monthly", title: "ماهانه", days: 30, price: 480000, original: null, order: 1 },
    { id: "plan-quarterly", title: "سه ماهه", days: 90, price: 790000, original: 1440000, order: 2 },
    { id: "plan-biannual", title: "شش ماهه", days: 180, price: 2016000, original: 2880000, order: 3 },
    { id: "plan-annual", title: "سالانه", days: 365, price: 2304000, original: 5760000, order: 4 },
  ];

  for (const p of plans) {
    await db.subscriptionPlan.upsert({
      where: { id: p.id },
      update: {},
      create: {
        id: p.id,
        title: p.title,
        durationDays: p.days,
        price: p.price,
        originalPrice: p.original,
        order: p.order,
      },
    });
  }

  console.log("✅ Seed complete!");
}

main()
  .catch(console.error)
  .finally(() => db.$disconnect());
