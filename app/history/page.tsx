import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { auth } from "@/lib/auth";
import { getQueryClient } from "@/lib/get-query-client";
import { getHistoryQueryOptions } from "@/lib/queries/history";
import { HistoryClient } from "./client";

const HISTORY_LIMIT = 50;

export default async function HistoryPage() {
  const headersList = await headers();
  const session = await auth.api.getSession({ headers: headersList });

  if (!session?.user) {
    redirect("/login");
  }

  const queryClient = getQueryClient();
  const host = headersList.get("host") || "localhost:3000";
  const protocol = process.env.NODE_ENV === "development" ? "http" : "https";
  const baseUrl = `${protocol}://${host}`;

  // Prefetch history data on server
  await queryClient.prefetchQuery(
    getHistoryQueryOptions({
      baseUrl,
      headers: {
        cookie: headersList.get("cookie") || "",
      },
      limit: HISTORY_LIMIT,
    })
  );

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <HistoryClient />
    </HydrationBoundary>
  );
}
