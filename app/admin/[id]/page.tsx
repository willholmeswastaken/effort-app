import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { eq } from "drizzle-orm";
import * as schema from "@/lib/db/schema";
import { AdminEditorClient } from "./client";

export default async function AdminProgramPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
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

  // Fetch program with weeks for initial data
  const program = await db.query.programs.findFirst({
    where: eq(schema.programs.id, id),
    with: {
      weeks: {
        orderBy: (weeks, { asc }) => [asc(weeks.weekNumber)],
        columns: {
          id: true,
          weekNumber: true,
        },
      },
    },
  });

  if (!program) {
    redirect("/admin");
  }

  return (
    <AdminEditorClient
      program={{
        id: program.id,
        name: program.name,
        description: program.description,
        daysPerWeek: program.daysPerWeek,
        weeks: program.weeks,
      }}
    />
  );
}
