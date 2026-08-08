import { CtaLink, Eyebrow, Section, SectionHeading } from "./ui";

/* ------------------------------------------------------------------ Hero */

export function Hero() {
  return (
    <section className="relative overflow-hidden bg-surface px-5 pt-16 pb-20 md:pt-24 md:pb-28">
      {/* Decorative diagonal wedge — the brand's yellow used as an anchor, not a wash. */}
      <div className="pointer-events-none absolute inset-0" aria-hidden="true">
        <div className="absolute -top-40 end-[-20%] h-[640px] w-[640px] bg-primary/20 [clip-path:polygon(30%_0,100%_0,100%_70%)]" />
        <div className="absolute top-24 end-[-10%] h-[420px] w-[420px] bg-primary/40 [clip-path:polygon(60%_0,100%_0,100%_45%)]" />
      </div>

      <div className="relative mx-auto w-full max-w-[1100px]">
        <Eyebrow>اولین اپلیکیشن ایرانی آموزش اسکیت</Eyebrow>

        <h1 className="max-w-3xl text-4xl leading-[1.15] font-bold md:text-6xl">
          اپلیکیشن اسکیتی‌شو
        </h1>

        <p className="mt-4 inline-block bg-primary px-3 py-1 text-xl font-bold text-on-surface md:text-2xl">
          دستیار تمرین اسکیت
        </p>

        <p className="mt-8 max-w-2xl text-base leading-loose text-on-surface-muted md:text-lg">
          اسکیتی‌شو یک ابزار کمک‌آموزشی اسکیت است که کنار تمرین‌های شما قرار
          می‌گیرد تا مسیر یادگیری اسکیت شفاف‌تر، منظم‌تر و سریع‌تر طی شود.
        </p>

        <div className="mt-10 flex flex-wrap items-center gap-4">
          <CtaLink href="/login">شروع کن</CtaLink>
          <a
            href="#story"
            className="inline-flex items-center rounded-[var(--radius-button)] px-4 py-4 text-base font-bold text-on-surface underline decoration-primary decoration-2 underline-offset-8 transition-colors hover:text-primary-dark focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
          >
            داستان اسکیتی‌شو را بخوانید
          </a>
        </div>
      </div>
    </section>
  );
}

/* -------------------------------------------------------------- Features */

const FEATURES = [
  {
    n: "۰۱",
    title: "آموزش با دو مربی",
    body: "یادگیری اسکیت با دو سبک آموزشی؛ هر درس توسط دو مربی آموزش داده شده تا تمرین‌ها دقیق‌تر و کامل‌تر انجام شوند.",
  },
  {
    n: "۰۲",
    title: "پشتیبانی تخصصی داخل اپ",
    body: "در هر بخش یا حرکت که به راهنمایی نیاز داشتید، با ارسال تیکت با مربیان نخبه در ارتباط باشید. پاسخ می‌تواند همراه با ویدیوی اختصاصی باشد.",
  },
  {
    n: "۰۳",
    title: "سرعت یادگیری بیشتر",
    body: "تمرین خارج از باشگاه، مرور هدفمند آموزش‌ها و رفع اشکال از طریق پشتیبانی فعال، مسیر پیشرفت را منظم‌تر و مؤثرتر می‌کند.",
  },
  {
    n: "۰۴",
    title: "مکمل مربی باشگاه",
    body: "اسکیتی‌شو جایگزین باشگاه نیست؛ مکمل تمرین‌های مربی باشگاه شماست و مسیر تمرین‌ها را شفاف، منظم و هدفمند می‌کند.",
  },
];

export function Features() {
  return (
    <Section id="features" className="bg-surface-dim">
      <SectionHeading
        title="چرا اسکیتی‌شو؟"
        subtitle="همراه شما در مسیر یادگیری سریع‌تر و اصولی‌تر اسکیت"
      />

      <ul className="grid gap-5 md:grid-cols-2">
        {FEATURES.map((f) => (
          <li
            key={f.n}
            className="rounded-[var(--radius-card)] border-s-4 border-primary bg-surface p-6 md:p-8"
          >
            <span className="text-sm font-bold text-primary-dark">{f.n}</span>
            <h3 className="mt-3 text-xl font-bold">{f.title}</h3>
            <p className="mt-3 text-sm leading-loose text-on-surface-muted md:text-base">
              {f.body}
            </p>
          </li>
        ))}
      </ul>
    </Section>
  );
}

/* ---------------------------------------------------------------- Styles */

export function TrainingStyles() {
  return (
    <Section id="styles">
      <SectionHeading title="یادگیری اسکیت با دو سبک آموزشی" />

      <div className="grid gap-6 md:grid-cols-2">
        <article className="rounded-[var(--radius-card)] bg-surface-dim p-7 md:p-9">
          <h3 className="text-2xl font-bold">آموزش اسکیت عمومی</h3>
          <div className="mt-4 h-1 w-12 rounded-full bg-primary" aria-hidden="true" />
          <p className="mt-6 text-sm leading-loose text-on-surface-muted md:text-base">
            اسکیتی‌شو در بخش آموزش‌های عمومی از دو مربی باتجربه‌ی کشور استفاده
            می‌کند: آقای مجتبی احمدی و خانم کیمیا بروجردی، مربیان حرفه‌ای با
            سابقه‌ی طولانی در اسکیت ایران.
          </p>
          <p className="mt-4 text-sm leading-loose text-on-surface-muted md:text-base">
            تمرین‌ها بر اساس یک برنامه‌ی گام‌به‌گام و اصولی طراحی شده‌اند و هر
            درس توسط هر دو مربی آموزش داده شده است.
          </p>
        </article>

        <article className="rounded-[var(--radius-card)] bg-black p-7 text-white md:p-9">
          <h3 className="text-2xl font-bold">آموزش اسکیت سرعت</h3>
          <div className="mt-4 h-1 w-12 rounded-full bg-primary" aria-hidden="true" />
          <p className="mt-6 text-sm leading-loose text-white/70 md:text-base">
            در بخش اسکیت سرعت، از مربی محبوب و قهرمان برجسته‌ی ایران و آسیا،
            امیررضا بحرینی مقدم بهره برده‌ایم.
          </p>
          <p className="mt-4 text-sm leading-loose text-white/70 md:text-base">
            تمرین‌ها و برنامه‌های این بخش مسیر پیشرفت شما را کوتاه‌تر و
            هدفمندتر می‌کنند تا سریع‌تر به مهارت‌های شاخص در اسکیت سرعت دست پیدا
            کنید.
          </p>
        </article>
      </div>
    </Section>
  );
}

/* ----------------------------------------------------------------- About */

export function About() {
  return (
    <Section id="about" className="bg-surface-dim">
      <SectionHeading title="درباره اسکیتی‌شو" />

      <div className="grid gap-10 md:grid-cols-[1.5fr_1fr]">
        <div className="space-y-5 text-sm leading-loose text-on-surface-muted md:text-base">
          <p>
            اسکیتی‌شو یک پلتفرم تخصصی آموزش آنلاین اسکیت است که به‌عنوان ابزار
            کمکی برای مربیان و باشگاه‌ها طراحی شده تا مسیر یادگیری ورزشکاران را
            ساختارمند و سریع‌تر کند. این اپلیکیشن، تنها برنامه‌ی کمک‌آموزشی
            ویدئویی اسکیت به زبان فارسی است و امکان آموزش مرحله‌به‌مرحله در
            شاخه‌های مختلف اسکیت را فراهم می‌کند.
          </p>
          <p>
            برای مربیان و باشگاه‌ها، اسکیتی‌شو ابزاری است برای تمرین، پیگیری
            پیشرفت ورزشکاران، رفع اشکال و ارتقای مهارت‌ها خارج از زمان تمرین
            حضوری، تا ورزشکاران سریع‌تر به شاخه‌های تخصصی برسند.
          </p>
          <p>
            همزمان، این اپلیکیشن برای ورزشکارانی که به هر دلیل امکان حضور در
            باشگاه ندارند نیز یک مسیر یادگیری کامل فراهم می‌کند تا بدون محدودیت
            جغرافیایی یا زمانی بتوانند مهارت‌های خود را ارتقا دهند.
          </p>
          <p>
            محتوای آموزشی به‌صورت گام‌به‌گام توسط مربیان باتجربه تهیه شده و
            سیستم پشتیبانی فعال نیز امکان پرسش و پاسخ مستقیم را برای ورزشکاران
            فراهم می‌کند، تا تجربه‌ای نزدیک به حضور در کلاس حضوری داشته باشند.
          </p>
          <p>
            ایده‌ی شکل‌گیری اسکیتی‌شو در دوران همه‌گیری کرونا شکل گرفت و پس از
            سه سال طراحی و توسعه، امروز به‌عنوان یک برنامه‌ی نوآورانه در پارک
            علم و فناوری وارد مرحله‌ی رشد شده است.
          </p>
        </div>

        <aside className="h-fit rounded-[var(--radius-card)] bg-primary p-7 md:p-8">
          <h3 className="text-sm font-bold tracking-[0.2em] text-on-surface/70">
            چشم‌انداز
          </h3>
          <p className="mt-4 text-base leading-loose font-bold text-on-surface md:text-lg">
            ایجاد یک مسیر آموزشی استاندارد و منسجم برای مربیان و ورزشکاران، که
            از سطح پایه تا شاخه‌های تخصصی را پوشش دهد و آموزش اسکیت در ایران را
            حرفه‌ای‌تر و فراگیرتر کند.
          </p>
        </aside>
      </div>
    </Section>
  );
}

/* -------------------------------------------------------------- Referral */

export function Referral() {
  return (
    <Section id="referral">
      <SectionHeading title="معرفی به دوستان" />

      <div className="grid gap-6 md:grid-cols-2">
        <p className="text-sm leading-loose text-on-surface-muted md:text-base">
          اپلیکیشن را به دوستان خود معرفی کنید و از مزایای آن بهره‌مند شوید. با
          اولین شارژ دوستتان، او تخفیف دریافت می‌کند و همزمان کیف پول شما نیز
          برای خریدهای آینده شارژ می‌شود. یک معرفی ساده، یک سود دوطرفه.
        </p>

        <div className="rounded-[var(--radius-card)] border-2 border-primary/40 p-6 md:p-7">
          <h3 className="text-base font-bold">ویژه‌ی مربیان</h3>
          <p className="mt-3 text-sm leading-loose text-on-surface-muted">
            مربیانی که تمایل دارند کد تخفیف اختصاصی برای ورزشکاران خود داشته
            باشند، می‌توانند برای هماهنگی و دریافت کد اختصاصی با مدیریت مجموعه
            در ارتباط باشند.
          </p>
        </div>
      </div>
    </Section>
  );
}

/* ----------------------------------------------------------- Endorsement */

export function Endorsement() {
  return (
    <Section className="bg-surface-dim">
      <div className="grid items-center gap-10 md:grid-cols-[auto_1fr]">
        {/*
          TODO: replace with the real پارک علم و فناوری هرمزگان logo once the
          asset is provided (drop it in /public/images and swap this block for
          an <img>). Placeholder kept non-blocking so the build never depends
          on a missing file.
        */}
        <div
          className="flex h-32 w-32 shrink-0 items-center justify-center rounded-[var(--radius-card)] border-2 border-dashed border-on-surface/25 bg-surface p-4 text-center text-xs leading-relaxed text-on-surface-muted"
          role="img"
          aria-label="لوگوی پارک علم و فناوری هرمزگان"
        >
          لوگوی پارک علم و فناوری
        </div>

        <div>
          <h2 className="text-2xl font-bold md:text-3xl">تأیید و حمایت رسمی</h2>
          <div className="mt-4 h-1 w-16 rounded-full bg-primary" aria-hidden="true" />
          <p className="mt-6 max-w-2xl text-sm leading-loose text-on-surface-muted md:text-base">
            اسکیتی‌شو با ایده‌ی خلاقانه‌ی خود در حوزه‌ی آموزش آنلاین اسکیت،
            به‌عنوان اولین اپلیکیشن کمک‌آموزشی ایرانی در این رشته، وارد پارک علم
            و فناوری شد و تحت حمایت این مرکز، مسیر رشد و توسعه‌ی خود را ادامه
            می‌دهد.
          </p>
        </div>
      </div>
    </Section>
  );
}

/* ------------------------------------------------------------- Final CTA */

export function FinalCta() {
  return (
    <section className="bg-primary px-5 py-20 md:py-24">
      <div className="mx-auto w-full max-w-[1100px]">
        <h2 className="text-3xl leading-tight font-bold md:text-5xl">
          هنوز قانع نشده‌ای؟
        </h2>
        <p className="mt-6 max-w-2xl text-base leading-loose text-on-surface/80 md:text-lg">
          اگر هنوز برای شروع مردد هستی، کافی است یک بار تمرین‌ها را امتحان کنی.
          ساختار مرحله‌به‌مرحله، همراهی مربیان حرفه‌ای و پشتیبانی فعال باعث
          می‌شود مسیر پیشرفتت شفاف و قابل اندازه‌گیری باشد. اسکیتی‌شو جایگزین
          باشگاه نیست؛ مکملی است که کمک می‌کند سریع‌تر، دقیق‌تر و با اطمینان
          بیشتری پیش بروی.
        </p>
        <div className="mt-10">
          {/* Black on the yellow band — the one place the CTA inverts. */}
          <CtaLink href="/login" className="bg-black text-white hover:bg-on-surface">
            همین حالا شروع کن
          </CtaLink>
        </div>
      </div>
    </section>
  );
}
