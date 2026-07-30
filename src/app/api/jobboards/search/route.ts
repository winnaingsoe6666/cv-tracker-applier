import { NextRequest, NextResponse } from "next/server";
import { apiUserId } from "@/lib/session";
import { searchAllBoards, searchLinkedIn, searchJobStreet } from "@/lib/jobboards";

export async function GET(req: NextRequest) {
  const userId = await apiUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const query = searchParams.get("q") ?? "";
  const location = searchParams.get("location") ?? undefined;
  const market = searchParams.get("market") ?? undefined;
  const seniority = searchParams.get("seniority") ?? undefined;
  const board = searchParams.get("board") ?? "all"; // all | linkedin | jobstreet
  const page = Number(searchParams.get("page") ?? "1");
  const limit = Number(searchParams.get("limit") ?? "20");

  if (!query.trim()) {
    return NextResponse.json({ error: "Query (q) is required" }, { status: 400 });
  }

  const params = { query, location, market, seniority, page, limit };

  let result;
  switch (board) {
    case "linkedin":
      result = await searchLinkedIn(params);
      break;
    case "jobstreet":
      result = await searchJobStreet(params);
      break;
    default:
      result = await searchAllBoards(params);
  }

  return NextResponse.json(result);
}
