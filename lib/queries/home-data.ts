import type { ProgramForHome } from "@/lib/services";

export const homeKeys = {
  all: ["home"] as const,
  data: () => [...homeKeys.all, "data"] as const,
};

export interface HomeData {
  type: "success" | "redirect";
  to?: string;
  activeProgram?: ProgramForHome;
  userPreferences?: {
    activeProgramId: string | null;
    activeProgramInstanceId: string | null;
    hasOnboarded: boolean;
  };
  isProgramComplete?: boolean;
  nextWorkout?: { programId: string; dayId: string } | null;
}

export async function fetchHomeData(options?: { baseUrl?: string; headers?: HeadersInit }): Promise<HomeData> {
  // On the server, we might need a full URL. On the client, relative is fine.
  const url = options?.baseUrl ? `${options.baseUrl}/api/home` : "/api/home";
  
  const res = await fetch(url, {
    headers: options?.headers,
  });
  
  if (!res.ok) {
    throw new Error("Failed to fetch home data");
  }
  
  return res.json();
}
