"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ChevronLeft,
  Plus,
  Trash2,
  ChevronRight,
  Loader2,
  Calendar,
  Dumbbell,
} from "lucide-react";
import { toast } from "sonner";
import {
  useAdminPrograms,
  useCreateProgram,
  useDeleteProgram,
} from "@/lib/queries/admin";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";

export function AdminClient() {
  const router = useRouter();
  const { data: programs = [], isLoading } = useAdminPrograms();
  const createProgram = useCreateProgram();
  const deleteProgram = useDeleteProgram();

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{
    id: string;
    name: string;
  } | null>(null);
  const [form, setForm] = useState({
    name: "",
    description: "",
    daysPerWeek: 5,
    weekCount: 5,
  });

  const handleCreate = async () => {
    if (!form.name.trim()) {
      toast.error("Program name is required");
      return;
    }
    try {
      const result = await createProgram.mutateAsync({
        name: form.name,
        description: form.description || undefined,
        daysPerWeek: form.daysPerWeek,
        weekCount: form.weekCount,
      });
      toast.success("Program created");
      setIsCreateOpen(false);
      setForm({ name: "", description: "", daysPerWeek: 5, weekCount: 5 });
      router.push(`/admin/${result.id}`);
    } catch {
      toast.error("Failed to create program");
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteProgram.mutateAsync(deleteTarget.id);
      toast.success("Program deleted");
      setDeleteTarget(null);
    } catch {
      toast.error("Failed to delete program");
    }
  };

  return (
    <div className="min-h-screen bg-black text-white pb-20">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-black/80 backdrop-blur-lg border-b border-white/5">
        <div className="flex items-center h-14 px-4">
          <Link href="/" className="p-2 -ml-2">
            <ChevronLeft className="w-6 h-6" />
          </Link>
          <h1 className="flex-1 text-center text-[17px] font-semibold">
            Admin
          </h1>
          <button
            onClick={() => setIsCreateOpen(true)}
            className="p-2 -mr-2"
          >
            <Plus className="w-6 h-6" />
          </button>
        </div>
      </header>

      {/* Content */}
      <div className="px-4 pt-6">
        <p className="text-[13px] font-medium text-[#8E8E93] uppercase tracking-wide mb-3">
          Workout Programs
        </p>

        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-[#8E8E93]" />
          </div>
        ) : programs.length === 0 ? (
          <div className="bg-[#1C1C1E] rounded-2xl p-8 text-center">
            <Dumbbell className="w-10 h-10 text-[#48484A] mx-auto mb-3" />
            <p className="text-[15px] text-[#8E8E93] mb-4">
              No programs yet
            </p>
            <Button
              onClick={() => setIsCreateOpen(true)}
              className="bg-[#0078FF] hover:bg-[#0078FF]/90"
            >
              Create First Program
            </Button>
          </div>
        ) : (
          <div className="bg-[#1C1C1E] rounded-2xl overflow-hidden">
            {programs.map((program, index) => (
              <div
                key={program.id}
                className={`flex items-center ${index > 0 ? "border-t border-white/5" : ""}`}
              >
                <Link
                  href={`/admin/${program.id}`}
                  className="flex-1 flex items-center px-4 py-4 min-w-0 active:bg-white/5 transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-[15px] font-medium truncate">
                      {program.name}
                    </p>
                    <div className="flex items-center gap-3 mt-0.5">
                      <span className="flex items-center gap-1 text-[13px] text-[#8E8E93]">
                        <Calendar className="w-3 h-3" />
                        {program.daysPerWeek}d/wk
                      </span>
                      <span className="text-[13px] text-[#8E8E93]">
                        {program.weekCount} weeks
                      </span>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-[#48484A] ml-2 shrink-0" />
                </Link>
                <button
                  onClick={() =>
                    setDeleteTarget({ id: program.id, name: program.name })
                  }
                  className="p-3 pr-4 text-[#8E8E93] hover:text-red-400 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create Program Dialog */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="bg-[#1C1C1E] border-white/5 text-white">
          <DialogHeader>
            <DialogTitle>New Program</DialogTitle>
            <DialogDescription className="text-[#8E8E93]">
              Create a new workout program with weeks and days.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <label className="text-[13px] font-medium text-[#8E8E93] mb-1.5 block">
                Name
              </label>
              <Input
                value={form.name}
                onChange={(e) =>
                  setForm((f) => ({ ...f, name: e.target.value }))
                }
                placeholder="e.g. PPL Upper/Lower"
                className="bg-[#0A0A0A] border-white/10"
              />
            </div>
            <div>
              <label className="text-[13px] font-medium text-[#8E8E93] mb-1.5 block">
                Description
              </label>
              <Input
                value={form.description}
                onChange={(e) =>
                  setForm((f) => ({ ...f, description: e.target.value }))
                }
                placeholder="Optional description"
                className="bg-[#0A0A0A] border-white/10"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-[13px] font-medium text-[#8E8E93] mb-1.5 block">
                  Days per week
                </label>
                <Input
                  type="number"
                  min={1}
                  max={7}
                  value={form.daysPerWeek}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      daysPerWeek: parseInt(e.target.value) || 1,
                    }))
                  }
                  className="bg-[#0A0A0A] border-white/10 font-mono"
                />
              </div>
              <div>
                <label className="text-[13px] font-medium text-[#8E8E93] mb-1.5 block">
                  Number of weeks
                </label>
                <Input
                  type="number"
                  min={1}
                  max={12}
                  value={form.weekCount}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      weekCount: parseInt(e.target.value) || 1,
                    }))
                  }
                  className="bg-[#0A0A0A] border-white/10 font-mono"
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsCreateOpen(false)}
              className="border-white/10"
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreate}
              disabled={createProgram.isPending}
              className="bg-[#0078FF] hover:bg-[#0078FF]/90"
            >
              {createProgram.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : null}
              Create
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
      >
        <DialogContent className="bg-[#1C1C1E] border-white/5 text-white">
          <DialogHeader>
            <DialogTitle>Delete Program</DialogTitle>
            <DialogDescription className="text-[#8E8E93]">
              Are you sure you want to delete &quot;{deleteTarget?.name}&quot;?
              This will remove all weeks, days, and exercise configurations.
              This cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteTarget(null)}
              className="border-white/10"
            >
              Cancel
            </Button>
            <Button
              onClick={handleDelete}
              disabled={deleteProgram.isPending}
              variant="destructive"
            >
              {deleteProgram.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : null}
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
