import { NextResponse } from "next/server";
import { deleteSession } from "@/lib/auth";
import { OAUTH_STATE_COOKIE } from "@/lib/google";

export async function POST() {
  await deleteSession();

  const res = NextResponse.json({ success: true });
  // The Google callback already clears this on both success and failure, but a
  // sign-in abandoned at the consent screen leaves one behind. Logout is the
  // natural place to sweep it up.
  res.cookies.delete(OAUTH_STATE_COOKIE);
  return res;
}
