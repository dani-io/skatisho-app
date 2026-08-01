// In-memory OTP store, reused from the original lib/auth.ts approach.
// Only providers where the APP owns the code (currently: kavenegar) use this.
// The selfhosted gateway is stateful and does NOT touch this store.
// NOTE: per-process only — swap for Redis if running multiple instances.
type Entry = { code: string; expires: number; attempts: number };

const store = new Map<string, Entry>();

const TTL_MS = 2 * 60 * 1000; // 2 minutes, matches previous behavior
const MAX_ATTEMPTS = 5;

export function generateCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export function saveCode(phone: string, code: string): void {
  store.set(phone, { code, expires: Date.now() + TTL_MS, attempts: 0 });
}

export function checkCode(phone: string, code: string): boolean {
  const entry = store.get(phone);
  if (!entry) return false;

  if (Date.now() > entry.expires) {
    store.delete(phone);
    return false;
  }
  if (entry.attempts >= MAX_ATTEMPTS) {
    store.delete(phone);
    return false;
  }

  entry.attempts++;
  if (entry.code !== code) return false;

  store.delete(phone);
  return true;
}
