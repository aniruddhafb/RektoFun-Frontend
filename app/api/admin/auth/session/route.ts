import { NextRequest, NextResponse } from "next/server";
import { ADMIN_SESSION_COOKIE, readAdminSession } from "@/app/lib/admin-auth";
import { ADMIN_WALLET } from "@/app/lib/admin";

export async function GET(req: NextRequest) {
  try {
    const session = readAdminSession(req.cookies.get(ADMIN_SESSION_COOKIE)?.value);
    const authenticated = session?.address === ADMIN_WALLET;
    return NextResponse.json({ authenticated, address: authenticated ? session.address : null });
  } catch {
    return NextResponse.json({ authenticated: false, address: null });
  }
}
