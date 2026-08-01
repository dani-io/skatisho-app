import { NextRequest, NextResponse } from "next/server";
import { getSmsProvider } from "@/lib/sms";

export async function POST(req: NextRequest) {
  try {
    const { phone } = await req.json();

    // Validate phone (frontend submits the stored 09xxxxxxxxx form)
    if (!phone || !/^09\d{9}$/.test(phone)) {
      return NextResponse.json(
        { error: "شماره تلفن نامعتبر است" },
        { status: 400 }
      );
    }

    // Delegate the full send flow (generate/store/send) to the provider.
    const result = await getSmsProvider().sendOtp(phone);
    if (!result.ok) {
      if (result.error === "rate_limited") {
        return NextResponse.json(
          { error: "تعداد درخواست‌ها زیاد است. کمی صبر کنید" },
          { status: 429 }
        );
      }
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
