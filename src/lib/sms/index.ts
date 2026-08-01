import type { SmsProvider } from "./types";
import { testProvider } from "./providers/test";
import { selfhostedProvider } from "./providers/selfhosted";
import { kavenegarProvider } from "./providers/kavenegar";

export type { SmsProvider } from "./types";
export { normalizePhone } from "./phone";

// Selected at runtime by SMS_PROVIDER (test | selfhosted | kavenegar).
// Defaults to selfhosted — never to `test` — so an unset/typo'd env can never
// silently enable the 123456 code path in production.
export function getSmsProvider(): SmsProvider {
  switch (process.env.SMS_PROVIDER) {
    case "test":
      return testProvider;
    case "kavenegar":
      return kavenegarProvider;
    case "selfhosted":
      return selfhostedProvider;
    default:
      if (process.env.SMS_PROVIDER) {
        console.warn(
          `[sms] unknown SMS_PROVIDER="${process.env.SMS_PROVIDER}", falling back to selfhosted`
        );
      }
      return selfhostedProvider;
  }
}
