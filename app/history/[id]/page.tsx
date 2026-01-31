import Link from "next/link";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { Effect, pipe } from "effect";
import { ChevronLeft } from "lucide-react";
import { auth } from "@/lib/auth";
import { runEffect, WorkoutsService } from "@/lib/services";

interface HistoryDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function HistoryDetailPage({ params }: HistoryDetailPageProps) {
  const { id } = await params;
  
  const headersList = await headers();
  const session = await auth.api.getSession({ headers: headersList });

  if (!session?.user) {
    redirect("/login");
  }

  const result = await runEffect(
    pipe(
      Effect.gen(function* () {
        const service = yield* WorkoutsService;
        const workout = yield* service.getWorkoutById(id);
        if (!workout) {
          return { type: "notFound" as const };
        }
        return { type: "success" as const, workout };
      }),
      Effect.catchAll((error) => {
        console.error("Failed to fetch workout:", error);
        return Effect.succeed({ type: "notFound" as const });
      })
    )
  );

  if (result.type === "notFound") {
    return (
      <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center px-4">
        <p className="text-[15px] text-[#FF3B30] mb-2">Workout not found</p>
        <Link href="/history" className="text-[15px] text-[#0078FF]">Back to History</Link>
      </div>
    );
  }

  const workout = result.workout;

  const formatTime = (seconds: number | null) => {
    if (!seconds) return "—";
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString(undefined, { 
      weekday: 'long',
      month: 'long', 
      day: 'numeric',
      year: 'numeric'
    });
  };

  return (
    <div className="min-h-screen bg-black text-white pb-20">
      <header className="sticky top-0 z-50 bg-black/80 backdrop-blur-lg border-b border-white/5">
        <div className="flex items-center h-14 px-4">
          <Link href="/history" className="p-2 -ml-2">
            <ChevronLeft className="w-6 h-6" />
          </Link>
          <h1 className="flex-1 text-center text-[17px] font-semibold">Details</h1>
          <div className="w-10" />
        </div>
      </header>

      <div className="px-4 py-6 border-b border-white/5">
        <h2 className="text-[22px] font-semibold mb-1">{workout.day.title}</h2>
        <p className="text-[15px] text-[#8E8E93]">{formatDate(workout.startedAt)}</p>
        
        <div className="flex gap-6 mt-4">
          <div>
            <p className="text-[13px] text-[#8E8E93]">Duration</p>
            <p className="text-[17px] font-medium">{formatTime(workout.durationSeconds)}</p>
          </div>
          <div>
            <p className="text-[13px] text-[#8E8E93]">Exercises</p>
            <p className="text-[17px] font-medium">{workout.exerciseLogs.length}</p>
          </div>
          {workout.rating && workout.rating > 0 && (
            <div>
              <p className="text-[13px] text-[#8E8E93]">Effort</p>
              <p className="text-[17px] font-medium">{workout.rating}/5</p>
            </div>
          )}
        </div>
      </div>

      <div className="px-4 py-6">
        {workout.exerciseLogs.map((ex) => (
          <div key={ex.id} className="mb-6">
            <h3 className="text-[17px] font-semibold mb-3">{ex.exerciseName}</h3>
            
            <div className="bg-[#1C1C1E] rounded-2xl overflow-hidden">
              <div className="grid grid-cols-3 px-4 py-2.5 border-b border-white/5">
                <span className="text-[13px] text-[#8E8E93]">Set</span>
                <span className="text-[13px] text-[#8E8E93] text-center">kg</span>
                <span className="text-[13px] text-[#8E8E93] text-center">Reps</span>
              </div>
              
              {ex.setLogs.map((set, si) => (
                <div 
                  key={si} 
                  className={`grid grid-cols-3 items-center px-4 py-2.5 ${si > 0 ? 'border-t border-white/5' : ''}`}
                >
                  <span className="text-[15px] text-[#8E8E93]">{set.setNumber}</span>
                  <span className="text-[15px] font-medium text-center">{set.weight || '—'}</span>
                  <span className="text-[15px] font-medium text-center">{set.reps || '—'}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
        
        {workout.exerciseLogs.length === 0 && (
          <div className="text-center py-10 text-[#8E8E93]">
            No exercises recorded
          </div>
        )}
      </div>
    </div>
  );
}
