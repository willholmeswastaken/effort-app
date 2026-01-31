"use client";

import { Exercise } from "@/lib/types";
import { exercises } from "@/lib/data"; // Need to export exercises from data.ts
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Repeat } from "lucide-react";

// I need to update lib/data.ts to export 'exercises' map or provide a helper functions.
// I'll assume I can access the exercises map.

interface ExerciseSwapperProps {
  currentExercise: Exercise;
  onSwap: (newExercise: Exercise) => void;
  availableExercises: Exercise[]; // Passed in or fetched
}

export function ExerciseSwapper({ currentExercise, onSwap, availableExercises }: ExerciseSwapperProps) {
  if (!availableExercises || availableExercises.length === 0) return null;

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
          <Repeat className="h-4 w-4" />
          <span className="sr-only">Swap Exercise</span>
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Swap Exercise</DialogTitle>
          <DialogDescription>
            Choose an alternative for {currentExercise.name}
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-2">
          {availableExercises.map((ex) => (
            <Button key={ex.id} variant="outline" className="justify-start" onClick={() => onSwap(ex)}>
              {ex.name}
            </Button>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
