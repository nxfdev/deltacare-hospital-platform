import { NextRequest, NextResponse } from "next/server";
import {
  executeGlobalSearch,
  getPublishedConditions,
} from "@/server/services/publicQueryService";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q") ?? "";
  const letter = searchParams.get("letter") ?? "";

  if (letter) {
    const conditions = getPublishedConditions({ letter });
    return NextResponse.json({
      ok: true,
      letter: letter.toUpperCase(),
      conditions,
    });
  }

  const results = executeGlobalSearch(q);
  return NextResponse.json({
    ok: true,
    query: q,
    results,
  });
}

