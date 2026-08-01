import { NextRequest, NextResponse } from "next/server";
import { createSession } from "@/lib/auth";
import { getSmsProvider } from "@/lib/sms";
import { db } from "@/lib/db";

export async function POST(req: NextRequest) {
  try {
    const { phone, code } = await req.json();

    // Validate
    if (!phone || !code) {
      return NextResponse.json(
        { error: "اطلاعات ناقص است" },
        { status: 400 }
      );
    }

    // Verify OTP via the selected provider
    const valid = await getSmsProvider().verifyOtp(phone, code);
    if (!valid) {
      return NextResponse.json(
        { error: "کد تأیید نادرست است" },
        { status: 401 }
      );
    }

    // Find or create user
    let user = await db.user.findUnique({ where: { phone } });

    if (!user) {
      const refCode = Array.from({length: 7}, () => "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"[Math.floor(Math.random() * 32)]).join("");
      user = await db.user.create({
        data: { phone, referralCode: refCode },
      });
    }

    // Create session
    // Track login
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || req.headers.get("x-real-ip") || "unknown";
    await db.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date(), lastLoginIp: ip },
    });
    await createSession(user.id, user.phone);

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        phone: user.phone,
        name: user.name,
        isNew: !user.name,
      },
    });
  } catch (error) {
    console.error("Verify OTP error:", error);
    return NextResponse.json(
      { error: "خطای سرور" },
      { status: 500 }
    );
  }
}
