"use client";

import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { historyKeys, fetchWorkoutHistory } from "@/lib/queries/history";
import type { WorkoutHistoryEntry } from "@/lib/services";

const HISTORY_LIMIT = 50;

function formatDate(date: Date | string) {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

function formatTime(seconds: number | null) {
  if (!seconds) return "—";
  const m = Math.floor(seconds / 60);
  return `${m}m`;
}

export function HistoryClient() {
  const { data: logs = [], isLoading, error } = useQuery<WorkoutHistoryEntry[]>({
    queryKey: historyKeys.list(HISTORY_LIMIT),
    queryFn: () => fetchWorkoutHistory({ limit: HISTORY_LIMIT }),
  });

  return (
    <div className="min-h-screen bg-black text-white pb-20">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-black/80 backdrop-blur-lg border-b border-white/5">
        <div className="flex items-center h-14 px-4">
          <Link href="/" className="p-2 -ml-2">
            <ChevronLeft className="w-6 h-6" />
          </Link>
          <h1 className="flex-1 text-center text-[17px] font-semibold">History</h1>
          <div className="w-10" />
        </div>
      </header>

      <div className="px-4 py-6">
        {isLoading ? (
          <HistorySkeleton />
        ) : error ? (
          <div className="text-center py-16">
            <p className="text-[15px] text-[#FF3B30]">Failed to load history</p>
            <p className="text-[13px] text-[#8E8E93] mt-1">Please try again later</p>
          </div>
        ) : logs.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-[15px] text-[#8E8E93]">No sessions yet</p>
          </div>
        ) : (
          <div className="bg-[#1C1C1E] rounded-2xl overflow-hidden">
            {logs.map((log, index) => (
              <Link key={log.id} href={`/history/${log.id}`}>
                <div
                  className={`flex items-center px-4 py-3.5 active:bg-white/5 ${
                    index > 0 ? "border-t border-white/5" : ""
                  }`}
                >
                  {/* Icon */}
                  <div className="w-10 h-10 rounded-full bg-[#3A3A3C] flex items-center justify-center mr-4 text-lg">
                    <span role="img" aria-label="workout">
                      🏋️
                    </span>
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <p className="text-[15px] font-medium truncate">{log.dayTitle}</p>
                    <p className="text-[13px] text-[#8E8E93]">
                      {formatDate(log.startedAt)}
                    </p>
                  </div>

                  {/* Meta */}
                  <div className="text-right mr-2">
                    <p className="text-[15px] text-[#8E8E93]">
                      {formatTime(log.durationSeconds)}
                    </p>
                  </div>

                  <ChevronRight className="w-5 h-5 text-[#3A3A3C]" />
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function HistorySkeleton() {
  return (
    <div className="bg-[#1C1C1E] rounded-2xl overflow-hidden">
      {Array.from({ length: 5 }).map((_, i) => (
        <div
          key={i}
          className={`flex items-center px-4 py-3.5 ${
            i > 0 ? "border-t border-white/5" : ""
          }`}
        >
          <div className="w-10 h-10 rounded-full bg-[#3A3A3C] animate-pulse mr-4" />
          <div className="flex-1">
            <div className="h-4 w-32 bg-[#3A3A3C] rounded animate-pulse mb-2" />
            <div className="h-3 w-20 bg-[#3A3A3C] rounded animate-pulse" />
          </div>
          <div className="h-4 w-8 bg-[#3A3A3C] rounded animate-pulse mr-2" />
        </div>
      ))}
    </div>
  );
}
