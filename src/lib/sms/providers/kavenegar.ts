import type { SmsProvider } from "../types";
import { normalizePhone } from "../phone";
import { generateCode, saveCode, checkCode } from "../store";

// ⚠️ UNTESTED — DEFERRED PROVIDER.
// SMS_KAVENEGAR_KEY is empty and this path will not run yet. It is implemented
// only so a later env switch (SMS_PROVIDER=kavenegar) works without code
// changes. Unlike selfhosted, here the APP owns the code: we generate + store
// it (see ../store, with expiry + attempt limits) and verify against our own
// store. Kavenegar only relays the SMS.
export const kavenegarProvider: SmsProvider = {
  async sendOtp(phone: string) {
    const e164 = normalizePhone(phone);
    if (!e164) return { ok: false, error: "invalid_phone" };

    const key = process.env.SMS_KAVENEGAR_KEY;
    if (!key) return { ok: false, error: "not_configured" };

    const code = generateCode();
    saveCode(e164, code);

    try {
      // Kavenegar verifyLookup. NOTE (untested): Kavenegar's `receptor`
      // traditionally expects the local 09xxxxxxxxx form; adjust if the real
      // account rejects E.164.
      const receptor = e164.replace(/^\+98/, "0");
      const url =
        `https://api.kavenegar.com/v1/${key}/verify/lookup.json` +
        `?receptor=${encodeURIComponent(receptor)}` +
        `&token=${encodeURIComponent(code)}` +
        `&template=skatisho-verify`;
      const res = await fetch(url, { method: "POST" });
      if (!res.ok) return { ok: false, error: `gateway_error_${res.status}` };
      return { ok: true };
    } catch {
      return { ok: false, error: "gateway_unreachable" };
    }
  },

  async verifyOtp(phone: string, code: string) {
    const e164 = normalizePhone(phone);
    if (!e164) return false;
    // Verified against our own store — no backdoor code.
    return checkCode(e164, code);
  },
};
