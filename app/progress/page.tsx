import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { auth } from "@/lib/auth";
import { getQueryClient } from "@/lib/get-query-client";
import {
  getInsightsSummaryQueryOptions,
  getLoggedExercisesQueryOptions,
} from "@/lib/queries/insights";
import { ProgressClient } from "./client";

export default async function ProgressPage() {
  const headersList = await headers();
  const session = await auth.api.getSession({ headers: headersList });

  if (!session?.user) {
    redirect("/login");
  }

  const queryClient = getQueryClient();
  const host = headersList.get("host") || "localhost:3000";
  const protocol = process.env.NODE_ENV === "development" ? "http" : "https";
  const baseUrl = `${protocol}://${host}`;

  const fetchOptions = {
    baseUrl,
    headers: {
      cookie: headersList.get("cookie") || "",
    },
  };

  // Prefetch both insights summary and logged exercises in parallel
  await Promise.all([
    queryClient.prefetchQuery(getInsightsSummaryQueryOptions(fetchOptions)),
    queryClient.prefetchQuery(getLoggedExercisesQueryOptions(fetchOptions)),
  ]);

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <ProgressClient />
    </HydrationBoundary>
  );
}
