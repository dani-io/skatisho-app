import type { SmsProvider } from "../types";
import { normalizePhone } from "../phone";

// Self-hosted LAN gateway. It is FULLY STATEFUL: it generates, stores, and
// verifies the code itself. This adapter is a thin proxy and must NOT generate
// or store any code — it delegates everything.
function config() {
  const url = process.env.SMS_SELFHOSTED_URL;
  const key = process.env.SMS_SELFHOSTED_KEY;
  return { url, key };
}

export const selfhostedProvider: SmsProvider = {
  async sendOtp(phone: string) {
    const e164 = normalizePhone(phone);
    if (!e164) return { ok: false, error: "invalid_phone" };

    const { url, key } = config();
    if (!url) return { ok: false, error: "not_configured" };

    try {
      const res = await fetch(`${url}/otp/send`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${key ?? ""}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ phone: e164, template: "کد تایید: {code}" }),
      });

      if (res.status === 200) return { ok: true };
      if (res.status === 429) return { ok: false, error: "rate_limited" };
      return { ok: false, error: `gateway_error_${res.status}` };
    } catch {
      return { ok: false, error: "gateway_unreachable" };
    }
  },

  async verifyOtp(phone: string, code: string) {
    const e164 = normalizePhone(phone);
    if (!e164) return false;

    const { url, key } = config();
    if (!url) return false;

    try {
      const res = await fetch(`${url}/otp/verify`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${key ?? ""}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ phone: e164, code }),
      });

      // 200 {status:"verified"} -> true ; 400/410/429 -> false
      if (res.status !== 200) return false;
      const data = (await res.json().catch(() => null)) as {
        status?: string;
      } | null;
      return data?.status === "verified";
    } catch {
      return false;
    }
  },
};
