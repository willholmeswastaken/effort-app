"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { WorkoutLog } from "@/lib/types";
import { Star, Check } from "lucide-react";

export default function SummaryPage() {
  const router = useRouter();
  const [log, setLog] = useState<WorkoutLog | null>(null);
  const [rating, setRating] = useState(0);

  useEffect(() => {
    const lastId = sessionStorage.getItem("last_workout_id");
    if (!lastId) {
      router.replace("/");
      return;
    }

    const history = JSON.parse(localStorage.getItem("workout_history") || "[]");
    const foundLog = history.find((l: WorkoutLog) => l.id === lastId);
    
    if (foundLog) {
      setLog(foundLog);
      setRating(foundLog.rating || 0);
    } else {
      router.replace("/");
    }
  }, [router]);

  const handleRate = (score: number) => {
    setRating(score);
    if (log) {
      const history = JSON.parse(localStorage.getItem("workout_history") || "[]");
      const updatedHistory = history.map((l: WorkoutLog) => 
        l.id === log.id ? { ...l, rating: score } : l
      );
      localStorage.setItem("workout_history", JSON.stringify(updatedHistory));
    }
  };

  if (!log) return null;

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center p-6">
      {/* Success Modal */}
      <div className="w-full max-w-sm bg-[#1C1C1E] rounded-3xl p-8 text-center">
        {/* Checkmark */}
        <div className="w-16 h-16 rounded-full bg-[#0078FF] flex items-center justify-center mx-auto mb-6">
          <Check className="w-8 h-8 text-white" strokeWidth={3} />
        </div>
        
        <h1 className="text-[22px] font-semibold mb-1">Session complete</h1>
        <p className="text-[15px] text-[#8E8E93] mb-8">
          {log.dayName} • {formatTime(log.durationSeconds)}
        </p>

        {/* Rating */}
        <div className="mb-8">
          <p className="text-[13px] text-[#8E8E93] mb-3">Rate your effort</p>
          <div className="flex justify-center gap-2">
            {[1, 2, 3, 4, 5].map((star) => (
              <button 
                key={star} 
                onClick={() => handleRate(star)}
                className="p-1"
              >
                <Star 
                  className={`w-7 h-7 ${star <= rating ? "fill-[#0078FF] text-[#0078FF]" : "text-[#3A3A3C]"}`} 
                />
              </button>
            ))}
          </div>
        </div>

        {/* Actions */}
        <button 
          onClick={() => router.push("/")}
          className="w-full py-4 bg-[#0078FF] rounded-xl text-[17px] font-semibold mb-3"
        >
          Done
        </button>
        
        <button 
          onClick={() => router.push("/history")}
          className="w-full py-4 text-[#0078FF] text-[17px] font-medium"
        >
          View details
        </button>
      </div>
    </div>
  );
}
