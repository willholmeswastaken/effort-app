"use client";

import { useQuery } from "@tanstack/react-query";
import { homeKeys, fetchHomeData, type HomeData } from "./home-data";

export function useHomeData() {
  return useQuery<HomeData>({
    queryKey: homeKeys.data(),
    queryFn: () => fetchHomeData(),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}
