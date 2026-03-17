"use client";

import { useQuery } from "@tanstack/react-query";
import { homeKeys, fetchHomeData, type HomeData } from "./home-data";

export function useHomeData() {
  return useQuery<HomeData>({
    queryKey: homeKeys.data(),
    queryFn: () => fetchHomeData(),
    staleTime: 60 * 1000, // Keep home data fresh without forcing full reload UX on every visit
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });
}
