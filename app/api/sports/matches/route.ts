import { NextRequest, NextResponse } from "next/server";
import { getWorldCupFixtures } from "@/app/lib/sports-service/football";

export async function GET(req: NextRequest) {
  const competitionIdParam = req.nextUrl.searchParams.get("competitionId");
  const competitionId = competitionIdParam ? Number(competitionIdParam) : undefined;

  try {
    const fixtures = await getWorldCupFixtures(competitionId);
    return NextResponse.json(fixtures);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
