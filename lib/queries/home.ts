"use client";

import { useQuery } from "@tanstack/react-query";
import { homeKeys, fetchHomeData, type HomeData } from "./home-data";

export function useHomeData() {
  return useQuery<HomeData>({
    queryKey: homeKeys.data(),
    queryFn: () => fetchHomeData(),
    staleTime: 0, // Always consider data stale to ensure fresh state on navigation
    refetchOnWindowFocus: true,
    refetchOnMount: true,
  });
}
