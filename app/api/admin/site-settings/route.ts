import { NextRequest, NextResponse } from "next/server";
import { ADMIN_WALLET } from "@/app/lib/admin";
import {
  ADMIN_SESSION_COOKIE,
  readAdminSession,
} from "@/app/lib/admin-auth";
import {
  readSiteSettings,
  writeSiteSettings,
} from "@/app/lib/site-settings-store";

function isAuthenticated(req: NextRequest) {
  const session = readAdminSession(req.cookies.get(ADMIN_SESSION_COOKIE)?.value);
  return session?.address === ADMIN_WALLET;
}

export async function GET(req: NextRequest) {
  if (!isAuthenticated(req)) {
    return NextResponse.json({ error: "Admin authentication required" }, { status: 401 });
  }
  return NextResponse.json(await readSiteSettings(), {
    headers: { "Cache-Control": "no-store, max-age=0" },
  });
}

export async function PATCH(req: NextRequest) {
  if (!isAuthenticated(req)) {
    return NextResponse.json({ error: "Admin authentication required" }, { status: 401 });
  }
  try {
    return NextResponse.json(await writeSiteSettings(await req.json()));
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Could not update site controls" },
      { status: 400 },
    );
  }
}
