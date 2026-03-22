"use client";

import { useState, useCallback, useRef } from "react";
import Link from "next/link";
import {
  ChevronLeft,
  GripVertical,
  Plus,
  Trash2,
  Loader2,
  Save,
  Pencil,
  Check,
  X,
  Copy,
} from "lucide-react";
import { toast } from "sonner";
import {
  useAdminWeek,
  useSaveWeek,
  useUpdateProgram,
  useCreateExercise,
  type AdminWeekDay,
  type AdminWeekExercise,
} from "@/lib/queries/admin";
import { useMuscleGroups } from "@/lib/queries";
import { ExerciseSwapDrawer } from "@/components/exercise-swap-drawer";
import type { MuscleGroupExerciseWithGroup } from "@/lib/queries";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface ProgramInfo {
  id: string;
  name: string;
  description: string | null;
  daysPerWeek: number;
  weeks: Array<{ id: string; weekNumber: number }>;
}

interface EditorExercise {
  tempId: string;
  exerciseId: string;
  exerciseName: string;
  muscleGroupId: string | null;
  exerciseOrder: number;
  targetSets: number;
  targetReps: string;
  restSeconds: number;
  targetSetsOverride: number | null;
  targetRepsOverride: string | null;
  restSecondsOverride: number | null;
  dayExerciseId?: string;
}

interface EditorDay {
  id?: string;
  title: string;
  dayOrder: number;
  exercises: EditorExercise[];
}

function generateId() {
  return `temp-${Math.random().toString(36).slice(2, 9)}`;
}

function exerciseToEditor(ex: AdminWeekExercise): EditorExercise {
  return {
    tempId: ex.dayExerciseId,
    exerciseId: ex.exerciseId,
    exerciseName: ex.exerciseName,
    muscleGroupId: ex.muscleGroupId,
    exerciseOrder: ex.exerciseOrder,
    targetSets: ex.targetSets,
    targetReps: ex.targetReps,
    restSeconds: ex.restSeconds,
    targetSetsOverride: ex.targetSetsOverride,
    targetRepsOverride: ex.targetRepsOverride,
    restSecondsOverride: ex.restSecondsOverride,
    dayExerciseId: ex.dayExerciseId,
  };
}

function dayToEditor(day: AdminWeekDay): EditorDay {
  return {
    id: day.id,
    title: day.title,
    dayOrder: day.dayOrder,
    exercises: day.exercises.map((ex) => exerciseToEditor(ex)),
  };
}

function getEffectiveSets(ex: EditorExercise): number {
  return ex.targetSetsOverride ?? ex.targetSets;
}

function getEffectiveReps(ex: EditorExercise): string {
  return ex.targetRepsOverride ?? ex.targetReps;
}

function getEffectiveRest(ex: EditorExercise): number {
  return ex.restSecondsOverride ?? ex.restSeconds;
}

// ─── Create Exercise Dialog ─────────────────────────────────────────────────────

function CreateExerciseDialog({
  open,
  onOpenChange,
  onCreated,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: (exercise: MuscleGroupExerciseWithGroup) => void;
}) {
  const { data: muscleGroups = [] } = useMuscleGroups({ enabled: open });
  const createExercise = useCreateExercise();
  const [form, setForm] = useState({
    name: "",
    muscleGroupId: "",
    targetSets: 3,
    targetReps: "8-12",
    restSeconds: 90,
  });

  const handleCreate = async () => {
    if (!form.name.trim() || !form.muscleGroupId) {
      toast.error("Name and muscle group are required");
      return;
    }
    const id = form.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
    try {
      await createExercise.mutateAsync({
        id,
        name: form.name,
        muscleGroupId: form.muscleGroupId,
        targetSets: form.targetSets,
        targetReps: form.targetReps,
        restSeconds: form.restSeconds,
      });
      const group = muscleGroups.find((g) => g.id === form.muscleGroupId);
      onCreated({
        id,
        name: form.name,
        thumbnailUrl: null,
        targetSets: form.targetSets,
        targetReps: form.targetReps,
        restSeconds: form.restSeconds,
        videoUrl: null,
        muscleGroupId: form.muscleGroupId,
        groupName: group?.name ?? "",
        groupId: form.muscleGroupId,
      });
      setForm({ name: "", muscleGroupId: "", targetSets: 3, targetReps: "8-12", restSeconds: 90 });
      onOpenChange(false);
      toast.success("Exercise created");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to create exercise");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-[#1C1C1E] border-white/5 text-white">
        <DialogHeader>
          <DialogTitle>New Exercise</DialogTitle>
          <DialogDescription className="text-[#8E8E93]">
            Add a new exercise to the library.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div>
            <label className="text-[13px] font-medium text-[#8E8E93] mb-1.5 block">
              Name
            </label>
            <Input
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              placeholder="e.g. Barbell Row"
              className="bg-[#0A0A0A] border-white/10"
              autoFocus
            />
          </div>
          <div>
            <label className="text-[13px] font-medium text-[#8E8E93] mb-1.5 block">
              Muscle Group
            </label>
            <Select
              value={form.muscleGroupId}
              onValueChange={(v) => setForm((f) => ({ ...f, muscleGroupId: v }))}
            >
              <SelectTrigger className="bg-[#0A0A0A] border-white/10">
                <SelectValue placeholder="Select muscle group" />
              </SelectTrigger>
              <SelectContent className="bg-[#1C1C1E] border-white/10">
                {muscleGroups.map((g) => (
                  <SelectItem key={g.id} value={g.id} className="focus:bg-white/5">
                    {g.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="text-[13px] font-medium text-[#8E8E93] mb-1.5 block">
                Sets
              </label>
              <Input
                type="number"
                min={1}
                value={form.targetSets}
                onChange={(e) =>
                  setForm((f) => ({ ...f, targetSets: parseInt(e.target.value) || 3 }))
                }
                className="bg-[#0A0A0A] border-white/10 font-mono"
              />
            </div>
            <div>
              <label className="text-[13px] font-medium text-[#8E8E93] mb-1.5 block">
                Reps
              </label>
              <Input
                value={form.targetReps}
                onChange={(e) => setForm((f) => ({ ...f, targetReps: e.target.value }))}
                placeholder="8-12"
                className="bg-[#0A0A0A] border-white/10 font-mono"
              />
            </div>
            <div>
              <label className="text-[13px] font-medium text-[#8E8E93] mb-1.5 block">
                Rest (s)
              </label>
              <Input
                type="number"
                min={0}
                value={form.restSeconds}
                onChange={(e) =>
                  setForm((f) => ({ ...f, restSeconds: parseInt(e.target.value) || 90 }))
                }
                className="bg-[#0A0A0A] border-white/10 font-mono"
              />
            </div>
          </div>
        </div>
        <DialogFooter>
          <button
            onClick={() => onOpenChange(false)}
            className="px-4 py-2 rounded-xl bg-[#2C2C2E] text-[14px] font-medium text-white active:scale-95 transition-all"
          >
            Cancel
          </button>
          <button
            onClick={handleCreate}
            disabled={createExercise.isPending}
            className="px-4 py-2 rounded-xl bg-[#0078FF] text-[14px] font-medium text-white active:scale-95 transition-all disabled:opacity-50 flex items-center gap-2"
          >
            {createExercise.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
            Create
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Exercise Row ───────────────────────────────────────────────────────────────

function ExerciseRow({
  exercise,
  index,
  onUpdate,
  onRemove,
  dragProps,
}: {
  exercise: EditorExercise;
  index: number;
  onUpdate: (id: string, updates: Partial<EditorExercise>) => void;
  onRemove: (id: string) => void;
  dragProps: {
    draggable: boolean;
    onDragStart: (e: React.DragEvent) => void;
    onDragEnd: (e: React.DragEvent) => void;
  };
}) {
  const [isEditing, setIsEditing] = useState(false);

  const handleSetsChange = (value: string) => {
    const num = parseInt(value);
    if (!isNaN(num) && num > 0) {
      onUpdate(exercise.tempId, { targetSetsOverride: num });
    } else if (value === "") {
      onUpdate(exercise.tempId, { targetSetsOverride: null });
    }
  };

  const handleRepsChange = (value: string) => {
    onUpdate(exercise.tempId, { targetRepsOverride: value || null });
  };

  const handleRestChange = (value: string) => {
    const num = parseInt(value);
    if (!isNaN(num) && num > 0) {
      onUpdate(exercise.tempId, { restSecondsOverride: num });
    } else if (value === "") {
      onUpdate(exercise.tempId, { restSecondsOverride: null });
    }
  };

  return (
    <div
      {...dragProps}
      className="flex items-center gap-2 py-2.5 px-3 group cursor-grab active:cursor-grabbing touch-none"
    >
      {/* Drag indicator (visual only — whole row is draggable) */}
      <div className="flex flex-col items-center gap-0.5 shrink-0 opacity-30 group-hover:opacity-100 transition-opacity select-none">
        <GripVertical className="w-4 h-4 text-[#8E8E93]" />
        <span className="text-[10px] text-[#48484A] font-mono w-5 text-center">
          {index + 1}
        </span>
      </div>

      {/* Exercise info */}
      <div className="flex-1 min-w-0">
        <p className="text-[14px] font-medium truncate">{exercise.exerciseName}</p>
        <div className="flex items-center gap-3 mt-1">
          {isEditing ? (
            <>
              <div className="flex items-center gap-1">
                <input
                  type="number"
                  value={exercise.targetSetsOverride ?? ""}
                  onChange={(e) => handleSetsChange(e.target.value)}
                  placeholder={`${exercise.targetSets}`}
                  className="w-10 h-6 bg-[#0A0A0A] rounded text-center text-[12px] font-mono text-white border border-white/10 focus:border-[#0078FF] focus:outline-none"
                />
                <span className="text-[11px] text-[#8E8E93]">sets</span>
              </div>
              <div className="flex items-center gap-1">
                <input
                  type="text"
                  value={exercise.targetRepsOverride ?? ""}
                  onChange={(e) => handleRepsChange(e.target.value)}
                  placeholder={exercise.targetReps}
                  className="w-14 h-6 bg-[#0A0A0A] rounded text-center text-[12px] font-mono text-white border border-white/10 focus:border-[#0078FF] focus:outline-none"
                />
                <span className="text-[11px] text-[#8E8E93]">reps</span>
              </div>
              <div className="flex items-center gap-1">
                <input
                  type="number"
                  value={exercise.restSecondsOverride ?? ""}
                  onChange={(e) => handleRestChange(e.target.value)}
                  placeholder={`${exercise.restSeconds}`}
                  className="w-10 h-6 bg-[#0A0A0A] rounded text-center text-[12px] font-mono text-white border border-white/10 focus:border-[#0078FF] focus:outline-none"
                />
                <span className="text-[11px] text-[#8E8E93]">s rest</span>
              </div>
              <button
                onClick={() => setIsEditing(false)}
                className="w-6 h-6 rounded-full bg-[#34C759] flex items-center justify-center shrink-0"
              >
                <Check className="w-3 h-3 text-black" />
              </button>
            </>
          ) : (
            <>
              <span className="font-mono text-[12px] text-[#8E8E93]">
                {getEffectiveSets(exercise)} × {getEffectiveReps(exercise)}
              </span>
              <span className="text-[12px] text-[#48484A]">
                {getEffectiveRest(exercise)}s rest
              </span>
              {exercise.targetSetsOverride != null ||
              exercise.targetRepsOverride != null ||
              exercise.restSecondsOverride != null ? (
                <span className="text-[10px] text-[#0078FF] bg-[#0078FF]/10 px-1.5 py-0.5 rounded">
                  custom
                </span>
              ) : null}
              <button
                onClick={() => setIsEditing(true)}
                className="w-6 h-6 rounded-full bg-[#2C2C2E] flex items-center justify-center shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <Pencil className="w-3 h-3 text-[#8E8E93]" />
              </button>
            </>
          )}
        </div>
      </div>

      {/* Remove button */}
      <button
        onClick={() => onRemove(exercise.tempId)}
        className="w-7 h-7 rounded-full flex items-center justify-center shrink-0 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500/10"
      >
        <X className="w-4 h-4 text-[#8E8E93] hover:text-red-400" />
      </button>
    </div>
  );
}

// ─── Day Card ───────────────────────────────────────────────────────────────────

function DayCard({
  day,
  dayIndex,
  onTitleChange,
  onExerciseUpdate,
  onExerciseRemove,
  onExerciseAdd,
  onExerciseReorder,
  onRemoveDay,
}: {
  day: EditorDay;
  dayIndex: number;
  onTitleChange: (dayIndex: number, title: string) => void;
  onExerciseUpdate: (
    dayIndex: number,
    exerciseId: string,
    updates: Partial<EditorExercise>
  ) => void;
  onExerciseRemove: (dayIndex: number, exerciseId: string) => void;
  onExerciseAdd: (dayIndex: number, exercise: MuscleGroupExerciseWithGroup) => void;
  onExerciseReorder: (dayIndex: number, fromIndex: number, toIndex: number) => void;
  onRemoveDay: (dayIndex: number) => void;
}) {
  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const dragSourceIndex = useRef<number | null>(null);

  const handleExerciseSelect = (exercise: MuscleGroupExerciseWithGroup) => {
    onExerciseAdd(dayIndex, exercise);
    setIsPickerOpen(false);
  };

  const handleCreatedExercise = (exercise: MuscleGroupExerciseWithGroup) => {
    onExerciseAdd(dayIndex, exercise);
  };

  const handleDragStart = (exIndex: number) => (e: React.DragEvent) => {
    dragSourceIndex.current = exIndex;
    e.dataTransfer.effectAllowed = "move";
    // Semi-transparent drag image
    const el = e.currentTarget as HTMLElement;
    el.style.opacity = "0.4";
  };

  const handleDragOver = (exIndex: number) => (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setDragOverIndex(exIndex);
  };

  const handleDragLeave = () => {
    setDragOverIndex(null);
  };

  const handleDrop = (toIndex: number) => (e: React.DragEvent) => {
    e.preventDefault();
    const fromIndex = dragSourceIndex.current;
    if (fromIndex !== null && fromIndex !== toIndex) {
      onExerciseReorder(dayIndex, fromIndex, toIndex);
    }
    dragSourceIndex.current = null;
    setDragOverIndex(null);
  };

  const handleDragEnd = (e: React.DragEvent) => {
    (e.currentTarget as HTMLElement).style.opacity = "1";
    dragSourceIndex.current = null;
    setDragOverIndex(null);
  };

  return (
    <div className="bg-[#1C1C1E] rounded-2xl overflow-hidden">
      {/* Day header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/5">
        {isEditingTitle ? (
          <div className="flex items-center gap-2 flex-1">
            <Input
              value={day.title}
              onChange={(e) => onTitleChange(dayIndex, e.target.value)}
              className="bg-[#0A0A0A] border-white/10 h-8 text-[15px] font-medium"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === "Enter") setIsEditingTitle(false);
              }}
            />
            <button
              onClick={() => setIsEditingTitle(false)}
              className="w-7 h-7 rounded-full bg-[#34C759] flex items-center justify-center shrink-0"
            >
              <Check className="w-4 h-4 text-black" />
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-2 flex-1">
            <h3 className="text-[15px] font-semibold">{day.title}</h3>
            <button
              onClick={() => setIsEditingTitle(true)}
              className="w-6 h-6 rounded-full bg-[#2C2C2E] flex items-center justify-center opacity-60 hover:opacity-100 transition-opacity"
            >
              <Pencil className="w-3 h-3 text-[#8E8E93]" />
            </button>
            <span className="text-[13px] text-[#8E8E93] ml-1">
              {day.exercises.length} exercises
            </span>
          </div>
        )}
        <button
          onClick={() => onRemoveDay(dayIndex)}
          className="p-1.5 text-[#8E8E93] hover:text-red-400 transition-colors"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>

      {/* Exercise list */}
      {day.exercises.length > 0 ? (
        <div className="divide-y divide-white/5">
          {day.exercises.map((ex, exIndex) => (
            <div
              key={ex.tempId}
              onDragOver={handleDragOver(exIndex)}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop(exIndex)}
              className={`transition-colors ${
                dragOverIndex === exIndex
                  ? "border-t-2 border-[#0078FF]"
                  : ""
              }`}
            >
              <ExerciseRow
                exercise={ex}
                index={exIndex}
                onUpdate={(id, updates) =>
                  onExerciseUpdate(dayIndex, id, updates)
                }
                onRemove={(id) => onExerciseRemove(dayIndex, id)}
                dragProps={{
                  draggable: true,
                  onDragStart: handleDragStart(exIndex),
                  onDragEnd: handleDragEnd,
                }}
              />
            </div>
          ))}
        </div>
      ) : (
        <div className="px-4 py-6 text-center">
          <p className="text-[13px] text-[#48484A]">No exercises yet</p>
        </div>
      )}

      {/* Add exercise buttons */}
      <div className="px-4 py-3 border-t border-white/5 flex gap-2">
        <button
          onClick={() => setIsPickerOpen(true)}
          className="flex-1 h-10 rounded-xl bg-[#0A0A0A] border border-dashed border-white/10 text-[14px] text-[#8E8E93] flex items-center justify-center gap-2 active:bg-[#1C1C1E] transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add Exercise
        </button>
        <button
          onClick={() => setIsCreateOpen(true)}
          className="h-10 px-3 rounded-xl bg-[#0A0A0A] border border-dashed border-[#0078FF]/30 text-[14px] text-[#0078FF] flex items-center justify-center gap-1.5 active:bg-[#1C1C1E] transition-colors"
        >
          <Plus className="w-4 h-4" />
          New
        </button>
      </div>

      {/* Exercise picker drawer */}
      <ExerciseSwapDrawer
        open={isPickerOpen}
        onOpenChange={setIsPickerOpen}
        onExerciseSelect={handleExerciseSelect}
        currentExerciseName=""
      />

      {/* Create exercise dialog */}
      <CreateExerciseDialog
        open={isCreateOpen}
        onOpenChange={setIsCreateOpen}
        onCreated={handleCreatedExercise}
      />
    </div>
  );
}

// ─── Main Editor Component ──────────────────────────────────────────────────────

export function AdminEditorClient({ program }: { program: ProgramInfo }) {
  const [activeWeekIndex, setActiveWeekIndex] = useState(0);
  const [isEditingName, setIsEditingName] = useState(false);
  const [editName, setEditName] = useState(program.name);
  const [applyToAll, setApplyToAll] = useState(false);

  const activeWeek = program.weeks[activeWeekIndex];
  const { data: weekData, isLoading: weekLoading } = useAdminWeek(
    activeWeek?.id ?? null
  );
  const saveWeek = useSaveWeek();
  const updateProgram = useUpdateProgram();

  // Local editor state
  const [editorDays, setEditorDays] = useState<EditorDay[]>([]);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [syncedWeekId, setSyncedWeekId] = useState<string | null>(null);

  if (weekData && weekData.id !== syncedWeekId) {
    setSyncedWeekId(weekData.id);
    setEditorDays(weekData.days.map(dayToEditor));
    setHasUnsavedChanges(false);
  }

  const handleTitleChange = useCallback(
    (dayIndex: number, title: string) => {
      setEditorDays((days) =>
        days.map((d, i) => (i === dayIndex ? { ...d, title } : d))
      );
      setHasUnsavedChanges(true);
    },
    []
  );

  const handleExerciseUpdate = useCallback(
    (dayIndex: number, exerciseTempId: string, updates: Partial<EditorExercise>) => {
      setEditorDays((days) =>
        days.map((d, i) =>
          i === dayIndex
            ? {
                ...d,
                exercises: d.exercises.map((ex) =>
                  ex.tempId === exerciseTempId ? { ...ex, ...updates } : ex
                ),
              }
            : d
        )
      );
      setHasUnsavedChanges(true);
    },
    []
  );

  const handleExerciseRemove = useCallback(
    (dayIndex: number, exerciseTempId: string) => {
      setEditorDays((days) =>
        days.map((d, i) =>
          i === dayIndex
            ? {
                ...d,
                exercises: d.exercises
                  .filter((ex) => ex.tempId !== exerciseTempId)
                  .map((ex, idx) => ({ ...ex, exerciseOrder: idx + 1 })),
              }
            : d
        )
      );
      setHasUnsavedChanges(true);
    },
    []
  );

  const handleExerciseAdd = useCallback(
    (dayIndex: number, exercise: MuscleGroupExerciseWithGroup) => {
      setEditorDays((days) =>
        days.map((d, i) =>
          i === dayIndex
            ? {
                ...d,
                exercises: [
                  ...d.exercises,
                  {
                    tempId: generateId(),
                    exerciseId: exercise.id,
                    exerciseName: exercise.name,
                    muscleGroupId: exercise.groupId,
                    exerciseOrder: d.exercises.length + 1,
                    targetSets: exercise.targetSets || 3,
                    targetReps: exercise.targetReps || "8-12",
                    restSeconds: exercise.restSeconds || 90,
                    targetSetsOverride: null,
                    targetRepsOverride: null,
                    restSecondsOverride: null,
                  },
                ],
              }
            : d
        )
      );
      setHasUnsavedChanges(true);
    },
    []
  );

  const handleExerciseReorder = useCallback(
    (dayIndex: number, fromIndex: number, toIndex: number) => {
      setEditorDays((days) =>
        days.map((d, i) => {
          if (i !== dayIndex) return d;
          const newExercises = [...d.exercises];
          const [moved] = newExercises.splice(fromIndex, 1);
          newExercises.splice(toIndex, 0, moved);
          return {
            ...d,
            exercises: newExercises.map((ex, idx) => ({
              ...ex,
              exerciseOrder: idx + 1,
            })),
          };
        })
      );
      setHasUnsavedChanges(true);
    },
    []
  );

  const handleRemoveDay = useCallback(
    (dayIndex: number) => {
      setEditorDays((days) =>
        days
          .filter((_, i) => i !== dayIndex)
          .map((d, i) => ({ ...d, dayOrder: i + 1 }))
      );
      setHasUnsavedChanges(true);
    },
    []
  );

  const handleAddDay = useCallback(() => {
    setEditorDays((days) => [
      ...days,
      {
        title: `Day ${days.length + 1}`,
        dayOrder: days.length + 1,
        exercises: [],
      },
    ]);
    setHasUnsavedChanges(true);
  }, []);

  const handleSave = async () => {
    if (!activeWeek) return;
    try {
      await saveWeek.mutateAsync({
        weekId: activeWeek.id,
        days: editorDays.map((d) => ({
          id: d.id,
          title: d.title,
          dayOrder: d.dayOrder,
          exercises: d.exercises.map((ex) => ({
            exerciseId: ex.exerciseId,
            exerciseOrder: ex.exerciseOrder,
            targetSetsOverride: ex.targetSetsOverride,
            targetRepsOverride: ex.targetRepsOverride,
            restSecondsOverride: ex.restSecondsOverride,
          })),
        })),
        applyToAll,
      });
      setHasUnsavedChanges(false);
      if (applyToAll) {
        toast.success(`Saved to all ${program.weeks.length} weeks`);
      } else {
        toast.success("Week saved");
      }
    } catch {
      toast.error("Failed to save");
    }
  };

  const handleSaveName = async () => {
    try {
      await updateProgram.mutateAsync({
        id: program.id,
        name: editName,
      });
      setIsEditingName(false);
      toast.success("Program updated");
    } catch {
      toast.error("Failed to update program");
    }
  };

  const saveLabel = applyToAll
    ? `Save All ${program.weeks.length} Weeks`
    : `Save Week ${activeWeek?.weekNumber}`;

  return (
    <div className="min-h-screen bg-black text-white pb-24">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-black/80 backdrop-blur-lg border-b border-white/5">
        <div className="flex items-center h-14 px-4">
          <Link href="/admin" className="p-2 -ml-2">
            <ChevronLeft className="w-6 h-6" />
          </Link>
          {isEditingName ? (
            <div className="flex-1 flex items-center gap-2">
              <Input
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                className="bg-[#0A0A0A] border-white/10 h-8 text-[15px] font-semibold text-center"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleSaveName();
                }}
              />
              <button
                onClick={handleSaveName}
                className="w-8 h-8 rounded-full bg-[#34C759] flex items-center justify-center shrink-0"
              >
                <Check className="w-4 h-4 text-black" />
              </button>
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center gap-1.5">
              <h1 className="text-[17px] font-semibold">{program.name}</h1>
              <button
                onClick={() => {
                  setEditName(program.name);
                  setIsEditingName(true);
                }}
                className="w-6 h-6 rounded-full bg-[#2C2C2E] flex items-center justify-center opacity-60 hover:opacity-100 transition-opacity"
              >
                <Pencil className="w-3 h-3 text-[#8E8E93]" />
              </button>
            </div>
          )}
          <div className="w-10" />
        </div>
      </header>

      {/* Week Tabs */}
      <div className="sticky top-14 z-40 bg-black border-b border-white/5">
        <div className="flex gap-2 overflow-x-auto px-4 py-3 scrollbar-hide">
          {program.weeks.map((week, index) => (
            <button
              key={week.id}
              onClick={() => {
                if (hasUnsavedChanges) {
                  toast.warning("You have unsaved changes");
                }
                setActiveWeekIndex(index);
              }}
              className={`shrink-0 px-4 py-2 rounded-full text-[14px] font-medium transition-all active:scale-95 ${
                activeWeekIndex === index
                  ? "bg-[#0078FF] text-white"
                  : "bg-[#1C1C1E] text-[#8E8E93]"
              }`}
            >
              Week {week.weekNumber}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="px-4 pt-6 space-y-4">
        {weekLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-[#8E8E93]" />
          </div>
        ) : (
          <>
            {editorDays.map((day, dayIndex) => (
              <DayCard
                key={day.id ?? `new-${dayIndex}`}
                day={day}
                dayIndex={dayIndex}
                onTitleChange={handleTitleChange}
                onExerciseUpdate={handleExerciseUpdate}
                onExerciseRemove={handleExerciseRemove}
                onExerciseAdd={handleExerciseAdd}
                onExerciseReorder={handleExerciseReorder}
                onRemoveDay={handleRemoveDay}
              />
            ))}

            {/* Add Day Button */}
            <button
              onClick={handleAddDay}
              className="w-full h-12 rounded-2xl bg-[#1C1C1E] border border-dashed border-white/10 text-[15px] text-[#8E8E93] flex items-center justify-center gap-2 active:bg-[#2C2C2E] transition-colors"
            >
              <Plus className="w-5 h-5" />
              Add Day
            </button>
          </>
        )}
      </div>

      {/* Floating Save Area */}
      {hasUnsavedChanges && (
        <div className="fixed bottom-0 left-0 right-0 z-50 pb-[env(safe-area-inset-bottom)]">
          <div className="max-w-lg mx-auto px-4 pb-4 pt-2 bg-linear-to-t from-black via-black to-transparent">
            {/* Apply to all toggle */}
            <button
              onClick={() => setApplyToAll(!applyToAll)}
              className="flex items-center gap-2 mb-3 px-1"
            >
              <div
                className={`w-10 h-6 rounded-full transition-colors flex items-center px-0.5 ${
                  applyToAll ? "bg-[#0078FF]" : "bg-[#2C2C2E]"
                }`}
              >
                <div
                  className={`w-5 h-5 rounded-full bg-white transition-transform ${
                    applyToAll ? "translate-x-4" : "translate-x-0"
                  }`}
                />
              </div>
              <span className="text-[14px] text-[#8E8E93] flex items-center gap-1.5">
                <Copy className="w-3.5 h-3.5" />
                Apply to all {program.weeks.length} weeks
              </span>
            </button>

            {/* Save button */}
            <button
              onClick={handleSave}
              disabled={saveWeek.isPending}
              className="w-full h-14 bg-[#0078FF] rounded-2xl text-[17px] font-semibold text-white flex items-center justify-center gap-2 active:scale-[0.98] transition-all shadow-[0_0_32px_rgba(0,120,255,0.4)] disabled:opacity-50"
            >
              {saveWeek.isPending ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Save className="w-5 h-5" />
              )}
              {saveLabel}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
