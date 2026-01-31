"use client";

import { useState } from "react";
import { ChevronLeft, Loader2 } from "lucide-react";
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
  const [selectedGroup, setSelectedGroup] = useState<MuscleGroup | null>(null);
  const { data: muscleGroups, isLoading, error } = useMuscleGroups();

  const handleGroupSelect = (group: MuscleGroup) => {
    setSelectedGroup(group);
  };

  const handleBack = () => {
    setSelectedGroup(null);
  };

  const handleExerciseSelect = (exercise: MuscleGroupExercise) => {
    onExerciseSelect(exercise);
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      setSelectedGroup(null);
    }
    onOpenChange(newOpen);
  };

  return (
    <Drawer open={open} onOpenChange={handleOpenChange} dismissible={!isSwapping}>
      <DrawerContent className="max-w-lg mx-auto max-h-[85vh]">
        <DrawerHeader className="text-center border-b border-white/5 pb-4">
          {selectedGroup ? (
            <div className="flex items-center justify-between">
              <button
                onClick={handleBack}
                disabled={isSwapping}
                className="w-10 h-10 flex items-center justify-center rounded-full bg-[#2C2C2E] active:bg-[#3A3A3C] transition-colors disabled:opacity-50"
              >
                <ChevronLeft className="w-5 h-5 text-white" />
              </button>
              <DrawerTitle className="text-[17px] font-semibold text-white flex-1 text-center">
                {selectedGroup.name}
              </DrawerTitle>
              <div className="w-10" />
            </div>
          ) : (
            <>
              <DrawerTitle className="text-[17px] font-semibold text-white">
                Swap Exercise
              </DrawerTitle>
              <p className="text-[13px] text-[#8E8E93] mt-1">
                Replacing: {currentExerciseName}
              </p>
            </>
          )}
        </DrawerHeader>

        <div className="flex-1 overflow-y-auto px-4 pb-8 relative">
          {isSwapping && (
            <div className="absolute inset-0 z-50 bg-black/60 backdrop-blur-[2px] flex items-center justify-center animate-in fade-in duration-200">
              <div className="bg-[#1C1C1E] p-6 rounded-2xl shadow-2xl flex flex-col items-center gap-3 border border-white/5">
                <Loader2 className="w-8 h-8 animate-spin text-[#0078FF]" />
                <span className="text-[15px] font-medium text-white">Replacing...</span>
              </div>
            </div>
          )}

          {isLoading && (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-6 h-6 animate-spin text-[#0078FF]" />
            </div>
          )}

          {error && (
            <div className="text-center py-12 text-[#FF3B30]">
              Failed to load exercises
            </div>
          )}

          {!isLoading && !error && !selectedGroup && muscleGroups && (
            <div className="grid grid-cols-2 gap-3 pt-4">
              {muscleGroups.map((group) => (
                <button
                  key={group.id}
                  disabled={isSwapping}
                  onClick={() => handleGroupSelect(group)}
                  className="relative aspect-4/3 rounded-2xl overflow-hidden active:scale-[0.98] transition-transform disabled:opacity-50"
                >
                  {group.coverImage ? (
                    <Image
                      src={group.coverImage}
                      alt={group.name}
                      fill
                      className="object-cover"
                      sizes="(max-width: 768px) 50vw, 200px"
                    />
                  ) : (
                    <div className="absolute inset-0 bg-linear-to-br from-[#2C2C2E] to-[#1C1C1E]" />
                  )}
                  <div className="absolute inset-0 bg-linear-to-t from-black/80 via-black/20 to-transparent" />
                  <div className="absolute bottom-0 left-0 right-0 p-3">
                    <span className="text-[15px] font-semibold text-white">
                      {group.name}
                    </span>
                    <span className="text-[12px] text-white/70 ml-2">
                      {group.exercises.length}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          )}

          {!isLoading && !error && selectedGroup && (
            <div className="pt-4 space-y-2">
              {selectedGroup.exercises.map((exercise) => (
                <button
                  key={exercise.id}
                  disabled={isSwapping}
                  onClick={() => handleExerciseSelect(exercise)}
                  className="w-full flex items-center gap-3 p-3 bg-[#2C2C2E] rounded-xl active:bg-[#3A3A3C] transition-colors text-left disabled:opacity-50"
                >
                  {exercise.thumbnailUrl ? (
                    <div className="w-12 h-12 rounded-lg overflow-hidden shrink-0 relative">
                      <Image
                        src={exercise.thumbnailUrl}
                        alt={exercise.name}
                        fill
                        className="object-cover"
                        sizes="48px"
                      />
                    </div>
                  ) : (
                    <div className="w-12 h-12 rounded-lg bg-[#3A3A3C] shrink-0" />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-[15px] font-medium text-white truncate">
                      {exercise.name}
                    </p>
                    <p className="text-[13px] text-[#8E8E93]">
                      {exercise.targetSets || 3} × {exercise.targetReps || "8-12"}
                    </p>
                  </div>
                </button>
              ))}

              {selectedGroup.exercises.length === 0 && (
                <div className="text-center py-12 text-[#8E8E93]">
                  No exercises in this group
                </div>
              )}
            </div>
          )}
        </div>
      </DrawerContent>
    </Drawer>
  );
}
