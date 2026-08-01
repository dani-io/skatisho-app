// Provider-agnostic SMS/OTP interface.
// A provider fully owns the OTP lifecycle for its channel: sending the code
// and later verifying it. Whether the code is generated/stored by us or by a
// remote gateway is an implementation detail hidden behind this interface.
export interface SmsProvider {
  sendOtp(phone: string): Promise<{ ok: boolean; error?: string }>;
  verifyOtp(phone: string, code: string): Promise<boolean>;
}
