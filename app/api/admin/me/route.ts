import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin";

export async function GET(req: NextRequest) {
  const auth = await requireAdmin(req);
  return NextResponse.json({ isAdmin: auth.ok });
}
