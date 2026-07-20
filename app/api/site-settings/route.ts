import { NextResponse } from "next/server";
import { readSiteSettings } from "@/app/lib/site-settings-store";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json(await readSiteSettings(), {
    headers: { "Cache-Control": "no-store, max-age=0" },
  });
}
