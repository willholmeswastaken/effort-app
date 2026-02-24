"use client";

import { Check, X } from "lucide-react";
import { type MuscleGroupExerciseWithGroup } from "@/lib/queries";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerFooter,
} from "@/components/ui/drawer";
import { ExercisePicker } from "./exercise-picker";

interface ExerciseSwapDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onExerciseSelect: (exercise: MuscleGroupExerciseWithGroup) => void;
  currentExerciseName: string;
  currentMuscleGroupId?: string | null;
  isSwapping?: boolean;
}

export function ExerciseSwapDrawer({
  open,
  onOpenChange,
  onExerciseSelect,
  currentExerciseName,
  currentMuscleGroupId,
  isSwapping = false,
}: ExerciseSwapDrawerProps) {
  return (
    <Drawer open={open} onOpenChange={onOpenChange} dismissible={!isSwapping}>
      <DrawerContent className="max-w-lg mx-auto h-[85vh] bg-[#0A0A0A]">
        <div className="flex flex-col h-full">
          {/* Header */}
          <DrawerHeader className="text-center border-b border-white/6 pb-4 shrink-0">
            <div className="flex items-center justify-between">
              <div className="w-10" />
              <DrawerTitle className="text-[17px] font-semibold text-white flex-1 text-center">
                Swap Exercise
              </DrawerTitle>
              <button
                onClick={() => onOpenChange(false)}
                disabled={isSwapping}
                className="w-10 h-10 flex items-center justify-center rounded-full bg-[#1C1C1E] active:scale-95 disabled:opacity-50"
              >
                <X className="w-5 h-5 text-[#8E8E93]" />
              </button>
            </div>
            <p className="text-[13px] text-[#8E8E93] mt-1">
              Replacing: <span className="text-white">{currentExerciseName}</span>
            </p>
          </DrawerHeader>

          <div className="flex-1 overflow-hidden">
            <ExercisePicker
              onExerciseSelect={onExerciseSelect}
              initialMuscleGroupId={currentMuscleGroupId}
            />
          </div>

          <DrawerFooter className="border-t border-white/6 bg-[#0A0A0A] p-4 shrink-0">
            <button
              onClick={() => onOpenChange(false)}
              disabled={isSwapping}
              className="w-full h-12 bg-[#1C1C1E] rounded-xl text-[15px] font-medium text-white active:scale-[0.98] active:bg-[#2C2C2E] transition-all disabled:opacity-50"
            >
              Cancel
            </button>
          </DrawerFooter>
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
