"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  X,
  Plus,
  Calendar as CalendarIcon,
  ChevronRight,
  Dumbbell,
  Check,
  Loader2,
  Trash2
} from "lucide-react";
import { useImportExercise, type MuscleGroupExerciseWithGroup } from "@/lib/queries";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import Link from "next/link";
import { ExercisePicker } from "@/components/exercise-picker";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";

interface ImportSet {
  reps: number;
  weight: number;
}

interface ImportExerciseEntry {
  exerciseId: string;
  exerciseName: string;
  sets: ImportSet[];
}

export default function ImportPage() {
  const importExercise = useImportExercise();

  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [exercises, setExercises] = useState<ImportExerciseEntry[]>([]);
  const [isExercisePickerOpen, setIsExercisePickerOpen] = useState(false);

  const handleAddExercise = () => {
    setIsExercisePickerOpen(true);
  };

  const handleRemoveExercise = (exIndex: number) => {
    setExercises(prev => prev.filter((_, i) => i !== exIndex));
  };

  const handleAddSet = (exIndex: number) => {
    setExercises(prev => prev.map((ex, i) =>
      i === exIndex
        ? { ...ex, sets: [...ex.sets, { reps: 0, weight: 0 }] }
        : ex
    ));
  };

  const handleRemoveSet = (exIndex: number, setIndex: number) => {
    setExercises(prev => prev.map((ex, i) => {
      if (i !== exIndex) return ex;
      const newSets = ex.sets.filter((_, si) => si !== setIndex);
      return {
        ...ex,
        sets: newSets.length === 0 ? [{ reps: 0, weight: 0 }] : newSets
      };
    }));
  };

  const handleSetChange = (exIndex: number, setIndex: number, field: keyof ImportSet, value: string) => {
    const numericValue = parseFloat(value) || 0;
    setExercises(prev => prev.map((ex, i) =>
      i === exIndex
        ? {
            ...ex,
            sets: ex.sets.map((s, si) =>
              si === setIndex ? { ...s, [field]: numericValue } : s
            )
          }
        : ex
    ));
  };

  const handleImport = async () => {
    if (exercises.length === 0) {
      toast.error("Please add at least one exercise");
      return;
    }

    const validExercises = exercises.map(ex => ({
      ...ex,
      sets: ex.sets.filter(s => s.reps > 0 && s.weight > 0)
    })).filter(ex => ex.sets.length > 0);

    if (validExercises.length === 0) {
      toast.error("Please add at least one valid set (reps and weight > 0)");
      return;
    }

    try {
      await importExercise.mutateAsync({
        date: new Date(date).toISOString(),
        exercises: validExercises,
      });
      toast.success("Workout history imported successfully");
      // Clear state on success
      setExercises([]);
      setDate(new Date().toISOString().split('T')[0]);
    } catch (error) {
      console.error(error);
      toast.error("Failed to import data");
    }
  };

  const handleExerciseSelect = (exercise: MuscleGroupExerciseWithGroup) => {
    setExercises([...exercises, {
      exerciseId: exercise.id,
      exerciseName: exercise.name,
      sets: [{ reps: 0, weight: 0 }]
    }]);
    setIsExercisePickerOpen(false);
  };

  return (
    <div className="min-h-screen bg-black text-white flex flex-col">
      <header className="fixed top-0 left-0 right-0 z-50 bg-black/95 backdrop-blur-xl border-b border-white/5">
        <div className="flex items-center justify-between h-14 px-4">
          <Link href="/" className="p-2 -ml-2 rounded-full active:bg-white/10 transition-colors">
            <X className="w-6 h-6 text-[#8E8E93]" />
          </Link>
          <h1 className="text-[17px] font-semibold text-white">Import History</h1>
          <div className="w-10" />
        </div>
      </header>

      <main className="flex-1 px-6 pt-20 pb-32">
        <div className="space-y-8">
          {/* Date Selection */}
          <section>
            <label className="text-[13px] font-medium text-[#8E8E93] uppercase tracking-wider mb-3 block">
              Date
            </label>
            <div className="relative">
              <div className="absolute left-5 top-1/2 -translate-y-1/2 pointer-events-none">
                <CalendarIcon className="w-5 h-5 text-[#0078FF]" />
              </div>
              <input
                type="date"
                className="w-full h-14 bg-[#1C1C1E] border border-white/5 rounded-2xl pl-14 pr-4 text-[17px] focus:outline-none focus:ring-2 focus:ring-[#0078FF]/50 transition-all appearance-none"
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
            </div>
          </section>

          {/* Exercises List */}
          <section className="space-y-6">
            <div className="flex items-center justify-between">
              <label className="text-[13px] font-medium text-[#8E8E93] uppercase tracking-wider block">
                Exercises
              </label>
              <span className="text-[13px] text-[#8E8E93]">
                {exercises.length} {exercises.length === 1 ? 'exercise' : 'exercises'}
              </span>
            </div>

            {exercises.length === 0 && (
              <div className="text-center py-10 border border-dashed border-white/10 rounded-3xl">
                <Dumbbell className="w-10 h-10 text-[#2C2C2E] mx-auto mb-3" />
                <p className="text-[#636366] text-[15px]">No exercises added yet</p>
              </div>
            )}

            <div className="space-y-6">
              {exercises.map((ex, exIndex) => (
                <div key={exIndex} className="bg-[#1C1C1E] rounded-3xl overflow-hidden border border-white/5 shadow-lg">
                  <div className="px-4 py-3 bg-white/5 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-[#0078FF]/20 flex items-center justify-center">
                        <Dumbbell className="w-4 h-4 text-[#0078FF]" />
                      </div>
                      <span className="text-[15px] font-semibold">{ex.exerciseName}</span>
                    </div>
                    <button
                      onClick={() => handleRemoveExercise(exIndex)}
                      className="p-2 text-[#FF453A] active:scale-90 transition-transform"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="p-4 space-y-3">
                    <div className="grid grid-cols-[2.5rem_1fr_1fr_2.5rem] gap-2 px-1">
                      <span className="text-[10px] text-[#636366] uppercase text-center font-medium">Set</span>
                      <span className="text-[10px] text-[#636366] uppercase text-center font-medium">Reps</span>
                      <span className="text-[10px] text-[#636366] uppercase text-center font-medium">kg</span>
                      <span />
                    </div>

                    {ex.sets.map((set, setIndex) => (
                      <div key={setIndex} className="grid grid-cols-[2.5rem_1fr_1fr_2.5rem] gap-2 items-center">
                        <div className="h-11 flex items-center justify-center bg-white/5 rounded-xl text-[14px] font-mono text-[#8E8E93]">
                          {setIndex + 1}
                        </div>
                        <input
                          type="number"
                          inputMode="numeric"
                          className="h-11 min-w-0 bg-black/40 border border-white/5 rounded-xl text-center text-[17px] font-semibold focus:outline-none focus:ring-2 focus:ring-[#0078FF]/50"
                          placeholder="0"
                          value={set.reps || ""}
                          onChange={(e) => handleSetChange(exIndex, setIndex, "reps", e.target.value)}
                        />
                        <input
                          type="number"
                          inputMode="decimal"
                          step="0.5"
                          className="h-11 min-w-0 bg-black/40 border border-white/5 rounded-xl text-center text-[17px] font-semibold focus:outline-none focus:ring-2 focus:ring-[#0078FF]/50"
                          placeholder="0"
                          value={set.weight || ""}
                          onChange={(e) => handleSetChange(exIndex, setIndex, "weight", e.target.value)}
                        />
                        <button
                          onClick={() => handleRemoveSet(exIndex, setIndex)}
                          className="h-11 flex items-center justify-center text-[#FF453A]/50 hover:text-[#FF453A] active:scale-90 transition-all"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}

                    <button
                      onClick={() => handleAddSet(exIndex)}
                      className="w-full py-3 flex items-center justify-center gap-2 text-[#0078FF] text-[13px] font-medium bg-[#0078FF]/5 hover:bg-[#0078FF]/10 rounded-xl transition-all"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      Add Set
                    </button>
                  </div>
                </div>
              ))}

              <button
                onClick={handleAddExercise}
                className="w-full py-4 flex items-center justify-center gap-2 text-[#0078FF] text-[15px] font-semibold border-2 border-dashed border-[#0078FF]/20 rounded-3xl active:bg-[#0078FF]/5 transition-all"
              >
                <Plus className="w-5 h-5" />
                Add Exercise
              </button>
            </div>
          </section>
        </div>
      </main>

      {/* Action Footer */}
      <footer className="fixed bottom-0 left-0 right-0 p-6 bg-linear-to-t from-black via-black/95 to-transparent pt-10">
        <button
          onClick={handleImport}
          disabled={importExercise.isPending || exercises.length === 0}
          className="w-full py-4 bg-[#0078FF] rounded-2xl text-[17px] font-semibold text-white active:scale-95 transition-all duration-200 disabled:opacity-50 flex items-center justify-center gap-2 shadow-[0_0_32px_rgba(0,120,255,0.4)]"
        >
          {importExercise.isPending ? (
            <Loader2 className="w-6 h-6 animate-spin" />
          ) : (
            <>
              <Check className="w-5 h-5" />
              Save Historical Data
            </>
          )}
        </button>
      </footer>

      <Drawer open={isExercisePickerOpen} onOpenChange={setIsExercisePickerOpen}>
        <DrawerContent className="max-w-lg mx-auto h-[85vh] bg-[#0A0A0A]">
          <div className="flex flex-col h-full">
            <DrawerHeader className="text-center border-b border-white/6 pb-4 shrink-0">
              <div className="flex items-center justify-between">
                <div className="w-10" />
                <DrawerTitle className="text-[17px] font-semibold text-white flex-1 text-center">
                  Select Exercise
                </DrawerTitle>
                <button
                  onClick={() => setIsExercisePickerOpen(false)}
                  className="w-10 h-10 flex items-center justify-center rounded-full bg-[#1C1C1E] active:scale-95"
                >
                  <X className="w-5 h-5 text-[#8E8E93]" />
                </button>
              </div>
            </DrawerHeader>

            <div className="flex-1 overflow-hidden">
              <ExercisePicker onExerciseSelect={handleExerciseSelect} />
            </div>
          </div>
        </DrawerContent>
      </Drawer>
    </div>
  );
}
