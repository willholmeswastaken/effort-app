"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import { Check, Search, X } from "lucide-react";
import { useMuscleGroups, type MuscleGroupExerciseWithGroup } from "@/lib/queries";
import Image from "next/image";

interface ExercisePickerProps {
  onExerciseSelect: (exercise: MuscleGroupExerciseWithGroup) => void;
  selectedExerciseId?: string | null;
  initialMuscleGroupId?: string | null;
}

export function ExercisePicker({
  onExerciseSelect,
  selectedExerciseId: externalSelectedId,
  initialMuscleGroupId,
}: ExercisePickerProps) {
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(initialMuscleGroupId ?? null);
  const [searchQuery, setSearchQuery] = useState("");
  const [localSelectedId, setLocalSelectedId] = useState<string | null>(null);

  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const exerciseListRef = useRef<HTMLDivElement>(null);
  const groupButtonRefs = useRef<Map<string, HTMLButtonElement>>(new Map());

  const { data: muscleGroups, isLoading, error } = useMuscleGroups();

  const selectedExerciseId = externalSelectedId !== undefined ? externalSelectedId : localSelectedId;

  // Sync initialMuscleGroupId with state only if it changes
  const [prevInitialId, setPrevInitialId] = useState(initialMuscleGroupId);
  if (initialMuscleGroupId !== prevInitialId) {
    setPrevInitialId(initialMuscleGroupId);
    setSelectedGroupId(initialMuscleGroupId ?? null);
  }

  // Scroll the selected muscle group pill into view
  useEffect(() => {
    if (!muscleGroups || muscleGroups.length === 0) return;

    const timer = setTimeout(() => {
      const container = scrollContainerRef.current;
      if (!container) return;

      if (!selectedGroupId) {
        container.scrollTo({ left: 0, behavior: 'smooth' });
        return;
      }

      const button = groupButtonRefs.current.get(selectedGroupId);
      if (!button) return;

      const containerRect = container.getBoundingClientRect();
      const buttonRect = button.getBoundingClientRect();

      if (containerRect.width === 0) return;

      const scrollLeft = container.scrollLeft + buttonRect.left - containerRect.left - (containerRect.width / 2) + (buttonRect.width / 2);

      container.scrollTo({
        left: Math.max(0, scrollLeft),
        behavior: 'smooth'
      });
    }, 100);

    return () => clearTimeout(timer);
  }, [selectedGroupId, muscleGroups?.length]);

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

  const handleExerciseSelect = (exercise: MuscleGroupExerciseWithGroup) => {
    setLocalSelectedId(exercise.id);
    setTimeout(() => {
      onExerciseSelect(exercise);
    }, 300);
  };

  useEffect(() => {
    if (exerciseListRef.current) {
      exerciseListRef.current.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [selectedGroupId, searchQuery]);

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Sticky Filters Header */}
      <div className="shrink-0 bg-[#0A0A0A] border-b border-white/6 z-10">
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
            <div ref={scrollContainerRef} className="flex gap-2 overflow-x-auto scrollbar-hide pb-2">
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
                  ref={(el) => {
                    if (el) {
                      groupButtonRefs.current.set(group.id, el);
                    } else {
                      groupButtonRefs.current.delete(group.id);
                    }
                  }}
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
      <div ref={exerciseListRef} className="flex-1 overflow-y-auto min-h-0">
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
                  onClick={() => handleExerciseSelect(exercise)}
                  className="w-full flex items-center gap-3 p-3 bg-[#1C1C1E] rounded-xl text-left active:scale-[0.98] transition-all hover:bg-[#2C2C2E]"
                >
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
  );
}
