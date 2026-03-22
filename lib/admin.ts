import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { eq } from "drizzle-orm";
import * as schema from "@/lib/db/schema";

export interface AdminSession {
  userId: string;
  user: { id: string; name: string; email: string; isAdmin: boolean };
}

export async function requireAdmin(req: NextRequest): Promise<
  | { ok: true; session: AdminSession }
  | { ok: false; response: NextResponse }
> {
  const session = await auth.api.getSession({ headers: req.headers });
  if (!session?.user) {
    return { ok: false, response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  }

  const [user] = await db
    .select({ isAdmin: schema.user.isAdmin })
    .from(schema.user)
    .where(eq(schema.user.id, session.user.id))
    .limit(1);

  if (!user?.isAdmin) {
    return { ok: false, response: NextResponse.json({ error: "Forbidden" }, { status: 403 }) };
  }

  return {
    ok: true,
    session: {
      userId: session.user.id,
      user: {
        id: session.user.id,
        name: session.user.name,
        email: session.user.email,
        isAdmin: true,
      },
    },
  };
}
