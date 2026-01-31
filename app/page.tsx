import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { HomeClient } from "./home-client";
import { getQueryClient } from "@/lib/get-query-client";
import { homeKeys } from "@/lib/queries/home-data";
import { getHomeDataDirect } from "@/lib/server/home-data";
import { dehydrate, HydrationBoundary } from "@tanstack/react-query";

export default async function HomePage() {
  const headersList = await headers();
  const session = await auth.api.getSession({ headers: headersList });

  if (!session?.user) {
    redirect("/login");
  }

  const queryClient = getQueryClient();

  // Fetch home data directly from services (no HTTP round-trip)
  const homeData = await getHomeDataDirect(session.user.id);

  // Handle redirects
  if (homeData.type === "redirect" && homeData.to) {
    redirect(homeData.to);
  }

  // Set the data directly in the query client cache
  queryClient.setQueryData(homeKeys.data(), homeData);


  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <HomeClient />
    </HydrationBoundary>
  );
}
