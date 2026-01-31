"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import {
  ChevronLeft,
  TrendingUp,
  Flame,
  Calendar,
  Dumbbell,
  Clock,
  Target,
} from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import {
  useInsightsSummary,
  useLoggedExercises,
  useExerciseProgression,
} from "@/lib/queries/insights";

type TimeRange = "1w" | "1m" | "3m" | "6m" | "1y" | "All";

const TIME_RANGE_DAYS: Record<TimeRange, number> = {
  "1w": 7,
  "1m": 30,
  "3m": 90,
  "6m": 180,
  "1y": 365,
  All: 9999,
};

export function ProgressClient() {
  const { data: insights, isLoading: insightsLoading } = useInsightsSummary();
  const { data: exercises = [], isLoading: exercisesLoading } =
    useLoggedExercises();

  const [selectedExerciseId, setSelectedExerciseId] = useState<string | null>(
    null
  );
  const [timeRange, setTimeRange] = useState<TimeRange>("1m");

  // Auto-select first exercise
  const effectiveExerciseId = selectedExerciseId || exercises[0]?.id || null;

  const { data: progression = [] } = useExerciseProgression(
    effectiveExerciseId,
    TIME_RANGE_DAYS[timeRange]
  );

  const selectedExercise = exercises.find((e) => e.id === effectiveExerciseId);

  const chartData = useMemo(() => {
    return progression.map((p) => ({
      date: new Date(p.date).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      }),
      weight: p.maxWeight,
    }));
  }, [progression]);

  const isLoading = insightsLoading || exercisesLoading;

  if (isLoading) {
    return <ProgressSkeleton />;
  }

  return (
    <div className="min-h-screen bg-black text-white pb-20">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-black/80 backdrop-blur-lg border-b border-white/5">
        <div className="flex items-center h-14 px-4">
          <Link href="/" className="p-2 -ml-2">
            <ChevronLeft className="w-6 h-6" />
          </Link>
          <h1 className="flex-1 text-center text-[17px] font-semibold">
            Progress
          </h1>
          <div className="w-10" />
        </div>
      </header>

      {/* Insight Tiles */}
      <div className="p-4">
        <h2 className="text-[13px] font-medium text-[#8E8E93] uppercase tracking-wide mb-3">
          Insights
        </h2>

        <div className="grid grid-cols-3 gap-2">
          <InsightTile
            icon={<Calendar className="w-4 h-4 text-[#0078FF]" />}
            iconBg="bg-[#0078FF]/20"
            value={insights?.totalWorkouts ?? 0}
            label="Total workouts"
          />
          <InsightTile
            icon={<Flame className="w-4 h-4 text-[#34C759]" />}
            iconBg="bg-[#34C759]/20"
            value={insights?.thisWeekWorkouts ?? 0}
            label="This week"
          />
          <InsightTile
            icon={<Clock className="w-4 h-4 text-[#FF9500]" />}
            iconBg="bg-[#FF9500]/20"
            value={Math.floor((insights?.totalTimeSeconds ?? 0) / 60)}
            suffix="m"
            label="Total time"
          />
          <InsightTile
            icon={<Dumbbell className="w-4 h-4 text-[#AF52DE]" />}
            iconBg="bg-[#AF52DE]/20"
            value={((insights?.totalVolume ?? 0) / 1000).toFixed(1)}
            suffix="t"
            label="Volume lifted"
          />
          <InsightTile
            icon={<Target className="w-4 h-4 text-[#FF2D55]" />}
            iconBg="bg-[#FF2D55]/20"
            value={insights?.totalSets ?? 0}
            label="Total sets"
          />
          <InsightTile
            icon={<TrendingUp className="w-4 h-4 text-[#FFD60A]" />}
            iconBg="bg-[#FFD60A]/20"
            value={insights?.averageRating?.toFixed(1) ?? "—"}
            label="Avg effort"
          />
        </div>
      </div>

      {/* Exercise Progress Chart */}
      {exercises.length > 0 && (
        <div className="p-4 pt-2">
          <h2 className="text-[13px] font-medium text-[#8E8E93] uppercase tracking-wide mb-3">
            Weight Progress
          </h2>

          <div className="bg-[#1C1C1E] rounded-2xl p-4">
            {/* Exercise Selector */}
            <div className="flex gap-2 overflow-x-auto pb-4 -mx-4 px-4 scrollbar-hide">
              {exercises.slice(0, 5).map((ex) => (
                <button
                  key={ex.id}
                  onClick={() => setSelectedExerciseId(ex.id)}
                  className={`px-4 py-2 rounded-full text-[13px] font-medium whitespace-nowrap transition-colors ${
                    effectiveExerciseId === ex.id
                      ? "bg-[#0078FF] text-white"
                      : "bg-[#2C2C2E] text-[#8E8E93]"
                  }`}
                >
                  {ex.name}
                </button>
              ))}
            </div>

            {selectedExercise && (
              <>
                {/* Current Max */}
                <div className="mb-4">
                  <p className="text-[32px] font-semibold">
                    {selectedExercise.currentMax}
                    <span className="text-[17px] text-[#8E8E93] ml-1">kg</span>
                  </p>
                  <p
                    className={`text-[13px] ${
                      selectedExercise.changePercent >= 0
                        ? "text-[#34C759]"
                        : "text-[#FF3B30]"
                    }`}
                  >
                    {selectedExercise.changePercent >= 0 ? "+" : ""}
                    {selectedExercise.changePercent.toFixed(1)}%
                    <span className="text-[#8E8E93] ml-1">from start</span>
                  </p>
                </div>

                {/* Chart */}
                {chartData.length > 0 ? (
                  <div className="h-48 -mx-2">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={chartData}>
                        <defs>
                          <linearGradient
                            id="colorWeight"
                            x1="0"
                            y1="0"
                            x2="0"
                            y2="1"
                          >
                            <stop
                              offset="0%"
                              stopColor="#0078FF"
                              stopOpacity={0.3}
                            />
                            <stop
                              offset="100%"
                              stopColor="#0078FF"
                              stopOpacity={0}
                            />
                          </linearGradient>
                        </defs>
                        <XAxis
                          dataKey="date"
                          axisLine={false}
                          tickLine={false}
                          tick={{ fill: "#8E8E93", fontSize: 11 }}
                          dy={10}
                        />
                        <YAxis hide domain={["dataMin - 5", "dataMax + 5"]} />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: "#2C2C2E",
                            border: "none",
                            borderRadius: 12,
                            color: "white",
                          }}
                          labelStyle={{ color: "#8E8E93" }}
                          formatter={(value) => [`${value} kg`, "Weight"]}
                        />
                        <Area
                          type="monotone"
                          dataKey="weight"
                          stroke="#0078FF"
                          strokeWidth={2}
                          fill="url(#colorWeight)"
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <div className="h-48 flex items-center justify-center text-[#8E8E93]">
                    No data for this time range
                  </div>
                )}

                {/* Time Range Selector */}
                <div className="flex justify-center gap-1 mt-4 bg-[#2C2C2E] rounded-full p-1">
                  {(["1w", "1m", "3m", "6m", "1y", "All"] as const).map(
                    (range) => (
                      <button
                        key={range}
                        onClick={() => setTimeRange(range)}
                        className={`px-4 py-1.5 rounded-full text-[13px] font-medium transition-colors ${
                          timeRange === range
                            ? "bg-[#636366] text-white"
                            : "text-[#8E8E93]"
                        }`}
                      >
                        {range}
                      </button>
                    )
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Empty State */}
      {(insights?.totalWorkouts ?? 0) === 0 && (
        <div className="flex flex-col items-center justify-center py-20 px-6 text-center">
          <div className="w-16 h-16 rounded-full bg-[#1C1C1E] flex items-center justify-center mb-4">
            <TrendingUp className="w-8 h-8 text-[#8E8E93]" />
          </div>
          <p className="text-[17px] font-medium mb-2">No data yet</p>
          <p className="text-[15px] text-[#8E8E93]">
            Complete some workouts to see your progress
          </p>
        </div>
      )}
    </div>
  );
}

function InsightTile({
  icon,
  iconBg,
  value,
  suffix,
  label,
}: {
  icon: React.ReactNode;
  iconBg: string;
  value: number | string;
  suffix?: string;
  label: string;
}) {
  return (
    <div className="bg-[#1C1C1E] rounded-2xl p-3">
      <div
        className={`w-8 h-8 rounded-full ${iconBg} flex items-center justify-center mb-2`}
      >
        {icon}
      </div>
      <p className="text-[20px] font-semibold">
        {value}
        {suffix && (
          <span className="text-[12px] text-[#8E8E93]">{suffix}</span>
        )}
      </p>
      <p className="text-[11px] text-[#8E8E93] truncate">{label}</p>
    </div>
  );
}

function ProgressSkeleton() {
  return (
    <div className="min-h-screen bg-black text-white">
      <header className="sticky top-0 z-50 bg-black/80 backdrop-blur-lg border-b border-white/5">
        <div className="flex items-center h-14 px-4">
          <Link href="/" className="p-2 -ml-2">
            <ChevronLeft className="w-6 h-6" />
          </Link>
          <h1 className="flex-1 text-center text-[17px] font-semibold">
            Progress
          </h1>
          <div className="w-10" />
        </div>
      </header>

      <div className="p-4">
        <div className="h-4 w-16 bg-[#3A3A3C] rounded animate-pulse mb-3" />
        <div className="grid grid-cols-3 gap-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="bg-[#1C1C1E] rounded-2xl p-3">
              <div className="w-8 h-8 rounded-full bg-[#3A3A3C] animate-pulse mb-2" />
              <div className="h-6 w-12 bg-[#3A3A3C] rounded animate-pulse mb-1" />
              <div className="h-3 w-16 bg-[#3A3A3C] rounded animate-pulse" />
            </div>
          ))}
        </div>
      </div>

      <div className="p-4 pt-2">
        <div className="h-4 w-24 bg-[#3A3A3C] rounded animate-pulse mb-3" />
        <div className="bg-[#1C1C1E] rounded-2xl p-4">
          <div className="flex gap-2 mb-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div
                key={i}
                className="h-8 w-24 bg-[#3A3A3C] rounded-full animate-pulse"
              />
            ))}
          </div>
          <div className="h-48 bg-[#3A3A3C] rounded animate-pulse" />
        </div>
      </div>
    </div>
  );
}
