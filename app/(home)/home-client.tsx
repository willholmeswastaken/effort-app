"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { History, TrendingUp, MoreHorizontal, Play, Check, Loader2, Pause, ChevronRight } from "lucide-react";
import Link from "next/link";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
  DrawerFooter,
} from "@/components/ui/drawer";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { UserMenu } from "@/components/user-menu";
import { useUpdatePreferences, useRestartProgram, useHomeData, usePrograms } from "@/lib/queries";

interface HomeClientProps {}

export function HomeClient({}: HomeClientProps) {
  const { data: homeData } = useHomeData();
  const router = useRouter();
  const [isSwitcherOpen, setIsSwitcherOpen] = useState(false);
  const [isRestartOpen, setIsRestartOpen] = useState(false);
  const updatePreferences = useUpdatePreferences();
  const restartProgram = useRestartProgram();
  const [activeWeekIndex, setActiveWeekIndex] = useState(0);

  // Fetch programs only when drawer is opened (lazy loading with React Query)
  const { data: programs = [], isLoading: programsLoading } = usePrograms({
    enabled: isSwitcherOpen,
  });

  // Sync activeWeekIndex once when homeData loads for the first time
  useEffect(() => {
    if (homeData?.activeProgram?.weeks && activeWeekIndex === 0) {
      const weeks = homeData.activeProgram.weeks;
      const initial = weeks.findIndex((week: any) =>
        !week.days.every((day: any) => day.isCompleted)
      );
      if (initial !== -1) {
        setActiveWeekIndex(initial);
      }
    }
  }, [homeData, activeWeekIndex]);

  if (!homeData || !homeData.activeProgram || !homeData.userPreferences) {
    return null;
  }

  const { activeProgram, userPreferences, isProgramComplete, nextWorkout } = homeData;
  const weeks = activeProgram.weeks;

  const handleProgramChange = async (id: string) => {
    await updatePreferences.mutateAsync({ activeProgramId: id });
    setIsSwitcherOpen(false);
    router.refresh(); 
  };

  const handleActionButtonClick = () => {
    if (isProgramComplete) {
      setIsRestartOpen(true);
    } else if (nextWorkout) {
      router.push(`/workout/${nextWorkout.programId}/${nextWorkout.dayId}`);
    }
  };

  const handleRestartProgram = () => {
    if (!userPreferences.activeProgramId) return;
    
    restartProgram.mutate(userPreferences.activeProgramId, {
      onSuccess: () => {
        setIsRestartOpen(false);
        router.refresh();
      },
      onError: (e) => {
        console.error("Failed to restart program", e);
      },
    });
  };


  return (
    <main className="min-h-screen bg-black text-white">

      <div className="relative overflow-hidden">

        {/* Animated Gradient Background */}
        <div 
          className="absolute inset-0 opacity-90 animate-gradient-slow"
          style={{
            background: 'linear-gradient(135deg, #8B5CF6 0%, #6366F1 25%, #4F46E5 50%, #6366F1 75%, #8B5CF6 100%)',
            backgroundSize: '200% 200%',
          }}
        />
        <div className="absolute inset-0 bg-linear-to-b from-transparent via-transparent to-black" />
        
        <div className="relative z-10 px-6 pt-14 pb-12">
          {/* Top Bar */}
          <div className="flex items-center justify-between mb-14">
            <UserMenu />
            <div className="flex items-center gap-3">
              <Link href="/history">
                <button className="w-10 h-10 rounded-full bg-white/15 backdrop-blur-sm flex items-center justify-center active:bg-white/25 transition-colors">
                  <History className="w-5 h-5" />
                </button>
              </Link>
            </div>
          </div>
          

          <div className="text-center mb-8">
            <p className="text-sm font-medium text-white/70 mb-3 tracking-wide">{activeProgram.name}</p>
            <h1 className="text-5xl font-bold tracking-tight mb-2">
              Week {weeks[activeWeekIndex]?.weekNumber ?? 1}
            </h1>
            <p className="text-sm text-white/50">
              {activeWeekIndex + 1} of {weeks.length} weeks
            </p>
          </div>
          

          <div className="flex justify-center">
            <div className="px-5 py-2.5 rounded-full bg-black/30 backdrop-blur-md border border-white/10">
              <span className="text-sm font-medium text-white/90">
                {activeProgram.daysPerWeek} sessions per week
              </span>
            </div>
          </div>
        </div>
      </div>
      

      <div className="px-6 py-8">
        <div className="flex justify-between items-start">
          <button 
            onClick={handleActionButtonClick}
            className="flex flex-col items-center gap-2.5 group"
          >
            <div className={`w-16 h-16 rounded-full flex items-center justify-center transition-all duration-200 ${
              isProgramComplete 
                ? 'bg-[#34C759] shadow-[0_0_20px_rgba(52,199,89,0.4)]' 
                : 'bg-[#0078FF] shadow-[0_0_20px_rgba(0,120,255,0.4)] group-active:scale-95'
            }`}>
              {isProgramComplete ? (
                <Check className="w-6 h-6 text-black" />
              ) : (
                <Play className="w-6 h-6 fill-current ml-0.5 text-white" />
              )}
            </div>
            <span className="text-[13px] font-medium text-white">
              {isProgramComplete ? 'Complete' : 'Start'}
            </span>
          </button>

          <Link href="/history" className="flex flex-col items-center gap-2.5 group">
            <div className="w-16 h-16 rounded-full bg-[#1C1C1E] flex items-center justify-center group-active:bg-[#2C2C2E] transition-colors">
              <History className="w-6 h-6 text-[#8E8E93]" />
            </div>
            <span className="text-[13px] font-medium text-[#8E8E93]">History</span>
          </Link>

          <Link href="/progress" className="flex flex-col items-center gap-2.5 group">
            <div className="w-16 h-16 rounded-full bg-[#1C1C1E] flex items-center justify-center group-active:bg-[#2C2C2E] transition-colors">
              <TrendingUp className="w-6 h-6 text-[#8E8E93]" />
            </div>
            <span className="text-[13px] font-medium text-[#8E8E93]">Progress</span>
          </Link>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex flex-col items-center gap-2.5 outline-none group">
                <div className="w-16 h-16 rounded-full bg-[#1C1C1E] flex items-center justify-center group-active:bg-[#2C2C2E] transition-colors">
                  <MoreHorizontal className="w-6 h-6 text-[#8E8E93]" />
                </div>
                <span className="text-[13px] font-medium text-[#8E8E93]">More</span>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent 
              side="top" 
              align="end" 
              sideOffset={12}
              className="bg-[#1C1C1E] border-white/5 text-white rounded-xl min-w-[180px] animate-in fade-in zoom-in-95 slide-in-from-bottom-4 duration-300 ease-out data-[state=closed]:animate-out data-[state=closed]:fade-out data-[state=closed]:zoom-out-95 data-[state=closed]:slide-out-to-bottom-4"
            >
              <DropdownMenuItem 
                onClick={() => setIsSwitcherOpen(true)}
                className="focus:bg-white/5 focus:text-white py-3 cursor-pointer text-[15px]"
              >
                Change Programme
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => setIsRestartOpen(true)}
                className="focus:bg-white/5 focus:text-white py-3 cursor-pointer text-[15px]"
              >
                Restart Program
              </DropdownMenuItem>
              <DropdownMenuItem className="focus:bg-white/5 focus:text-white py-3 cursor-pointer text-[15px]">
                Settings
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
      

      <div className="px-6 pb-6">
        <Tabs value={String(activeWeekIndex)} onValueChange={(v) => setActiveWeekIndex(Number(v))} className="w-full">
          <TabsList className="w-full bg-[#1C1C1E] p-1.5 rounded-2xl mb-6 overflow-x-auto flex justify-start no-scrollbar gap-1">
            {weeks.map((week: any, index: number) => {
              const isWeekCompleted = week.days.every((d: any) => d.isCompleted);
              const completedCount = week.days.filter((d: any) => d.isCompleted).length;
              const progress = (completedCount / week.days.length) * 100;
              
              return (
                <TabsTrigger 
                  key={week.id} 
                  value={String(index)}
                  className="flex-1 min-w-[85px] rounded-xl py-2.5 text-[13px] font-semibold data-[state=active]:bg-[#2C2C2E] data-[state=active]:text-white data-[state=inactive]:text-[#8E8E93] transition-all relative overflow-hidden"
                >
                  {/* Progress bar background */}
                  {progress > 0 && progress < 100 && (
                    <div 
                      className="absolute bottom-0 left-0 h-0.5 bg-[#0078FF] transition-all"
                      style={{ width: `${progress}%` }}
                    />
                  )}
                  Week {week.weekNumber}
                  {isWeekCompleted && (
                    <div className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[#34C759]" />
                  )}
                </TabsTrigger>
              );
            })}
          </TabsList>

          {weeks.map((week: any, index: number) => (
            <TabsContent key={week.id} value={String(index)} className="mt-0 outline-none animate-in fade-in slide-in-from-right-4 duration-300">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-[13px] font-semibold text-[#8E8E93] uppercase tracking-wider">
                  Week {week.weekNumber} Sessions
                </h2>
                <span className="text-[13px] font-medium text-[#8E8E93] bg-[#1C1C1E] px-2.5 py-1 rounded-full">
                  {week.days.filter((d: any) => d.isCompleted).length}/{week.days.length}
                </span>
              </div>
              
              <div className="bg-[#1C1C1E] rounded-2xl overflow-hidden">
                {week.days.map((day: any, dayIndex: number) => (
                  <Link key={day.id} href={`/workout/${activeProgram.id}/${day.id}`}>
                    <div className={`flex items-center px-4 py-4 active:bg-white/5 transition-colors ${dayIndex > 0 ? 'border-t border-white/5' : ''}`}>
                      {day.isCompleted ? (
                        <div className="w-11 h-11 rounded-full bg-[#34C759] flex items-center justify-center mr-4 shrink-0">
                          <Check className="w-5 h-5 text-black" />
                        </div>
                      ) : day.isInProgress ? (
                        <div className="w-11 h-11 rounded-full bg-[#FF9F0A] flex items-center justify-center mr-4 shrink-0">
                          <Pause className="w-4 h-4 fill-current text-black" />
                        </div>
                      ) : (
                        <div className="w-11 h-11 rounded-full bg-[#0078FF] flex items-center justify-center mr-4 shrink-0">
                          <Play className="w-4 h-4 fill-current ml-0.5 text-white" />
                        </div>
                      )}
                      
                      <div className="flex-1 min-w-0">
                        <p className={`text-[15px] font-semibold truncate ${day.isCompleted ? 'text-[#8E8E93]' : 'text-white'}`}>
                          {day.title}
                        </p>
                        <p className="text-[13px] text-[#636366] mt-0.5">
                          {day.isCompleted ? 'Completed' : day.isInProgress ? 'In progress' : `${day.exerciseCount} exercises`}
                        </p>
                      </div>

                      <ChevronRight className="w-5 h-5 text-[#48484A] ml-2 shrink-0" />
                    </div>
                  </Link>
                ))}
              </div>
            </TabsContent>
          ))}
        </Tabs>
      </div>


      <Drawer open={isSwitcherOpen} onOpenChange={setIsSwitcherOpen}>
        <DrawerContent className="max-w-lg mx-auto">
          <DrawerHeader className="text-center">
            <DrawerTitle className="text-[22px] font-semibold text-white">Change Programme</DrawerTitle>
            <DrawerDescription className="text-[15px] text-[#8E8E93]">
              Switch to a different workout program. Your current progress will be saved.
            </DrawerDescription>
          </DrawerHeader>
          
          <div className="px-6 pb-8 space-y-2">
            {programsLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-[#8E8E93]" />
              </div>
            ) : (
              programs.map((p) => (
                <button
                  key={p.id}
                  onClick={() => handleProgramChange(p.id)}
                  disabled={updatePreferences.isPending}
                  className={`w-full text-left p-4 rounded-2xl flex items-center justify-between transition-colors ${
                    userPreferences.activeProgramId === p.id 
                      ? 'bg-[#0078FF] text-white' 
                      : 'bg-white/5 text-[#E5E5EA] active:bg-white/10'
                  }`}
                >
                  <div>
                    <p className="font-semibold">{p.name}</p>
                    <p className={`text-xs ${userPreferences.activeProgramId === p.id ? 'text-white/70' : 'text-[#8E8E93]'}`}>
                      {p.daysPerWeek} sessions per week
                    </p>
                  </div>
                  {userPreferences.activeProgramId === p.id && (
                    <div className="w-5 h-5 rounded-full bg-white flex items-center justify-center">
                      <div className="w-2 h-2 rounded-full bg-[#0078FF]" />
                    </div>
                  )}
                </button>
              ))
            )}
          </div>
        </DrawerContent>
      </Drawer>

      <Drawer open={isRestartOpen} onOpenChange={setIsRestartOpen}>
        <DrawerContent className="max-w-lg mx-auto">
          <DrawerHeader className="text-center">
            <div className="w-16 h-16 rounded-full bg-[#34C759] flex items-center justify-center mx-auto mb-2">
              <Check className="w-8 h-8 text-black" />
            </div>
            <DrawerTitle className="text-[22px] font-semibold text-white">Program Complete!</DrawerTitle>
            <DrawerDescription className="text-[15px] text-[#8E8E93]">
              Congratulations! Would you like to start a new round of this program?
            </DrawerDescription>
          </DrawerHeader>
          
          <DrawerFooter className="px-6 pb-8">
            <button 
              onClick={handleRestartProgram}
              disabled={restartProgram.isPending}
              className="w-full py-4 bg-[#0078FF] rounded-xl text-[17px] font-semibold active:opacity-80 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2 text-white"
            >
              {restartProgram.isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : "Start New Round"}
            </button>
            
            <button 
              onClick={() => setIsRestartOpen(false)}
              className="w-full py-4 bg-[#2C2C2E] rounded-xl text-[17px] font-semibold active:opacity-80 transition-opacity text-white"
            >
              Not Now
            </button>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    </main>
  );
}
