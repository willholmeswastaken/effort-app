"use client";

import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { SetLog } from "@/lib/types";
import { ExerciseCard } from "@/components/exercise-card";
import { ExerciseSwapDrawer } from "@/components/exercise-swap-drawer";
import { X, Check, Star, Pause, Play, RotateCw, Loader2 } from "lucide-react";
import { 
  useUpsertSet, 
  useCompleteWorkout, 
  usePauseWorkout, 
  useResumeWorkout, 
  useResetWorkout, 
  useDeleteWorkout, 
  useLastLifts, 
  useSwapExercise, 
  useWorkoutSession,
  workoutKeys,
  type MuscleGroupExercise 
} from "@/lib/queries";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
  DrawerFooter,
} from "@/components/ui/drawer";
import Link from "next/link";


interface WorkoutSessionClientProps {
  workoutId: string;
}


export default function WorkoutSessionClient({ workoutId }: WorkoutSessionClientProps) {
  const router = useRouter();
  const queryClient = useQueryClient();

  const { data: sessionData, isLoading } = useWorkoutSession(workoutId);

  const workout = sessionData?.workout;
  const exercises = sessionData?.exercises ?? [];
  const querySetsList = sessionData?.sets ?? [];
  const dayTitle = workout?.dayTitle ?? "";
  const isCompleted = workout?.status === "completed";
  const isPaused = workout?.status === "paused";
  const startTime = workout?.startedAt ? new Date(workout.startedAt).getTime() : Date.now();
  const accumulatedPause = workout?.accumulatedPauseSeconds ?? 0;
  const lastPausedAtTime = workout?.lastPausedAt ? new Date(workout.lastPausedAt).getTime() : null;

  // Local state to handle immediate UI updates while typing
  const [localSets, setLocalSets] = useState<Map<string, { reps: number; weight: number }>>(new Map());
  const timeoutsRef = useRef<Record<string, NodeJS.Timeout>>({});

  // Sync server data to local state on load (only for missing keys to preserve typing)
  useEffect(() => {
    if (querySetsList.length > 0) {
      setLocalSets(prev => {
        const next = new Map(prev);
        let changed = false;
        querySetsList.forEach(s => {
          const key = `${s.exerciseId}-${s.setNumber}`;
          if (!next.has(key)) {
            next.set(key, { reps: s.reps, weight: Number(s.weight) });
            changed = true;
          }
        });
        return changed ? next : prev;
      });
    }
  }, [querySetsList]);

  const exercisesWithSets = useMemo(() => 
    exercises.map((ex, index) => {
      // Calculate how many sets to show
      let maxSetNumber = ex.targetSets || 3;
      
      // Check local state for added sets
      for (const key of localSets.keys()) {
        if (key.startsWith(`${ex.id}-`)) {
          const setNum = parseInt(key.split('-').pop() || "0", 10);
          if (setNum > maxSetNumber) maxSetNumber = setNum;
        }
      }

      // Check server state
      const serverSets = querySetsList.filter(s => s.exerciseId === ex.id);
      if (serverSets.length > 0) {
         const maxServerSet = Math.max(...serverSets.map(s => s.setNumber));
         if (maxServerSet > maxSetNumber) maxSetNumber = maxServerSet;
      }

      return {
        current: ex,
        sets: Array.from({ length: maxSetNumber }).map((_, i) => {
          const key = `${ex.id}-${i + 1}`;
          // Prioritize local state
          const saved = localSets.get(key);
          if (saved) {
               return { reps: saved.reps, weight: saved.weight, completed: true };
          }
          
          // Fallback to server data (though useEffect should cover this)
          const serverSet = querySetsList.find(s => s.exerciseId === ex.id && s.setNumber === i + 1);
          return serverSet
            ? { reps: serverSet.reps, weight: Number(serverSet.weight), completed: true }
            : { reps: 0, weight: 0, completed: false };
        }),
      };
    })
  , [exercises, localSets, querySetsList]);

  const exerciseIds = useMemo(() => exercises.map(e => e.id), [exercises]);
  const { data: lastLifts } = useLastLifts(exerciseIds);

  const [elapsed, setElapsed] = useState(0);
  const [finishedAt, setFinishedAt] = useState<number | null>(null);
  const [showCompletionModal, setShowCompletionModal] = useState(false);
  const [showResetModal, setShowResetModal] = useState(false);
  const [rating, setRating] = useState(0);
  const [showSwapDrawer, setShowSwapDrawer] = useState(false);
  const [swapExerciseIndex, setSwapExerciseIndex] = useState<number | null>(null);

  const upsertSet = useUpsertSet();
  const completeWorkout = useCompleteWorkout();
  const pauseWorkout = usePauseWorkout();
  const resumeWorkout = useResumeWorkout();
  const resetWorkout = useResetWorkout();
  const deleteWorkout = useDeleteWorkout();
  const swapExercise = useSwapExercise();

  useEffect(() => {
    if (isCompleted || finishedAt) return;

    const updateTimer = () => {
      if (isPaused && lastPausedAtTime) {
        const rawElapsed = Math.floor((lastPausedAtTime - startTime) / 1000);
        setElapsed(Math.max(0, rawElapsed - accumulatedPause));
      } else {
        const totalElapsed = Math.floor((Date.now() - startTime) / 1000);
        setElapsed(Math.max(0, totalElapsed - accumulatedPause));
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [isCompleted, finishedAt, isPaused, startTime, lastPausedAtTime, accumulatedPause]);

  const handleCancel = () => {
    if (isCompleted) {
      router.push("/");
    } else {
      setShowResetModal(true);
    }
  };

  const togglePause = () => {
    if (isPaused) {
      resumeWorkout.mutate(workoutId, {
        onSuccess: () => queryClient.invalidateQueries({ queryKey: workoutKeys.session(workoutId) }),
      });
    } else {
      pauseWorkout.mutate(workoutId, {
        onSuccess: () => queryClient.invalidateQueries({ queryKey: workoutKeys.session(workoutId) }),
      });
    }
  };

  const handleUpdateSets = useCallback((exerciseIndex: number, newSets: SetLog[]) => {
    const exercise = exercises[exerciseIndex];
    if (!exercise) return;

    setLocalSets(prev => {
      const next = new Map(prev);
      newSets.forEach((set, setIndex) => {
        const key = `${exercise.id}-${setIndex + 1}`;
        const previousVal = next.get(key);
        
        // Update local state immediately
        next.set(key, { reps: set.reps, weight: set.weight });
        
        // Only mutate if values changed and are valid
        // Debounce the mutation to prevent server spam/jank
        const setKey = `${exercise.id}-${setIndex + 1}`;
        if (timeoutsRef.current[setKey]) {
          clearTimeout(timeoutsRef.current[setKey]);
        }
        
        timeoutsRef.current[setKey] = setTimeout(() => {
           if (set.reps > 0 && set.weight > 0) {
             upsertSet.mutate({
                workoutLogId: workoutId,
                exerciseId: exercise.id,
                exerciseName: exercise.name,
                exerciseOrder: exerciseIndex,
                setNumber: setIndex + 1,
                reps: set.reps,
                weight: set.weight,
             });
           }
        }, 500); // 500ms debounce
      });
      return next;
    });
  }, [exercises, workoutId, upsertSet]);

  const handleFinish = () => {
    setFinishedAt(elapsed);
    setShowCompletionModal(true);
  };

  const handleSubmitRating = () => {
    completeWorkout.mutate({
      workoutLogId: workoutId,
      durationSeconds: elapsed,
      rating,
    }, {
      onSuccess: () => {
        router.push("/");
      },
    });
  };

  const handleConfirmReset = () => {
    resetWorkout.mutate(workoutId, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: workoutKeys.session(workoutId) });
        setLocalSets(new Map());
        setElapsed(0);
        setFinishedAt(null);
        setRating(0);
        setShowResetModal(false);
      },
    });
  };

  const handleCancelAndExit = () => {
    deleteWorkout.mutate(workoutId, {
      onSuccess: () => {
        queryClient.removeQueries({ queryKey: workoutKeys.session(workoutId) });
        router.push("/");
      },
    });
  };

  const formatTime = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return hrs > 0
      ? `${hrs}:${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
      : `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const handleSwapRequest = (index: number) => {
    setSwapExerciseIndex(index);
    setShowSwapDrawer(true);
  };

  const handleSwapExercise = (newExercise: MuscleGroupExercise) => {
    if (swapExerciseIndex === null) return;
    
    swapExercise.mutate({
      workoutLogId: workoutId,
      exerciseOrder: swapExerciseIndex,
      newExerciseId: newExercise.id,
      newExerciseName: newExercise.name,
    }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: workoutKeys.session(workoutId) });
        setShowSwapDrawer(false);
      },
    });
    
    setSwapExerciseIndex(null);
  };

  if (isLoading || !sessionData) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#0078FF]" />
      </div>
    );
  }

  const displayTime = isCompleted ? (workout?.durationSeconds ?? 0) : elapsed;

  return (
    <div className="min-h-screen bg-black text-white overflow-x-hidden selection:bg-[#0078FF]/30" style={{ overscrollBehaviorX: 'none' }}>
      <header className="sticky top-0 z-50 bg-black border-b border-white/5">
        <div className="flex items-center justify-between h-14 px-4">
          <Link href='/' prefetch={true} className="p-2 -ml-2">
            <X className="w-5 h-5 text-[#8E8E93]" />
          </Link>
          
          <span className="text-[15px] font-medium text-[#8E8E93]">{dayTitle}</span>
          
          {!isCompleted && (
            <button onClick={() => setShowResetModal(true)} className="p-2 -mr-2">
              <RotateCw className="w-5 h-5 text-[#FF3B30]" />
            </button>
          )}
          {isCompleted && <div className="w-9" />}
        </div>
      </header>

      <div className="py-14 text-center border-b border-white/5 relative">
        <p className="text-[13px] font-medium text-[#8E8E93] uppercase tracking-wider mb-3">
          {isCompleted ? "Completed" : isPaused ? "Paused" : "Duration"}
        </p>
        <p className={`text-7xl font-extralight tabular-nums tracking-tight transition-all duration-300 ${
          isPaused && !isCompleted ? 'opacity-40 scale-95' : 'opacity-100 scale-100'
        } ${!isPaused && !isCompleted ? 'animate-pulse-soft' : ''}`}>
          {formatTime(displayTime)}
        </p>
        
        {!isCompleted && (
          <button 
            onClick={togglePause}
            className={`absolute top-1/2 -translate-y-1/2 right-6 w-14 h-14 rounded-full flex items-center justify-center transition-all duration-200 ${
              isPaused 
                ? 'bg-[#0078FF] shadow-[0_0_16px_rgba(0,120,255,0.4)]' 
                : 'bg-[#1C1C1E] active:bg-[#2C2C2E] border border-white/10'
            }`}
          >
            {isPaused ? (
              <Play className="w-6 h-6 fill-current ml-0.5 text-white" />
            ) : (
              <Pause className="w-6 h-6 fill-current text-[#8E8E93]" />
            )}
          </button>
        )}
      </div>

      <div className="px-4 py-6 space-y-4 pb-28">
        {exercisesWithSets.map((exercise, index) => (
          <ExerciseCard
            key={`${exercise.current.id}-${index}`}
            exercise={exercise.current}
            exerciseNumber={index + 1}
            sets={exercise.sets}
            onSetsChange={(newSets: SetLog[]) => handleUpdateSets(index, newSets)}
            lastLiftHistory={lastLifts?.[exercise.current.id]}
            readOnly={isCompleted}
            onSwapRequest={!isCompleted ? () => handleSwapRequest(index) : undefined}
          />
        ))}
      </div>

      {!isCompleted && (
        <div className="fixed bottom-0 left-0 right-0 p-4 pb-[max(1rem,env(safe-area-inset-bottom))] bg-linear-to-t from-black via-black/95 to-transparent pt-10">
          <button
            onClick={handleFinish}
            className="w-full py-4 bg-[#0078FF] rounded-2xl text-[17px] font-semibold text-white active:scale-[0.98] transition-transform shadow-[0_0_24px_rgba(0,120,255,0.3)]"
          >
            Finish Workout
          </button>
        </div>
      )}

      <Drawer open={showCompletionModal} onOpenChange={setShowCompletionModal}>
        <DrawerContent className="max-w-lg mx-auto">
          <DrawerHeader className="text-center">
            <div className="w-16 h-16 rounded-full bg-[#34C759] flex items-center justify-center mx-auto mb-2">
              <Check className="w-8 h-8 text-black" />
            </div>
            <DrawerTitle className="text-[22px] font-semibold text-white">Workout Complete!</DrawerTitle>
            <DrawerDescription className="text-[15px] text-[#8E8E93]">
              Great job! You worked out for {formatTime(elapsed)}
            </DrawerDescription>
          </DrawerHeader>

          <div className="px-6 mb-6">
            <p className="text-center text-[15px] text-[#8E8E93] mb-3">How did it feel?</p>
            <div className="flex justify-center gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  onClick={() => setRating(star)}
                  className="p-2 active:scale-110 transition-transform"
                >
                  <Star 
                    className={`w-8 h-8 ${star <= rating ? 'fill-[#FF9F0A] text-[#FF9F0A]' : 'text-[#3A3A3C]'}`}
                  />
                </button>
              ))}
            </div>
          </div>
          
          <DrawerFooter className="px-6 pb-8">
            <button 
              onClick={handleSubmitRating}
              disabled={completeWorkout.isPending}
              className="w-full py-4 bg-[#0078FF] rounded-xl text-[17px] font-semibold active:opacity-80 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2 text-white"
            >
              {completeWorkout.isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : "Done"}
            </button>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>

      <Drawer open={showResetModal} onOpenChange={setShowResetModal}>
        <DrawerContent className="max-w-lg mx-auto">
          <DrawerHeader className="text-center">
            <div className="w-16 h-16 rounded-full border-2 border-[#FF3B30] flex items-center justify-center mx-auto mb-2">
              <RotateCw className="w-8 h-8 text-[#FF3B30]" />
            </div>
            <DrawerTitle className="text-[22px] font-semibold text-white">Reset Workout?</DrawerTitle>
            <DrawerDescription className="text-[15px] text-[#8E8E93]">
              This will clear all your progress and restart the timer for this session.
            </DrawerDescription>
          </DrawerHeader>
          
          <DrawerFooter className="px-6 pb-8 gap-3">
            <button 
              onClick={handleConfirmReset}
              disabled={resetWorkout.isPending || deleteWorkout.isPending}
              className="w-full py-4 bg-[#FF9F0A] rounded-xl text-[17px] font-semibold active:opacity-80 transition-opacity disabled:opacity-50 text-black flex items-center justify-center gap-2"
            >
              {resetWorkout.isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : "Reset & Continue"}
            </button>
            
            <button 
              onClick={handleCancelAndExit}
              disabled={resetWorkout.isPending || deleteWorkout.isPending}
              className="w-full py-4 bg-[#FF3B30] rounded-xl text-[17px] font-semibold active:opacity-80 transition-opacity disabled:opacity-50 text-white flex items-center justify-center gap-2"
            >
              {deleteWorkout.isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : "Cancel & Exit"}
            </button>
            
            <button 
              onClick={() => setShowResetModal(false)}
              className="w-full py-4 bg-[#2C2C2E] rounded-xl text-[17px] font-semibold active:opacity-80 transition-opacity text-white"
            >
              Keep Going
            </button>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>

      <ExerciseSwapDrawer
        open={showSwapDrawer}
        onOpenChange={setShowSwapDrawer}
        onExerciseSelect={handleSwapExercise}
        currentExerciseName={swapExerciseIndex !== null ? exercises[swapExerciseIndex]?.name : ""}
        isSwapping={swapExercise.isPending}
      />
    </div>
  );
}
