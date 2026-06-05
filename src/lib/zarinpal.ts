const SANDBOX = process.env.ZARINPAL_SANDBOX !== "false";
const MERCHANT = process.env.ZARINPAL_MERCHANT || "00000000-0000-0000-0000-000000000000";

const BASE_URL = SANDBOX
  ? "https://sandbox.zarinpal.com/pg/v4/payment"
  : "https://api.zarinpal.com/pg/v4/payment";

const START_PAY_URL = SANDBOX
  ? "https://sandbox.zarinpal.com/pg/StartPay"
  : "https://www.zarinpal.com/pg/StartPay";

interface PaymentRequest {
  amount: number; // toman
  description: string;
  callbackUrl: string;
  phone?: string;
}

interface PaymentResponse {
  authority: string;
  payUrl: string;
}

export async function requestPayment({
  amount,
  description,
  callbackUrl,
  phone,
}: PaymentRequest): Promise<PaymentResponse> {
  const res = await fetch(`${BASE_URL}/request.json`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      merchant_id: MERCHANT,
      amount: amount * 10, // zarinpal uses rial
      description,
      callback_url: callbackUrl,
      metadata: { mobile: phone },
    }),
  });

  const data = await res.json();

  if (data.data?.code === 100) {
    return {
      authority: data.data.authority,
      payUrl: `${START_PAY_URL}/${data.data.authority}`,
    };
  }

  throw new Error(data.errors?.message || "Payment request failed");
}

interface VerifyRequest {
  authority: string;
  amount: number; // toman
}

interface VerifyResponse {
  refId: number;
  cardPan: string;
}

export async function verifyPayment({
  authority,
  amount,
}: VerifyRequest): Promise<VerifyResponse> {
  const res = await fetch(`${BASE_URL}/verify.json`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      merchant_id: MERCHANT,
      amount: amount * 10,
      authority,
    }),
  });

  const data = await res.json();

  if (data.data?.code === 100 || data.data?.code === 101) {
    return {
      refId: data.data.ref_id,
      cardPan: data.data.card_pan || "",
    };
  }

  throw new Error(data.errors?.message || "Payment verification failed");
}
