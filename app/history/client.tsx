"use client";

import Link from "next/link";
import { ChevronRight, Loader2, Star } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { historyKeys, fetchWorkoutHistory } from "@/lib/queries/history";
import { formatDuration } from "@/lib/utils";
import { AnimateIn } from "@/components/animate-in";
import type { WorkoutHistoryEntry } from "@/lib/services";

const HISTORY_LIMIT = 50;

function formatDate(date: Date | string) {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function getDayColor(title: string): string {
  const lower = title.toLowerCase();
  if (lower.includes("push") || lower.includes("chest") || lower.includes("shoulder")) return "#0078FF";
  if (lower.includes("pull") || lower.includes("back") || lower.includes("bicep")) return "#34C759";
  if (lower.includes("leg") || lower.includes("lower")) return "#FF9F0A";
  if (lower.includes("arm") || lower.includes("upper")) return "#AF52DE";
  return "#8E8E93";
}

function RatingDots({ rating }: { rating: number | null }) {
  if (!rating) return null;
  return (
    <span className="flex items-center gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          className={`w-3 h-3 ${i < rating ? "fill-[#FF9F0A] text-[#FF9F0A]" : "text-[#3A3A3C]"}`}
        />
      ))}
    </span>
  );
}

export function HistoryClient() {
  const { data: logs = [], isLoading, error } = useQuery<WorkoutHistoryEntry[]>({
    queryKey: historyKeys.list(HISTORY_LIMIT),
    queryFn: () => fetchWorkoutHistory({ limit: HISTORY_LIMIT }),
  });

  // Calculate this month's summary
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const thisMonthLogs = logs.filter((log) => new Date(log.startedAt) >= monthStart);
  const monthCount = thisMonthLogs.length;
  const monthSeconds = thisMonthLogs.reduce((acc, log) => acc + (log.durationSeconds || 0), 0);

  return (
    <AnimateIn>
    <div className="min-h-screen bg-black text-white pb-20">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-black/80 backdrop-blur-lg border-b border-white/5">
        <div className="flex items-center h-14 px-4">
          <h1 className="flex-1 text-center text-[17px] font-semibold">History</h1>
        </div>
      </header>

      <div className="px-4 py-6 space-y-4">
        {/* Summary Card */}
        {!isLoading && !error && logs.length > 0 && (
          <div className="bg-[#1C1C1E] rounded-2xl px-4 py-3 flex items-center gap-4">
            <div className="flex-1">
              <p className="text-[11px] text-[#8E8E93] uppercase tracking-wide">This month</p>
              <p className="text-[17px] font-semibold text-white mt-0.5">
                {monthCount} {monthCount === 1 ? "workout" : "workouts"}
              </p>
            </div>
            <div className="w-px h-8 bg-white/8" />
            <div className="text-right">
              <p className="text-[11px] text-[#8E8E93] uppercase tracking-wide">Total time</p>
              <p className="text-[17px] font-semibold text-white mt-0.5">
                {formatDuration(monthSeconds)}
              </p>
            </div>
          </div>
        )}

        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-[#0078FF]" />
          </div>
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
                  {/* Colored indicator */}
                  <div
                    className="w-2.5 h-2.5 rounded-full mr-4 shrink-0"
                    style={{ backgroundColor: getDayColor(log.dayTitle) }}
                  />

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <p className="text-[15px] font-medium truncate">{log.dayTitle}</p>
                    <p className="text-[13px] text-[#8E8E93] flex items-center gap-2">
                      {formatDate(log.startedAt)}
                      <RatingDots rating={log.rating} />
                    </p>
                  </div>

                  {/* Meta */}
                  <div className="text-right mr-2">
                    <p className="text-[15px] text-[#8E8E93] font-mono">
                      {formatDuration(log.durationSeconds)}
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
    </AnimateIn>
  );
}
