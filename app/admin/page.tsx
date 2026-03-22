import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { eq } from "drizzle-orm";
import * as schema from "@/lib/db/schema";
import { AdminClient } from "./client";

export default async function AdminPage() {
  const headersList = await headers();
  const session = await auth.api.getSession({ headers: headersList });

  if (!session?.user) {
    redirect("/login");
  }

  const [user] = await db
    .select({ isAdmin: schema.user.isAdmin })
    .from(schema.user)
    .where(eq(schema.user.id, session.user.id))
    .limit(1);

  if (!user?.isAdmin) {
    redirect("/");
  }

  return <AdminClient />;
}
