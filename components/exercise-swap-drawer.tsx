"use client";

import { useState, useMemo } from "react";
import { Check, Search, X } from "lucide-react";
import { useMuscleGroups, type MuscleGroup, type MuscleGroupExercise } from "@/lib/queries";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import Image from "next/image";

interface ExerciseSwapDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onExerciseSelect: (exercise: MuscleGroupExercise) => void;
  currentExerciseName: string;
  isSwapping?: boolean;
}

export function ExerciseSwapDrawer({
  open,
  onOpenChange,
  onExerciseSelect,
  currentExerciseName,
  isSwapping = false,
}: ExerciseSwapDrawerProps) {
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedExerciseId, setSelectedExerciseId] = useState<string | null>(null);
  
  const { data: muscleGroups, isLoading, error } = useMuscleGroups({ enabled: open });

  const allExercises = useMemo(() => {
    if (!muscleGroups) return [];
    return muscleGroups.flatMap(group => 
      group.exercises.map(ex => ({ ...ex, groupName: group.name, groupId: group.id }))
    );
  }, [muscleGroups]);

  const filteredExercises = useMemo(() => {
    let exercises = allExercises;
    if (selectedGroupId) {
      exercises = exercises.filter(ex => ex.groupId === selectedGroupId);
    }
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      exercises = exercises.filter(ex => 
        ex.name.toLowerCase().includes(query) ||
        ex.groupName.toLowerCase().includes(query)
      );
    }
    return exercises;
  }, [allExercises, selectedGroupId, searchQuery]);

  const handleExerciseSelect = (exercise: MuscleGroupExercise & { groupName: string; groupId: string }) => {
    setSelectedExerciseId(exercise.id);
    setTimeout(() => {
      onExerciseSelect(exercise);
    }, 300);
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      setSelectedGroupId(null);
      setSearchQuery("");
      setSelectedExerciseId(null);
    }
    onOpenChange(newOpen);
  };

  return (
    <Drawer open={open} onOpenChange={handleOpenChange} dismissible={!isSwapping}>
      <DrawerContent className="max-w-lg mx-auto h-[85vh] bg-[#0A0A0A]">
        <div className="flex flex-col h-full">
          {/* Header */}
          <DrawerHeader className="text-center border-b border-white/6 pb-4 shrink-0">
            <div className="flex items-center justify-between">
              <button
                onClick={() => onOpenChange(false)}
                disabled={isSwapping}
                className="w-10 h-10 flex items-center justify-center rounded-full bg-[#1C1C1E] active:scale-95 disabled:opacity-50"
              >
                <X className="w-5 h-5 text-[#8E8E93]" />
              </button>
              <DrawerTitle className="text-[17px] font-semibold text-white flex-1 text-center">
                Swap Exercise
              </DrawerTitle>
              <div className="w-10" />
            </div>
            <p className="text-[13px] text-[#8E8E93] mt-1">
              Replacing: <span className="text-white">{currentExerciseName}</span>
            </p>
          </DrawerHeader>

          {/* Sticky Filters Header */}
          <div className="shrink-0 bg-[#0A0A0A] border-b border-white/6 z-10" data-vaul-no-drag>
            {/* Search */}
            <div className="px-4 pt-4 pb-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8E8E93]" />
                <input
                  type="text"
                  placeholder="Search exercises..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full h-11 bg-[#1C1C1E] rounded-xl pl-10 pr-10 text-[15px] text-white placeholder:text-[#8E8E93] focus:outline-none focus:ring-2 focus:ring-[#0078FF]/50"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-[#3A3A3C] flex items-center justify-center"
                  >
                    <X className="w-3 h-3 text-[#8E8E93]" />
                  </button>
                )}
              </div>
            </div>

            {/* Muscle Groups */}
            {!isLoading && !error && muscleGroups && (
              <div className="px-4 pb-3">
                <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-2">
                  <button
                    onClick={() => setSelectedGroupId(null)}
                    className={`shrink-0 px-4 py-2 rounded-full text-[14px] font-medium transition-all active:scale-95 ${
                      !selectedGroupId 
                        ? 'bg-[#0078FF] text-white' 
                        : 'bg-[#1C1C1E] text-[#8E8E93]'
                    }`}
                  >
                    All
                  </button>
                  {muscleGroups.map((group) => (
                    <button
                      key={group.id}
                      onClick={() => setSelectedGroupId(group.id)}
                      className={`shrink-0 px-4 py-2 rounded-full text-[14px] font-medium transition-all active:scale-95 ${
                        selectedGroupId === group.id
                          ? 'bg-[#0078FF] text-white'
                          : 'bg-[#1C1C1E] text-[#8E8E93]'
                      }`}
                    >
                      {group.name}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Scrollable Content */}
          <div className="flex-1 overflow-y-auto min-h-0" data-vaul-no-drag>
            {/* Exercise List */}
            <div className="px-4 py-4 pb-12">
              {isLoading && (
                <div className="space-y-2">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <div key={i} className="w-full h-16 bg-[#1C1C1E] rounded-xl animate-pulse" />
                  ))}
                </div>
              )}

              {error && (
                <div className="py-12 text-center text-[#FF3B30]">
                  Failed to load exercises
                </div>
              )}

              {!isLoading && !error && filteredExercises.length === 0 && (
                <div className="py-12 text-center text-[#8E8E93]">
                  No exercises found
                </div>
              )}

              {!isLoading && !error && filteredExercises.length > 0 && (
                <div className="space-y-2">
                  {filteredExercises.map((exercise) => (
                    <button
                      key={exercise.id}
                      disabled={isSwapping}
                      onClick={() => handleExerciseSelect(exercise)}
                      className="w-full flex items-center gap-3 p-3 bg-[#1C1C1E] rounded-xl text-left active:scale-[0.98] transition-all hover:bg-[#2C2C2E]"
                    >
                      {/* Thumbnail - constrained size */}
                      <div className="w-12 h-12 rounded-lg overflow-hidden shrink-0 relative bg-[#2C2C2E]">
                        {exercise.thumbnailUrl ? (
                          <Image
                            src={exercise.thumbnailUrl}
                            alt={exercise.name}
                            fill
                            className="object-cover"
                            sizes="48px"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <span className="text-[10px] text-[#8E8E93] font-medium">
                              {exercise.name.charAt(0).toUpperCase()}
                            </span>
                          </div>
                        )}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <p className="text-[15px] font-medium text-white truncate">
                          {exercise.name}
                        </p>
                        <p className="text-[13px] text-[#8E8E93]">
                          {exercise.targetSets || 3} sets × {exercise.targetReps || "8-12"} reps
                        </p>
                      </div>

                      {selectedExerciseId === exercise.id && (
                        <div className="w-8 h-8 rounded-full bg-[#34C759] flex items-center justify-center shrink-0">
                          <Check className="w-4 h-4 text-black" />
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {isSwapping && (
          <div className="absolute inset-0 z-50 bg-black/80 flex items-center justify-center">
            <div className="flex flex-col items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-[#0078FF] flex items-center justify-center animate-pulse">
                <Check className="w-6 h-6 text-white" />
              </div>
              <span className="text-white font-medium">Swapping...</span>
            </div>
          </div>
        )}
      </DrawerContent>
    </Drawer>
  );
}
