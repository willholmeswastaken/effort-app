"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  X,
  Plus,
  Calendar as CalendarIcon,
  Search,
  ChevronRight,
  Dumbbell,
  Check,
  Loader2,
  Trash2
} from "lucide-react";
import { useMuscleGroups, useImportExercise } from "@/lib/queries";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import Link from "next/link";

interface ImportSet {
  reps: number;
  weight: number;
}

export default function ImportPage() {
  const router = useRouter();
  const { data: muscleGroups, isLoading: isLoadingExercises } = useMuscleGroups();
  const importExercise = useImportExercise();

  const [selectedExercise, setSelectedExercise] = useState<{ id: string; name: string } | null>(null);
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [sets, setSets] = useState<ImportSet[]>([{ reps: 0, weight: 0 }]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isExercisePickerOpen, setIsExercisePickerOpen] = useState(false);

  const filteredExercises = useMemo(() => {
    if (!muscleGroups) return [];

    const allExercises = muscleGroups.flatMap(mg =>
      mg.exercises.map(ex => ({
        ...ex,
        groupName: mg.name
      }))
    );

    if (!searchQuery) return allExercises;

    return allExercises.filter(ex =>
      ex.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ex.groupName.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [muscleGroups, searchQuery]);

  const handleAddSet = () => {
    setSets([...sets, { reps: 0, weight: 0 }]);
  };

  const handleRemoveSet = (index: number) => {
    if (sets.length === 1) {
      setSets([{ reps: 0, weight: 0 }]);
      return;
    }
    const newSets = [...sets];
    newSets.splice(index, 1);
    setSets(newSets);
  };

  const handleSetChange = (index: number, field: keyof ImportSet, value: string) => {
    const newSets = [...sets];
    newSets[index] = {
      ...newSets[index],
      [field]: parseFloat(value) || 0
    };
    setSets(newSets);
  };

  const handleImport = async () => {
    if (!selectedExercise) {
      toast.error("Please select an exercise");
      return;
    }

    const validSets = sets.filter(s => s.reps > 0 && s.weight > 0);
    if (validSets.length === 0) {
      toast.error("Please add at least one valid set (reps and weight > 0)");
      return;
    }

    try {
      await importExercise.mutateAsync({
        exerciseId: selectedExercise.id,
        exerciseName: selectedExercise.name,
        date: new Date(date).toISOString(),
        sets: validSets,
      });
      toast.success("Exercise data imported successfully");
      router.push("/history");
    } catch (error) {
      console.error(error);
      toast.error("Failed to import exercise data");
    }
  };

  if (isExercisePickerOpen) {
    return (
      <div className="min-h-screen bg-black text-white p-6">
        <header className="flex items-center justify-between mb-8">
          <button
            onClick={() => setIsExercisePickerOpen(false)}
            className="p-2 -ml-2 rounded-full active:bg-white/10 transition-colors"
          >
            <X className="w-6 h-6 text-[#8E8E93]" />
          </button>
          <h1 className="text-[17px] font-semibold">Select Exercise</h1>
          <div className="w-10" />
        </header>

        <div className="relative mb-6">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#8E8E93]" />
          <input
            type="text"
            placeholder="Search exercises..."
            className="w-full h-12 bg-[#1C1C1E] rounded-2xl pl-12 pr-4 text-[17px] focus:outline-none focus:ring-2 focus:ring-[#0078FF]/50 transition-all"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            autoFocus
          />
        </div>

        <div className="space-y-2">
          {isLoadingExercises ? (
            <div className="flex justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-[#0078FF]" />
            </div>
          ) : (
            filteredExercises.map((ex) => (
              <button
                key={ex.id}
                onClick={() => {
                  setSelectedExercise({ id: ex.id, name: ex.name });
                  setIsExercisePickerOpen(false);
                }}
                className="w-full flex items-center justify-between p-4 bg-[#1C1C1E] rounded-2xl active:bg-[#2C2C2E] transition-all"
              >
                <div className="text-left">
                  <p className="text-[17px] font-medium">{ex.name}</p>
                  <p className="text-[13px] text-[#8E8E93]">{ex.groupName}</p>
                </div>
                <ChevronRight className="w-5 h-5 text-[#48484A]" />
              </button>
            ))
          )}
          {!isLoadingExercises && filteredExercises.length === 0 && (
            <p className="text-center text-[#8E8E93] py-12">No exercises found</p>
          )}
        </div>
      </div>
    );
  }

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
          {/* Exercise Selection */}
          <section>
            <label className="text-[13px] font-medium text-[#8E8E93] uppercase tracking-wider mb-3 block">
              Exercise
            </label>
            <button
              onClick={() => setIsExercisePickerOpen(true)}
              className={cn(
                "w-full flex items-center justify-between p-5 rounded-2xl border transition-all active:scale-[0.98]",
                selectedExercise
                  ? "bg-[#1C1C1E] border-[#0078FF]/30 text-white"
                  : "bg-black border-white/10 text-[#8E8E93]"
              )}
            >
              <div className="flex items-center gap-4">
                <div className={cn(
                  "w-10 h-10 rounded-xl flex items-center justify-center",
                  selectedExercise ? "bg-[#0078FF]/20" : "bg-white/5"
                )}>
                  <Dumbbell className={cn("w-5 h-5", selectedExercise ? "text-[#0078FF]" : "text-[#8E8E93]")} />
                </div>
                <span className="text-[17px] font-medium">
                  {selectedExercise ? selectedExercise.name : "Select Exercise"}
                </span>
              </div>
              <ChevronRight className="w-5 h-5 text-[#48484A]" />
            </button>
          </section>

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

          {/* Sets Editor */}
          <section>
            <div className="flex items-center justify-between mb-4">
              <label className="text-[13px] font-medium text-[#8E8E93] uppercase tracking-wider">
                Sets
              </label>
              <span className="text-[13px] text-[#8E8E93]">
                {sets.length} {sets.length === 1 ? 'set' : 'sets'}
              </span>
            </div>

            <div className="space-y-3">
              <div className="grid grid-cols-[2.5rem_1fr_1fr_2.5rem] gap-2 px-1">
                <span className="text-[10px] text-[#636366] uppercase text-center font-medium">Set</span>
                <span className="text-[10px] text-[#636366] uppercase text-center font-medium">kg</span>
                <span className="text-[10px] text-[#636366] uppercase text-center font-medium">Reps</span>
                <span />
              </div>

              {sets.map((set, index) => (
                <div key={index} className="grid grid-cols-[2.5rem_1fr_1fr_2.5rem] gap-2 items-center">
                  <div className="h-12 flex items-center justify-center bg-white/5 rounded-xl text-[15px] font-mono text-[#8E8E93]">
                    {index + 1}
                  </div>
                  <input
                    type="number"
                    inputMode="decimal"
                    step="0.5"
                    className="h-12 min-w-0 bg-[#1C1C1E] border border-white/5 rounded-xl text-center text-[17px] font-semibold focus:outline-none focus:ring-2 focus:ring-[#0078FF]/50"
                    placeholder="0"
                    value={set.weight || ""}
                    onChange={(e) => handleSetChange(index, "weight", e.target.value)}
                  />
                  <input
                    type="number"
                    inputMode="numeric"
                    className="h-12 min-w-0 bg-[#1C1C1E] border border-white/5 rounded-xl text-center text-[17px] font-semibold focus:outline-none focus:ring-2 focus:ring-[#0078FF]/50"
                    placeholder="0"
                    value={set.reps || ""}
                    onChange={(e) => handleSetChange(index, "reps", e.target.value)}
                  />
                  <button
                    onClick={() => handleRemoveSet(index)}
                    className="h-12 flex items-center justify-center text-[#FF453A] active:scale-90 transition-transform"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              ))}

              <button
                onClick={handleAddSet}
                className="w-full py-4 flex items-center justify-center gap-2 text-[#0078FF] text-[15px] font-medium border border-dashed border-[#0078FF]/30 rounded-2xl active:bg-[#0078FF]/5 transition-all mt-4"
              >
                <Plus className="w-4 h-4" />
                Add Another Set
              </button>
            </div>
          </section>
        </div>
      </main>

      {/* Action Footer */}
      <footer className="fixed bottom-0 left-0 right-0 p-6 bg-linear-to-t from-black via-black/95 to-transparent pt-10">
        <button
          onClick={handleImport}
          disabled={importExercise.isPending || !selectedExercise}
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
    </div>
  );
}
