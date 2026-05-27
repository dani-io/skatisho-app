import { NextRequest, NextResponse } from "next/server";
import { generateOTP, storeOTP, sendSMS } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const { phone } = await req.json();

    // Validate phone
    if (!phone || !/^09\d{9}$/.test(phone)) {
      return NextResponse.json(
        { error: "شماره تلفن نامعتبر است" },
        { status: 400 }
      );
    }

    // Generate and store OTP
    const code = generateOTP();
    storeOTP(phone, code);

    // Send SMS
    const sent = await sendSMS(phone, code);
    if (!sent) {
      return NextResponse.json(
        { error: "خطا در ارسال پیامک" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { error: "خطای سرور" },
      { status: 500 }
    );
  }
}
