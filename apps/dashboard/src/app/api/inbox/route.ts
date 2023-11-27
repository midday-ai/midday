import { NextResponse } from "next/server";

export const preferredRegion = "fra1";
export const runtime = "edge";

export async function POST(req, res) {
  return NextResponse.json({ ok: true });
}
