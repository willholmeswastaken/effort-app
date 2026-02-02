"use client";

import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { SetLog } from "@/lib/types";
import { ExerciseCard } from "@/components/exercise-card";
import { ExerciseSwapDrawer } from "@/components/exercise-swap-drawer";
import { X, Check, Star, Pause, Play, RotateCw, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { 
  useUpsertSet, 
  useCompleteWorkout, 
  useRateWorkout,
  usePauseWorkout, 
  useResumeWorkout, 
  useResetWorkout, 
  useDeleteWorkout, 
  useSwapExercise, 
  useWorkoutSession,
  workoutKeys,
  homeKeys,
  type MuscleGroupExerciseWithGroup 
} from "@/lib/queries";
import { type WorkoutSessionData } from "@/lib/services";
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
  initialSessionData?: WorkoutSessionData;
}


export default function WorkoutSessionClient({ workoutId, initialSessionData }: WorkoutSessionClientProps) {
  const router = useRouter();
  const queryClient = useQueryClient();

  const { data: sessionData, isLoading } = useWorkoutSession(workoutId, {
    initialData: initialSessionData,
  });

  const workout = sessionData?.workout;
  const exercises = sessionData?.exercises ?? [];
  const querySetsList = sessionData?.sets ?? [];
  const dayTitle = workout?.dayTitle ?? "";
  const isCompleted = workout?.status === "completed";
  const serverPausedState = workout?.status === "paused";
  const [optimisticPaused, setOptimisticPaused] = useState<boolean | null>(null);
  const isPaused = optimisticPaused ?? serverPausedState;
  
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

  const [elapsed, setElapsed] = useState(0);
  const [finishedAt, setFinishedAt] = useState<number | null>(null);
  const [showCompletionModal, setShowCompletionModal] = useState(false);
  const [showResetModal, setShowResetModal] = useState(false);
  const [rating, setRating] = useState(0);
  const [showSwapDrawer, setShowSwapDrawer] = useState(false);
  const [swapExerciseIndex, setSwapExerciseIndex] = useState<number | null>(null);
  const [isTimerCompact, setIsTimerCompact] = useState(false);
  const [completedSetsCount, setCompletedSetsCount] = useState(0);

  const upsertSet = useUpsertSet();
  const completeWorkout = useCompleteWorkout();
  const rateWorkout = useRateWorkout();
  const pauseWorkout = usePauseWorkout();
  const resumeWorkout = useResumeWorkout();
  const resetWorkout = useResetWorkout();
  const deleteWorkout = useDeleteWorkout();
  const swapExercise = useSwapExercise();

  useEffect(() => {
    if (isCompleted || finishedAt) return;

    const updateTimer = () => {
      if (isPaused) {
        if (lastPausedAtTime) {
          const rawElapsed = Math.floor((lastPausedAtTime - startTime) / 1000);
          setElapsed(Math.max(0, rawElapsed - accumulatedPause));
        }
        // If optimistically paused but no server time yet, just don't update
        return;
      }
      
      const totalElapsed = Math.floor((Date.now() - startTime) / 1000);
      setElapsed(Math.max(0, totalElapsed - accumulatedPause));
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [isCompleted, finishedAt, isPaused, startTime, lastPausedAtTime, accumulatedPause]);

  // Floating timer: shrink when scrolling down
  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY;
      setIsTimerCompact(scrollY > 100);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Calculate pre-existing completed sets from server data on initial load
  useEffect(() => {
    const existingCompleted = exercisesWithSets.reduce((acc, ex) => {
      return acc + ex.sets.filter(s => s.reps > 0 && s.weight > 0).length;
    }, 0);
    setCompletedSetsCount(existingCompleted);
  }, []);

  // Track completed sets for progress bar
  const handleSetComplete = () => {
    setCompletedSetsCount(prev => prev + 1);
  };

  // Calculate total sets across all exercises
  const totalSets = exercisesWithSets.reduce((acc, ex) => acc + ex.sets.length, 0);
  const progressPercentage = totalSets > 0 ? (completedSetsCount / totalSets) * 100 : 0;

  const handleCancel = () => {
    if (isCompleted) {
      router.push("/");
    } else {
      setShowResetModal(true);
    }
  };

  const togglePause = () => {
    // Optimistic: Update UI immediately
    const newPausedState = !isPaused;
    setOptimisticPaused(newPausedState);
    
    // Call API based on what user wants to do (new state), not old server state
    if (newPausedState) {
      // User wants to PAUSE
      pauseWorkout.mutate(workoutId, {
        onSuccess: () => {
          // Manual cache update to avoid flicker while refetching
          queryClient.setQueryData(workoutKeys.session(workoutId), (oldData: any) => {
            if (!oldData) return oldData;
            return {
              ...oldData,
              workout: {
                ...oldData.workout,
                status: "paused",
                lastPausedAt: new Date().toISOString(),
              }
            };
          });
          queryClient.invalidateQueries({ queryKey: workoutKeys.session(workoutId) });
          setOptimisticPaused(null); // Clear optimistic state
        },
        onError: () => {
          setOptimisticPaused(null);
          toast.error("Failed to pause workout");
        },
      });
    } else {
      // User wants to RESUME
      resumeWorkout.mutate(workoutId, {
        onSuccess: (data) => {
          // Use server-returned accumulatedPauseSeconds to avoid timer flicker
          queryClient.setQueryData(workoutKeys.session(workoutId), (oldData: any) => {
            if (!oldData) return oldData;
            return {
              ...oldData,
              workout: {
                ...oldData.workout,
                status: "active",
                lastPausedAt: null,
                accumulatedPauseSeconds: data.accumulatedPauseSeconds,
              }
            };
          });
          // Don't invalidate immediately - let the optimistic update persist
          // The next natural refetch will sync any other changes
          setOptimisticPaused(null); // Clear optimistic state
        },
        onError: () => {
          setOptimisticPaused(null);
          toast.error("Failed to resume workout");
        },
      });
    }
  };

  // Optimized: Only POST the specific set that changed, not all sets
  const handleUpdateSet = useCallback((exerciseIndex: number, setIndex: number, field: 'reps' | 'weight', value: number) => {
    const exercise = exercises[exerciseIndex];
    if (!exercise) return;

    const key = `${exercise.id}-${setIndex + 1}`;
    const setKey = `${exercise.id}-${setIndex + 1}-${field}`;
    
    // Update local state immediately for responsive UI
    setLocalSets(prev => {
      const next = new Map(prev);
      const existing = next.get(key) || { reps: 0, weight: 0 };
      next.set(key, { ...existing, [field]: value });
      return next;
    });
    
    // Clear existing timeout for this specific field
    if (timeoutsRef.current[setKey]) {
      clearTimeout(timeoutsRef.current[setKey]);
    }
    
    // Debounce API call - only POST when user stops typing
    // Use a ref to capture the current value, avoiding stale closure
    const currentValueRef = { value, field, exerciseIndex, setIndex, exercise, key };
    
    timeoutsRef.current[setKey] = setTimeout(() => {
      // Read the ACTUAL current value from the captured ref, not from stale state
      const { value: finalValue, field: finalField, exerciseIndex: finalExIndex, setIndex: finalSetIndex, exercise: finalExercise, key: finalKey } = currentValueRef;
      
      // Get the other field's value from local state
      const currentSet = localSets.get(finalKey);
      const reps = finalField === 'reps' ? finalValue : (currentSet?.reps || 0);
      const weight = finalField === 'weight' ? finalValue : (currentSet?.weight || 0);
      
      // Only POST if both values are valid
      if (reps > 0 && weight > 0) {
        upsertSet.mutate({
          workoutLogId: workoutId,
          exerciseId: finalExercise.id,
          exerciseName: finalExercise.name,
          exerciseOrder: finalExIndex,
          setNumber: finalSetIndex + 1,
          reps,
          weight,
        });
      }
    }, 800); // 800ms debounce - waits for user to finish typing
  }, [exercises, workoutId, upsertSet, localSets]);

  // Legacy handler for batch updates (when adding/removing sets)
  const handleUpdateSets = useCallback((exerciseIndex: number, newSets: SetLog[]) => {
    const exercise = exercises[exerciseIndex];
    if (!exercise) return;

    setLocalSets(prev => {
      const next = new Map(prev);
      newSets.forEach((set, setIndex) => {
        const key = `${exercise.id}-${setIndex + 1}`;
        next.set(key, { reps: set.reps, weight: set.weight });
      });
      return next;
    });
  }, [exercises]);

  const handleFinish = () => {
    setFinishedAt(elapsed);
    // Complete workout immediately without rating
    completeWorkout.mutate({
      workoutLogId: workoutId,
      durationSeconds: elapsed,
    }, {
      onSuccess: () => {
        // Show rating modal after workout is completed
        setShowCompletionModal(true);
        // Invalidate queries
        queryClient.invalidateQueries({ queryKey: workoutKeys.session(workoutId) });
        queryClient.invalidateQueries({ queryKey: homeKeys.all });
      },
    });
  };

  const handleSubmitRating = () => {
    // Only submit rating (workout already completed)
    rateWorkout.mutate({
      workoutLogId: workoutId,
      rating,
    }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: homeKeys.all });
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

  const handleSwapExercise = (newExercise: MuscleGroupExerciseWithGroup) => {
    if (swapExerciseIndex === null) return;
    
    swapExercise.mutate({
      workoutLogId: workoutId,
      exerciseOrder: swapExerciseIndex,
      newExerciseId: newExercise.id,
      newExerciseName: newExercise.name,
      newExerciseMuscleGroupId: newExercise.groupId,
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
      <header className="fixed top-0 left-0 right-0 z-100 bg-black/95 backdrop-blur-xl border-b border-white/6">
        <div className="flex items-center justify-between h-14 px-4">
          <Link href='/' prefetch={true} className="p-2.5 -ml-2 rounded-full active:scale-95 transition-all duration-200 ease-[cubic-bezier(0.23,1,0.32,1)] hover:bg-white/5">
            <X className="w-5 h-5 text-[#8E8E93]" />
          </Link>
          
          {/* Center content with smooth transition */}
          <div className="relative h-8 flex items-center justify-center">
            {/* Compact Timer Pill - fades in when scrolled */}
            <div className={`absolute inset-0 flex items-center justify-center transition-all duration-700 ease-[cubic-bezier(0.23,1,0.32,1)] ${isTimerCompact && !isCompleted ? 'opacity-100 scale-100' : 'opacity-0 scale-95 pointer-events-none'}`}>
              <div className="flex items-center gap-2 px-3 py-1.5 bg-[#1C1C1E] rounded-full border border-white/6">
                <span className="text-[14px] font-medium text-white tabular-nums">{formatTime(elapsed)}</span>
                {isPaused && <Pause className="w-3 h-3 text-[#FF9F0A]" />}
              </div>
            </div>
            
            {/* Day Title - fades out when scrolled */}
            <span className={`text-[15px] font-medium text-[#8E8E93] transition-all duration-700 ease-[cubic-bezier(0.23,1,0.32,1)] ${isTimerCompact ? 'opacity-0 scale-95' : 'opacity-100 scale-100'}`}>
              {dayTitle}
            </span>
          </div>
          
          {!isCompleted && (
            <button onClick={() => setShowResetModal(true)} className="p-2.5 -mr-2 rounded-full active:scale-95 transition-all duration-200 ease-[cubic-bezier(0.23,1,0.32,1)] hover:bg-[#FF3B30]/10">
              <RotateCw className="w-5 h-5 text-[#FF3B30]" />
            </button>
          )}
          {isCompleted && <div className="w-9" />}
        </div>
        
        {/* Progress Bar */}
        {!isCompleted && totalSets > 0 && (
          <div className="h-1 bg-white/5 w-full">
            <div 
              className="h-full bg-linear-to-r from-[#0078FF] to-[#34C759] transition-all duration-500 ease-[cubic-bezier(0.23,1,0.32,1)]"
              style={{ width: `${Math.min(progressPercentage, 100)}%` }}
            />
          </div>
        )}
      </header>

      <div className={`text-center border-b border-white/6 relative overflow-hidden transition-all duration-700 ease-[cubic-bezier(0.23,1,0.32,1)] ${isTimerCompact ? 'py-14' : 'pt-20 pb-10'}`}>
        {/* Subtle gradient overlay for depth */}
        <div className="absolute inset-0 bg-linear-to-b from-white/2 to-transparent pointer-events-none z-0" />
        
        {/* Large Timer - fades out as you scroll (z-10) */}
        <div className={`relative z-10 flex flex-col items-center justify-center px-16 transition-all duration-700 ease-[cubic-bezier(0.23,1,0.32,1)] ${isTimerCompact ? 'opacity-0 scale-95 pointer-events-none' : 'opacity-100 scale-100'}`}>
          <p className="text-[13px] font-medium text-[#8E8E93] uppercase tracking-wider mb-2">
            {isCompleted ? "Completed" : isPaused ? "Paused" : "Duration"}
          </p>
          <div className="w-full flex items-center justify-center">
            <p className={`font-extralight tabular-nums tracking-tight transition-all duration-500 ease-[cubic-bezier(0.23,1,0.32,1)] ${
              displayTime >= 3600 ? 'text-5xl sm:text-6xl' : 'text-7xl sm:text-8xl'
            } ${
              isPaused && !isCompleted ? 'opacity-40 scale-95' : 'opacity-100 scale-100'
            } ${!isPaused && !isCompleted ? 'animate-pulse' : ''}`}>
              {formatTime(displayTime)}
            </p>
          </div>
        </div>
        
        {/* Mini stats - fades in as you scroll (z-20, higher than big timer) */}
        <div className={`absolute inset-0 z-20 flex items-center justify-center bg-black/95 backdrop-blur-sm transition-all duration-700 ease-[cubic-bezier(0.23,1,0.32,1)] ${isTimerCompact && !isCompleted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'}`}>
          <div className="flex items-center justify-center gap-6">
            <div className="text-center">
              <p className="text-[11px] text-[#8E8E93] uppercase tracking-wide">Exercise</p>
              <p className="text-[15px] font-semibold text-white">{exercises.length > 0 ? Math.min(completedSetsCount, exercises.length) : 0} <span className="text-[#8E8E93]">/ {exercises.length}</span></p>
            </div>
            <div className="w-px h-8 bg-white/10" />
            <div className="text-center">
              <p className="text-[11px] text-[#8E8E93] uppercase tracking-wide">Sets</p>
              <p className="text-[15px] font-semibold text-white">{completedSetsCount} <span className="text-[#8E8E93]">/ {totalSets}</span></p>
            </div>
          </div>
        </div>
        
        {!isCompleted && (
          <button 
            onClick={togglePause}
            className={`absolute top-1/2 right-6 w-14 h-14 rounded-full flex items-center justify-center z-50 transition-all duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)] active:scale-90 -translate-y-1/2 ${
              isTimerCompact ? '' : 'mt-8'
            } ${
              isPaused 
                ? 'bg-linear-to-br from-[#0078FF] to-[#0066DD] shadow-[0_0_24px_rgba(0,120,255,0.5)] scale-100' 
                : 'bg-[#1C1C1E] active:bg-[#2C2C2E] border border-white/8 shadow-[0_4px_12px_-2px_rgba(0,0,0,0.4)]'
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
              onSetFieldChange={!isCompleted ? (setIndex, field, value) => handleUpdateSet(index, setIndex, field, value) : undefined}
              readOnly={isCompleted}
              onSwapRequest={!isCompleted ? () => handleSwapRequest(index) : undefined}
              onSetComplete={!isCompleted ? handleSetComplete : undefined}
            />
          ))}
        </div>

      {!isCompleted && (
        <div className="fixed bottom-0 left-0 right-0 p-4 pb-[max(1rem,env(safe-area-inset-bottom))] bg-linear-to-t from-black via-black/95 to-transparent pt-10">
          <button
            onClick={handleFinish}
            className="w-full py-4 bg-linear-to-br from-[#0078FF] to-[#0066DD] rounded-2xl text-[17px] font-semibold text-white active:scale-95 transition-all duration-200 ease-[cubic-bezier(0.23,1,0.32,1)] shadow-[0_0_32px_rgba(0,120,255,0.4),0_4px_12px_-2px_rgba(0,120,255,0.3)] hover:shadow-[0_0_40px_rgba(0,120,255,0.5)]"
          >
            Finish Workout
          </button>
        </div>
      )}

      <Drawer 
        open={showCompletionModal} 
        onOpenChange={() => {}} 
        dismissible={false}
      >
        <DrawerContent className="max-w-lg mx-auto">
          <DrawerHeader className="text-center">
            {/* Success animation ring */}
            <div className="relative w-20 h-20 mx-auto mb-4">
              <div className="absolute inset-0 rounded-full bg-[#34C759]/20 animate-ping" />
              <div className="absolute inset-0 rounded-full bg-[#34C759]/10 animate-pulse" />
              <div className="relative w-20 h-20 rounded-full bg-linear-to-br from-[#34C759] to-[#30B350] flex items-center justify-center shadow-[0_0_32px_rgba(52,199,89,0.4)]">
                <Check className="w-10 h-10 text-black" strokeWidth={3} />
              </div>
            </div>
            <DrawerTitle className="text-[24px] font-semibold text-white mb-1">Workout Complete!</DrawerTitle>
            <DrawerDescription className="text-[15px] text-[#8E8E93]">
              Great job! You worked out for {formatTime(elapsed)}
            </DrawerDescription>
          </DrawerHeader>

          <div className="px-6 mb-6">
            <p className="text-center text-[15px] text-[#8E8E93] mb-4">How did it feel?</p>
            <div className="flex justify-center gap-3">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  onClick={() => setRating(star)}
                  className="p-2 active:scale-90 transition-all duration-200 ease-[cubic-bezier(0.34,1.56,0.64,1)]"
                >
                  <Star 
                    className={`w-9 h-9 transition-all duration-300 ${star <= rating ? 'fill-[#FF9F0A] text-[#FF9F0A] drop-shadow-[0_0_8px_rgba(255,159,10,0.5)]' : 'text-[#3A3A3C]'}`}
                  />
                </button>
              ))}
            </div>
          </div>
          
          <DrawerFooter className="px-6 pb-8">
            <button 
              onClick={handleSubmitRating}
              disabled={rateWorkout.isPending}
              className="w-full py-4 bg-linear-to-br from-[#0078FF] to-[#0066DD] rounded-xl text-[17px] font-semibold text-white active:scale-95 transition-all duration-200 ease-[cubic-bezier(0.23,1,0.32,1)] disabled:opacity-50 flex items-center justify-center gap-2 shadow-[0_0_24px_rgba(0,120,255,0.3)]"
            >
              {rateWorkout.isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : "Done"}
            </button>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>

      <Drawer open={showResetModal} onOpenChange={setShowResetModal}>
        <DrawerContent className="max-w-lg mx-auto">
          <DrawerHeader className="text-center">
            <div className="w-16 h-16 rounded-full border-2 border-[#FF3B30] bg-[#FF3B30]/5 flex items-center justify-center mx-auto mb-2 shadow-[0_0_16px_rgba(255,59,48,0.2)]">
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
              className="w-full py-4 bg-linear-to-br from-[#FF9F0A] to-[#E88C00] rounded-xl text-[17px] font-semibold active:scale-95 transition-all duration-200 ease-[cubic-bezier(0.23,1,0.32,1)] disabled:opacity-50 text-black flex items-center justify-center gap-2 shadow-[0_4px_12px_-2px_rgba(255,159,10,0.3)]"
            >
              {resetWorkout.isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : "Reset & Continue"}
            </button>
            
            <button 
              onClick={handleCancelAndExit}
              disabled={resetWorkout.isPending || deleteWorkout.isPending}
              className="w-full py-4 bg-linear-to-br from-[#FF3B30] to-[#D93025] rounded-xl text-[17px] font-semibold active:scale-95 transition-all duration-200 ease-[cubic-bezier(0.23,1,0.32,1)] disabled:opacity-50 text-white flex items-center justify-center gap-2 shadow-[0_4px_12px_-2px_rgba(255,59,48,0.3)]"
            >
              {deleteWorkout.isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : "Cancel & Exit"}
            </button>
            
            <button 
              onClick={() => setShowResetModal(false)}
              className="w-full py-4 bg-[#2C2C2E] rounded-xl text-[17px] font-semibold active:scale-95 transition-all duration-200 ease-[cubic-bezier(0.23,1,0.32,1)] text-white border border-white/6 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.05)]"
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
        currentMuscleGroupId={swapExerciseIndex !== null ? exercises[swapExerciseIndex]?.muscleGroupId : null}
        isSwapping={swapExercise.isPending}
      />
    </div>
  );
}
