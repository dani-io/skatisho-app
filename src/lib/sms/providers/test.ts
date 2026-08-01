import type { SmsProvider } from "../types";
import { normalizePhone } from "../phone";

// Test provider: no real SMS is sent. This is the ONLY place in the entire
// codebase where the fixed code "123456" is accepted. It must never be
// selected in production (SMS_PROVIDER=test). selfhosted/kavenegar have no
// such backdoor.
export const testProvider: SmsProvider = {
  async sendOtp(phone: string) {
    const e164 = normalizePhone(phone);
    if (!e164) return { ok: false, error: "invalid_phone" };
    console.log(`📱 [sms:test] OTP for ${e164}: use 123456`);
    return { ok: true };
  },

  async verifyOtp(phone: string, code: string) {
    if (!normalizePhone(phone)) return false;
    return code === "123456";
  },
};
