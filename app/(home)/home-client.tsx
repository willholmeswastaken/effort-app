"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { History, Play, Check, Loader2, ChevronRight, Dumbbell, ArrowRight, TrendingUp } from "lucide-react";
import Link from "next/link";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
  DrawerFooter,
} from "@/components/ui/drawer";

import { UserMenu } from "@/components/user-menu";
import { useUpdatePreferences, useRestartProgram, useHomeData, usePrograms } from "@/lib/queries";

interface HomeClientProps {}

// Skeleton loader component for loading state
function HomeSkeleton() {
  return (
    <main className="min-h-screen bg-black text-white">
      {/* Header Skeleton */}
      <div className="px-6 pt-14 pb-8">
        <div className="flex items-center justify-between mb-10">
          <div className="w-10 h-10 rounded-full bg-[#1C1C1E] animate-pulse" />
          <div className="w-24 h-4 bg-[#1C1C1E] rounded animate-pulse" />
          <div className="flex gap-2">
            <div className="w-10 h-10 rounded-full bg-[#1C1C1E] animate-pulse" />
            <div className="w-10 h-10 rounded-full bg-[#1C1C1E] animate-pulse" />
          </div>
        </div>
        
        {/* Big Week Number Skeleton */}
        <div className="text-center mb-10">
          <div className="w-32 h-12 bg-[#1C1C1E] rounded mx-auto mb-3 animate-pulse" />
          <div className="w-24 h-5 bg-[#1C1C1E] rounded mx-auto mb-4 animate-pulse" />
          <div className="w-36 h-4 bg-[#1C1C1E] rounded mx-auto animate-pulse" />
        </div>
        
        {/* CTA Button Skeleton */}
        <div className="flex justify-center mb-8">
          <div className="w-full max-w-xs h-14 bg-[#1C1C1E] rounded-2xl animate-pulse" />
        </div>
      </div>
      
      {/* Week Tabs Skeleton */}
      <div className="px-6 pb-6">
        <div className="w-full h-12 bg-[#1C1C1E] rounded-2xl mb-6 animate-pulse" />
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="w-full h-16 bg-[#1C1C1E] rounded-2xl animate-pulse" />
          ))}
        </div>
      </div>
    </main>
  );
}

// Empty state when no program selected
function EmptyState({ onBrowsePrograms }: { onBrowsePrograms: () => void }) {
  return (
    <main className="min-h-screen bg-black text-white flex flex-col">
      {/* Header */}
      <div className="px-6 pt-14 pb-8">
        <div className="flex items-center justify-between mb-8">
          <UserMenu />
          <div className="flex items-center gap-3">
            <Link href="/history">
              <button className="w-10 h-10 rounded-full bg-[#1C1C1E] flex items-center justify-center active:bg-[#2C2C2E] transition-colors">
                <History className="w-5 h-5 text-[#8E8E93]" />
              </button>
            </Link>
          </div>
        </div>
      </div>
      
      {/* Empty State Content */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 pb-20">
        <div className="w-20 h-20 rounded-full bg-[#1C1C1E] flex items-center justify-center mb-6">
          <Dumbbell className="w-10 h-10 text-[#8E8E93]" />
        </div>
        
        <h1 className="text-[28px] font-bold text-white mb-3 text-center">
          Start Your Fitness Journey
        </h1>
        
        <p className="text-[17px] text-[#8E8E93] text-center mb-8 max-w-xs">
          Choose a workout program to get started and track your progress
        </p>
        
        <button 
          onClick={onBrowsePrograms}
          className="w-full max-w-xs py-4 bg-linear-to-br from-[#0078FF] to-[#0066DD] rounded-2xl text-[17px] font-semibold text-white active:scale-95 transition-all duration-200 shadow-[0_0_32px_rgba(0,120,255,0.4)] flex items-center justify-center gap-2"
        >
          Browse Programs
          <ArrowRight className="w-5 h-5" />
        </button>
        
        <Link 
          href="/history"
          className="mt-4 text-[15px] text-[#8E8E93] hover:text-white transition-colors"
        >
          View Workout History
        </Link>
      </div>
    </main>
  );
}

export function HomeClient({}: HomeClientProps) {
  const { data: homeData, isLoading } = useHomeData();
  const router = useRouter();
  const [isSwitcherOpen, setIsSwitcherOpen] = useState(false);
  const [isRestartOpen, setIsRestartOpen] = useState(false);
  const [isProgramMenuOpen, setIsProgramMenuOpen] = useState(false);
  const [isInsightsMenuOpen, setIsInsightsMenuOpen] = useState(false);
  const updatePreferences = useUpdatePreferences();
  const restartProgram = useRestartProgram();
  const [activeWeekIndex, setActiveWeekIndex] = useState(0);
  const touchStartX = useRef<number | null>(null);
  const touchStartY = useRef<number | null>(null);
  const touchEndX = useRef<number | null>(null);
  const isSwipingHorizontally = useRef<boolean>(false);
  const swipeContainerRef = useRef<HTMLDivElement>(null);
  const SWIPE_THRESHOLD = 50;
  const SWIPE_LOCK_ANGLE = 15; // Degrees - if angle is less than this, lock vertical scroll

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

  // Loading state with skeleton
  if (isLoading) {
    return <HomeSkeleton />;
  }

  // Empty state when no program selected
  if (!homeData || !homeData.activeProgram || !homeData.userPreferences) {
    return <EmptyState onBrowsePrograms={() => setIsSwitcherOpen(true)} />;
  }

  const { activeProgram, userPreferences, isProgramComplete, nextWorkout } = homeData;
  const weeks = activeProgram.weeks;

  // Calculate completed sessions across all weeks
  const totalSessions = weeks.reduce((acc: number, week: any) => acc + week.days.length, 0);
  const completedSessions = weeks.reduce(
    (acc: number, week: any) => acc + week.days.filter((d: any) => d.isCompleted).length,
    0
  );

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

  // Haptic feedback helper
  const triggerHaptic = () => {
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate(10);
    }
  };

  // Native touch handlers for week navigation with axis locking
  useEffect(() => {
    const container = swipeContainerRef.current;
    if (!container) return;

    const handleTouchStart = (e: TouchEvent) => {
      touchStartX.current = e.touches[0].clientX;
      touchStartY.current = e.touches[0].clientY;
      isSwipingHorizontally.current = false;
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!touchStartX.current || !touchStartY.current) return;
      
      const currentX = e.touches[0].clientX;
      const currentY = e.touches[0].clientY;
      const deltaX = Math.abs(currentX - touchStartX.current);
      const deltaY = Math.abs(currentY - touchStartY.current);
      
      // Determine if this is a horizontal swipe (lock vertical scroll)
      if (deltaX > 10 || deltaY > 10) {
        const angle = Math.atan2(deltaY, deltaX) * (180 / Math.PI);
        if (angle < SWIPE_LOCK_ANGLE && deltaX > deltaY) {
          isSwipingHorizontally.current = true;
          e.preventDefault(); // Lock vertical scroll during horizontal swipe
        }
      }
      
      touchEndX.current = currentX;
    };

    const handleTouchEnd = () => {
      if (!touchStartX.current || !touchEndX.current) return;
      
      const distance = touchStartX.current - touchEndX.current;
      const isLeftSwipe = distance > SWIPE_THRESHOLD;
      const isRightSwipe = distance < -SWIPE_THRESHOLD;

      if (isLeftSwipe && activeWeekIndex < weeks.length - 1) {
        triggerHaptic();
        setActiveWeekIndex(prev => prev + 1);
      }
      if (isRightSwipe && activeWeekIndex > 0) {
        triggerHaptic();
        setActiveWeekIndex(prev => prev - 1);
      }

      touchStartX.current = null;
      touchStartY.current = null;
      touchEndX.current = null;
      isSwipingHorizontally.current = false;
    };

    // Add listeners with { passive: false } to allow preventDefault
    container.addEventListener('touchstart', handleTouchStart, { passive: true });
    container.addEventListener('touchmove', handleTouchMove, { passive: false });
    container.addEventListener('touchend', handleTouchEnd, { passive: true });

    return () => {
      container.removeEventListener('touchstart', handleTouchStart);
      container.removeEventListener('touchmove', handleTouchMove);
      container.removeEventListener('touchend', handleTouchEnd);
    };
  }, [activeWeekIndex, weeks.length]);

  return (
    <main className="min-h-screen bg-black text-white">
      {/* Pure black header */}
      <div>
        
        <div className="relative z-10 px-6 pt-14 pb-4">
          {/* Top Bar - Program name in center */}
          <div className="flex items-center justify-between mb-10">
            <UserMenu />
            
            {/* Program Name - Centered, tappable */}
            <button 
              onClick={() => setIsProgramMenuOpen(true)}
              className="group flex items-center gap-1"
            >
              <span className="text-[15px] font-medium text-white group-active:opacity-70 transition-opacity">
                {activeProgram.name}
              </span>
              <ChevronRight className="w-4 h-4 text-[#8E8E93] group-hover:translate-x-0.5 transition-transform" />
            </button>
            
            <button 
              onClick={() => {
                triggerHaptic();
                setIsInsightsMenuOpen(true);
              }}
              className="w-10 h-10 rounded-full bg-[#1C1C1E] flex items-center justify-center active:bg-[#2C2C2E] transition-colors"
            >
              <History className="w-5 h-5 text-[#8E8E93]" />
            </button>
          </div>
          
          {/* Big Week Status - Primary Info */}
          <div className="text-center mb-2">
            <div className="text-[48px] font-bold text-white tracking-tight leading-none">
              Week {weeks[activeWeekIndex]?.weekNumber ?? 1}
            </div>
          </div>
          
          {/* Secondary: Session count */}
          <div className="text-center mb-4">
            <span className="text-[17px] text-[#8E8E93]">{completedSessions}/{totalSessions} sessions</span>
          </div>
          
          {/* Tertiary: Program progress with insights link */}
          <div className="flex justify-center mb-8">
            <Link 
              href="/progress" 
              className="group inline-flex items-center gap-1.5 text-[14px] text-[#8E8E93] hover:text-white transition-colors"
            >
              <span>{Math.round((completedSessions / totalSessions) * 100)}% Program Complete</span>
              <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
            </Link>
          </div>
          
          {/* Start CTA - Single Primary Action */}
          <div className="flex justify-center">
            <button 
              onClick={() => {
                triggerHaptic();
                handleActionButtonClick();
              }}
              className="w-full max-w-xs py-4 bg-[#0078FF] rounded-2xl text-[17px] font-semibold text-white active:scale-95 transition-all duration-200 flex items-center justify-center gap-2"
            >
              {isProgramComplete ? (
                <><Check className="w-5 h-5" /> Complete</>
              ) : nextWorkout?.isInProgress ? (
                <><Play className="w-5 h-5 fill-current" /> Resume Workout</>
              ) : (
                <><Play className="w-5 h-5 fill-current" /> Start Workout</>
              )}
            </button>
          </div>
        </div>
      </div>
      
      {/* Week Tabs & Day List - Swipeable */}
      <div 
        ref={swipeContainerRef}
        className="px-6 pb-20 touch-pan-y"
      >
        {/* Week Tabs - Pill style like muscle group filters */}
        <div className="sticky top-0 z-20 bg-black pt-3 pb-4 -mx-6 px-6">
          <div className="flex gap-2 overflow-x-auto scrollbar-hide">
            {weeks.map((week: any, index: number) => {
              const isWeekCompleted = week.days.every((d: any) => d.isCompleted);
              const isActive = activeWeekIndex === index;
              
              return (
                <button
                  key={week.id}
                  onClick={() => {
                    triggerHaptic();
                    setActiveWeekIndex(index);
                  }}
                  className={`shrink-0 px-4 py-2 rounded-full text-[14px] font-medium transition-all active:scale-95 flex items-center gap-1.5 ${
                    isActive
                      ? 'bg-[#0078FF] text-white'
                      : 'bg-[#1C1C1E] text-[#8E8E93]'
                  }`}
                >
                  Week {week.weekNumber}
                  {isWeekCompleted && (
                    <Check className={`w-3.5 h-3.5 ${isActive ? 'text-white' : 'text-[#34C759]'}`} />
                  )}
                </button>
              );
            })}
          </div>
          
          {/* Page indicator dots */}
          <div className="flex justify-center items-center gap-2 mt-3">
            {weeks.map((_: any, index: number) => (
              <button
                key={index}
                onClick={() => {
                  triggerHaptic();
                  setActiveWeekIndex(index);
                }}
                className={`rounded-full transition-all duration-200 ${
                  activeWeekIndex === index
                    ? 'w-2 h-2 bg-white'
                    : 'w-1.5 h-1.5 bg-[#48484A]'
                }`}
                aria-label={`Go to week ${index + 1}`}
              />
            ))}
          </div>
        </div>

        {/* Week Content - Card container like Revolut */}
        {weeks.map((week: any, index: number) => (
          activeWeekIndex === index && (
            <div key={week.id} className="animate-in fade-in duration-200">
              {/* Empty state when no workouts completed this week */}
              {week.days.every((d: any) => !d.isCompleted && !d.isInProgress) && (
                <div className="bg-[#1C1C1E] rounded-2xl p-8 text-center mb-4 shadow-[0_2px_8px_rgba(0,0,0,0.4)]">
                  <div className="w-12 h-12 rounded-full bg-[#2C2C2E] flex items-center justify-center mx-auto mb-3">
                    <Play className="w-5 h-5 text-[#8E8E93]" />
                  </div>
                  <p className="text-[15px] text-white font-medium mb-1">Ready to start?</p>
                  <p className="text-[13px] text-[#8E8E93]">Complete your first workout this week</p>
                </div>
              )}
              <div className="bg-[#1C1C1E] rounded-2xl overflow-hidden shadow-[0_2px_8px_rgba(0,0,0,0.4)]">
                {week.days.map((day: any, dayIndex: number) => (
                  <Link key={day.id} href={`/workout/${activeProgram.id}/${day.id}`}>
                    <div 
                      className={`flex items-center px-4 py-4 active:bg-white/[0.03] transition-colors ${dayIndex > 0 ? 'border-t border-white/6' : ''}`}
                    >
                      <div className="flex-1 min-w-0">
                        <p className={`text-[17px] font-medium truncate ${day.isCompleted ? 'text-[#8E8E93]' : 'text-white'}`}>
                          {day.isCompleted ? <span className="line-through opacity-70">{day.title}</span> : day.title}
                        </p>
                        <p className="text-[13px] text-[#636366] mt-0.5">
                          {day.isCompleted ? 'Completed' : day.isInProgress ? 'In progress' : `${day.exerciseCount} exercises`}
                        </p>
                      </div>
                      
                      {day.isCompleted ? (
                        <Check className="w-5 h-5 text-[#34C759] ml-4 shrink-0" />
                      ) : day.isInProgress ? (
                        <div className="w-2 h-2 rounded-full bg-[#FF9F0A] ml-4 shrink-0" />
                      ) : (
                        <ChevronRight className="w-5 h-5 text-[#48484A] ml-4 shrink-0" />
                      )}
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )
        ))}
      </div>

      {/* Program Menu Drawer (replaces dropdown) */}
      <Drawer open={isProgramMenuOpen} onOpenChange={setIsProgramMenuOpen}>
        <DrawerContent className="max-w-lg mx-auto bg-[#0A0A0A]">
          <DrawerHeader className="text-center pb-2">
            <DrawerTitle className="text-[22px] font-semibold text-white">Program Options</DrawerTitle>
            <DrawerDescription className="text-[15px] text-[#8E8E93]">
              {activeProgram.name}
            </DrawerDescription>
          </DrawerHeader>
          
          <DrawerFooter className="px-6 pb-8 gap-3">
            <button 
              onClick={() => {
                setIsProgramMenuOpen(false);
                setIsSwitcherOpen(true);
              }}
              className="w-full py-4 bg-[#2C2C2E] rounded-2xl text-[17px] font-semibold text-white active:scale-95 transition-all duration-200 border border-white/6"
            >
              Change Programme
            </button>
            
            <button 
              onClick={() => {
                setIsProgramMenuOpen(false);
                setIsRestartOpen(true);
              }}
              className="w-full py-4 bg-[#2C2C2E] rounded-2xl text-[17px] font-semibold text-white active:scale-95 transition-all duration-200 border border-white/6"
            >
              Restart Program
            </button>
            
            <button 
              onClick={() => setIsProgramMenuOpen(false)}
              className="w-full py-4 bg-transparent rounded-2xl text-[17px] font-medium text-[#8E8E93] active:scale-95 transition-all duration-200"
            >
              Cancel
            </button>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>

      {/* Program Switcher Drawer */}
      <Drawer open={isSwitcherOpen} onOpenChange={setIsSwitcherOpen}>
        <DrawerContent className="max-w-lg mx-auto bg-[#0A0A0A]">
          <DrawerHeader className="text-center pb-2">
            <DrawerTitle className="text-[22px] font-semibold text-white">Change Programme</DrawerTitle>
            <DrawerDescription className="text-[15px] text-[#8E8E93]">
              Switch to a different workout program
            </DrawerDescription>
          </DrawerHeader>
          
          <div className="px-6 pb-8 space-y-2 max-h-[60vh] overflow-y-auto">
            {programsLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-[#8E8E93]" />
              </div>
            ) : (
              programs.map((p, index) => (
                <button
                  key={p.id}
                  onClick={() => handleProgramChange(p.id)}
                  disabled={updatePreferences.isPending}
                  className={`w-full text-left p-4 rounded-2xl flex items-center justify-between transition-all active:scale-[0.98] ${
                    userPreferences.activeProgramId === p.id 
                      ? 'bg-[#0078FF] text-white' 
                      : 'bg-[#1C1C1E] text-[#E5E5EA] active:bg-[#2C2C2E]'
                  }`}
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <div>
                    <p className="text-[17px] font-semibold">{p.name}</p>
                    <p className={`text-[13px] mt-0.5 ${userPreferences.activeProgramId === p.id ? 'text-white/70' : 'text-[#8E8E93]'}`}>
                      {p.daysPerWeek} sessions per week
                    </p>
                  </div>
                  {userPreferences.activeProgramId === p.id && (
                    <div className="w-6 h-6 rounded-full bg-white flex items-center justify-center">
                      <Check className="w-4 h-4 text-[#0078FF]" />
                    </div>
                  )}
                </button>
              ))
            )}
          </div>
        </DrawerContent>
      </Drawer>

      {/* Restart Program Drawer */}
      <Drawer open={isRestartOpen} onOpenChange={setIsRestartOpen}>
        <DrawerContent className="max-w-lg mx-auto bg-[#0A0A0A]">
          <DrawerHeader className="text-center pb-2">
            <div className="w-16 h-16 rounded-full bg-[#34C759] flex items-center justify-center mx-auto mb-3">
              <Check className="w-8 h-8 text-black" />
            </div>
            <DrawerTitle className="text-[22px] font-semibold text-white">Program Complete!</DrawerTitle>
            <DrawerDescription className="text-[15px] text-[#8E8E93]">
              Would you like to start a new round?
            </DrawerDescription>
          </DrawerHeader>
          
          <DrawerFooter className="px-6 pb-8 gap-3">
            <button 
              onClick={handleRestartProgram}
              disabled={restartProgram.isPending}
              className="w-full py-4 bg-linear-to-br from-[#0078FF] to-[#0066DD] rounded-2xl text-[17px] font-semibold text-white active:scale-95 transition-all duration-200 disabled:opacity-50 flex items-center justify-center gap-2 shadow-[0_0_24px_rgba(0,120,255,0.3)]"
            >
              {restartProgram.isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : "Start New Round"}
            </button>
            
            <button 
              onClick={() => setIsRestartOpen(false)}
              className="w-full py-4 bg-[#2C2C2E] rounded-2xl text-[17px] font-semibold text-white active:scale-95 transition-all duration-200 border border-white/6"
            >
              Not Now
            </button>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>

      {/* Insights & History Menu Drawer */}
      <Drawer open={isInsightsMenuOpen} onOpenChange={setIsInsightsMenuOpen}>
        <DrawerContent className="max-w-lg mx-auto bg-[#0A0A0A]">
          <DrawerHeader className="text-center pb-2">
            <DrawerTitle className="text-[22px] font-semibold text-white">Your Data</DrawerTitle>
            <DrawerDescription className="text-[15px] text-[#8E8E93]">
              View your progress and workout history
            </DrawerDescription>
          </DrawerHeader>
          
          <DrawerFooter className="px-6 pb-8 gap-3">
            <Link 
              href="/progress"
              onClick={() => setIsInsightsMenuOpen(false)}
              className="w-full py-4 bg-[#2C2C2E] rounded-2xl text-[17px] font-semibold text-white active:scale-95 transition-all duration-200 border border-white/6 flex items-center justify-center gap-3"
            >
              <TrendingUp className="w-5 h-5 text-[#8E8E93]" />
              Progress & Insights
            </Link>
            
            <Link 
              href="/history"
              onClick={() => setIsInsightsMenuOpen(false)}
              className="w-full py-4 bg-[#2C2C2E] rounded-2xl text-[17px] font-semibold text-white active:scale-95 transition-all duration-200 border border-white/6 flex items-center justify-center gap-3"
            >
              <History className="w-5 h-5 text-[#8E8E93]" />
              Workout History
            </Link>
            
            <button 
              onClick={() => setIsInsightsMenuOpen(false)}
              className="w-full py-4 bg-transparent rounded-2xl text-[17px] font-medium text-[#8E8E93] active:scale-95 transition-all duration-200"
            >
              Cancel
            </button>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    </main>
  );
}
