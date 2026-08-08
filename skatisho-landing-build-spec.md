# Claude Code Build Spec — Skatisho Landing Page

> Give this whole file to Claude Code. It restructures routing so a public
> marketing landing lives at `/`, moves the current app home to `/app`, opens
> `/` in the auth gate, and builds the landing itself.
>
> **Work in phases. After each phase, verify before moving on. Do NOT skip the
> verification steps. Prisma stays v6. Do NOT reintroduce next-auth.**

---

## Context (read first)

The app is a Persian RTL skating-education PWA (Next.js 16 App Router, Tailwind
v4, jose auth, IRANSansX font Regular+Bold only, primary `#F5B800`).

Current routing (confirmed):
- `/` resolves through `src/app/(main)/page.tsx` — a **logged-in-user surface**
  (greets by name, subscription banner, course grid, MoodSelector). Useless to
  an anonymous visitor.
- `src/app/(main)/layout.tsx` wraps it with `BottomNav` (fires an authenticated
  `/api/tickets` fetch every 30s), `CartSync`, `InstallPrompt`, and caps width at
  `max-w-lg`.
- `src/proxy.ts` (Next 16 renamed middleware→proxy) redirects any request to `/`
  without a `skatisho-session` cookie to `/login`. `PUBLIC_PATHS = ["/login",
  "/verify", "/api/auth"]` matched by `startsWith`.
- `BottomNav` hardcodes the home tab to `href: "/"`.
- Fonts (IRANSansX 400/700) and theme (`#F5B800`) load globally via
  `src/app/globals.css` in the root layout, so they apply to any new route.

Goal end state:
- `/` → public marketing landing (new).
- `/app` → the current app home (moved).
- Logged-in user hitting `/` is redirected to `/app`.
- Everything else (`/courses`, `/shop`, `/profile`, …) unchanged.

---

## PHASE 1 — Move the current home to `/app` (no landing yet)

Do this first and confirm the app still works before touching the landing.

1. **Move the home page file.** Move `src/app/(main)/page.tsx` to
   `src/app/(main)/app/page.tsx` so it serves at `/app`. Keep it inside the
   `(main)` group so it keeps the BottomNav layout — a logged-in user in the app
   still wants the nav. Do not change its contents.

2. **Repoint the BottomNav home tab.** In the BottomNav component, change the
   home tab `href` from `"/"` to `"/app"`. Find every place it's hardcoded
   (there may be an active-state check comparing pathname to `"/"` — update that
   to `"/app"` too, so the home tab highlights correctly).

3. **Add the logged-in redirect.** A logged-in user who lands on `/` should go
   to `/app`. Where to do this: the landing page (built in Phase 3) will check
   for the `skatisho-session` cookie server-side and `redirect("/app")` if
   present. For now, just note this — don't build the landing yet. But DO make
   sure that after Phase 1, visiting `/app` while logged in shows the app home,
   and `/` still redirects to `/login` (the proxy hasn't changed yet).

**Verify Phase 1:**
- `npm run build` succeeds.
- Logged in, `/app` shows the old home (courses/subscription/etc.).
- The bottom-nav home tab points to `/app` and highlights when there.
- All other routes (`/courses`, `/shop`, `/profile`, `/coaches`, `/faq`) work.
- STOP and report before Phase 2.

---

## PHASE 2 — Open `/` in the auth gate (proxy)

**This is the security-sensitive step. Read carefully.**

`PUBLIC_PATHS` is matched with `startsWith`. Adding a bare `"/"` entry would make
`startsWith` match **every** path and disable the entire auth gate. So `/` must
be an **exact-match** exception, not a prefix entry.

1. In `src/proxy.ts`, keep `PUBLIC_PATHS = ["/login", "/verify", "/api/auth"]`
   using `startsWith` as-is.

2. Add a **separate exact-match check** for the root, e.g. a guard like:
   `if (pathname === "/") return NextResponse.next();`
   placed so it runs before the cookie/redirect logic. Do NOT add `"/"` to the
   `PUBLIC_PATHS` array. The exact-match must be `===`, never `startsWith`.

3. Leave the existing matcher (bypasses `_next/static`, `_next/image`,
   `favicon.ico`, `/api/upload`, `/api/auth/avatar`, file-extension paths,
   `/fonts`, `/icons`, `/images`) untouched — those already let the landing's
   assets and fonts load for anonymous visitors.

**Verify Phase 2 — critically:**
- Log OUT (clear the `skatisho-session` cookie). Visit `/` → you should NOT be
  redirected to `/login`; you should reach the root route (which is still the
  moved-away content or a placeholder until Phase 3 — that's fine, we're only
  testing the gate).
- Still logged out, visit a PROTECTED path like `/profile` → you MUST still be
  redirected to `/login`. If `/profile` is now reachable while logged out, the
  gate broke — you used a prefix instead of exact-match. Fix before continuing.
- Still logged out, visit `/courses` → still redirected to `/login`.
- Confirm API protection intact: route handlers still do their own auth
  (unchanged), so a public `/` does not weaken `/api/*`.
- STOP and report before Phase 3.

---

## PHASE 3 — Build the landing page

Now build the actual public landing at `/`.

### 3a. New route group + layout

Create a `(marketing)` route group with its own layout so the landing does NOT
inherit `(main)`'s BottomNav/CartSync/InstallPrompt/`max-w-lg`:

```
src/app/(marketing)/layout.tsx   ← minimal: no BottomNav, no CartSync,
                                    no InstallPrompt, no max-w-lg cap.
                                    Full-bleed; the page sets its own max-widths.
                                    Keep RTL + IRANSansX (inherited from root).
src/app/(marketing)/page.tsx     ← the landing itself (served at /)
```

Note on route-group collision: two groups can't both own `/`. The old `/` came
from `(main)/page.tsx`, which Phase 1 moved to `(main)/app/page.tsx`. So `(main)`
no longer has a root `page.tsx`, and `(marketing)/page.tsx` can own `/` cleanly.
Confirm there is no leftover `(main)/page.tsx`.

### 3b. Logged-in redirect

In `(marketing)/page.tsx` (a server component), read the `skatisho-session`
cookie. If present (and valid — reuse the existing jose verify helper if easy;
presence is acceptable if verify is awkward here), `redirect("/app")`. Anonymous
visitors see the landing. This is why the landing must be a server component at
the top level (it can still render client child components for interactivity).

### 3c. Content

Use the content document `skatisho-landing-content.md` (provided alongside this
spec) as the source of truth for all copy. Sections in order:

1. **Hero** — "اپلیکیشن اسکیتی‌شو" / "دستیار تمرین اسکیت" + description + two
   CTAs (primary: download/start; the "ورود به آکادمی" secondary is redundant
   here since logged-in users are redirected away — a single primary CTA is
   cleaner, your call).
2. **چرا اسکیتی‌شو** — feature cards. Merge "سرعت یادگیری" and "نقش مربیان
   باشگاهی" into these cards (confirmed).
3. **دو سبک آموزشی** — عمومی + سرعت.
4. **مربی‌ها** — DYNAMIC from the `Coach` model. Render name, avatar, specialty,
   bio. **Specialty mapping (confirmed): امیررضا بحرینی مقدم = سرعت; مجتبی احمدی
   = عمومی; کیمیا بروجردی = عمومی.** If the DB has Kimia as "speed", that's a
   data bug — the correct value is عمومی. Read from DB; don't hardcode the list.
5. **داستان رضا نظری** — "از تمسخر تا تحول". Full text in the content doc. This
   is the emotional signature of the page (see Design direction below).
6. **درباره اسکیتی‌شو** — platform intro + vision.
7. **معرفی به دوستان** — referral explanation.
8. **تأیید رسمی** — پارک علم و فناوری (logo placeholder).
9. **FAQ** — DYNAMIC from the `faq` model (same one the admin panel manages).
   Accordion. Read from DB; don't hardcode.
10. **CTA پایانی** — "هنوز قانع نشده‌ای؟" + download/start button.
11. **Footer** — quick links + brand line + social links (social links are
    DYNAMIC from the existing social-links admin data if easily available;
    otherwise leave the icons wired to config).

### 3d. Design direction (follow, don't template)

Brand is **yellow `#F5B800` + black + white**, RTL, IRANSansX (only 400 + 700 —
do NOT use font-weights 300/500/600, they don't exist; create hierarchy with
size, color, and the two available weights).

The design should NOT read as a generic template. Guidance:
- **Signature element = Reza Nazari's story.** It's the one memorable, emotional
  thing on the page — a champion who was mocked, fell, and built the app. Give it
  a distinctive treatment: e.g. a vertical timeline of turning-points (۱۳۸۷ first
  competition → ۹۱ championships → ۱۳۹۸ COVID → the app), or pulled-out quotes
  ("کسی نخندید", "من شدم رضا اسکیتی") set large in bold, with his photo. Spend the
  page's boldness here; keep other sections quiet and disciplined around it.
- The yellow is loud — use it deliberately as accent/section-anchor (like the
  current site's diagonal yellow shapes), not as a flat wash everywhere.
- Full-bleed sections with an inner max-width (~1100–1200px on desktop);
  mobile-first since most visitors are on phones.
- Motion: restrained. A scroll-reveal on the story timeline is enough; avoid
  scattered animations that read as AI-generated.
- Quality floor (non-negotiable): responsive to mobile, visible keyboard focus,
  `prefers-reduced-motion` respected, semantic headings, alt text on images.

Do NOT invent facts or stats. Use only the provided copy. Persian throughout,
sentence-appropriate register.

### 3e. Assets

- Coach avatars come from the DB (they already have avatars in the app).
- Reza Nazari's photo and the پارک علم و فناوری logo: use placeholders with clear
  `alt` text and a `TODO` comment noting the real image path is pending. Don't
  block the build on missing images.

**Verify Phase 3:**
- `npm run build` succeeds.
- Logged OUT, visit `/` → the landing renders fully (all 10 sections), no
  redirect to login, no 401 loop (no BottomNav ticket-polling), valid layout.
- Coaches section shows the real coaches from the DB with correct specialties
  (Kimia = عمومی).
- FAQ section shows the real FAQ entries from the DB.
- Logged IN, visit `/` → redirected to `/app`.
- Mobile viewport: layout holds, no horizontal scroll.
- All other routes still work.
- Report with a screenshot if possible.

---

## Out of scope (do NOT do)

- Do NOT touch the domain/DNS/Coolify config — that's handled separately.
- Do NOT build any admin CMS for the static landing copy (it's hardcoded by
  decision; coaches and FAQ stay dynamic via their existing admin panels).
- Do NOT change Prisma version, auth mechanism, or unrelated routes.
- Do NOT add font weights beyond 400/700.

## Final report

After Phase 3, report: files added/moved, the exact proxy change (show the
diff of the root exact-match), confirmation the auth gate still protects
`/profile` while logged out, and any TODOs (e.g. Reza's photo, park logo).
