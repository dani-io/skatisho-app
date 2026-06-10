import { NextRequest, NextResponse } from "next/server";
import { verifyOTP, createSession } from "@/lib/auth";
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

    // Verify OTP
    const valid = verifyOTP(phone, code);
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
