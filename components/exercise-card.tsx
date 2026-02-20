"use client";

import { useState, useRef, useEffect } from "react";
import { Exercise, SetLog } from "@/lib/types";
import { Plus, History, ChevronRight, X, ArrowRightLeft, Check, Loader2, Play } from "lucide-react";
import Image from "next/image";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import { useLastLifts } from "@/lib/queries";

interface ExerciseCardProps {
  exercise: Exercise;
  exerciseNumber?: number;
  sets: SetLog[];
  onSetsChange: (sets: SetLog[]) => void;
  onSetFieldChange?: (setIndex: number, field: 'reps' | 'weight', value: number) => void;
  readOnly?: boolean;
  onSwapRequest?: () => void;
  onSetComplete?: () => void;
}

export function ExerciseCard({ 
  exercise, 
  exerciseNumber, 
  sets, 
  onSetsChange, 
  onSetFieldChange,
  readOnly = false, 
  onSwapRequest,
  onSetComplete 
}: ExerciseCardProps) {
  const [showHistory, setShowHistory] = useState(false);
  const [swipeOffset, setSwipeOffset] = useState(0);
  const [isSwipeRevealed, setIsSwipeRevealed] = useState(false);
  const [isPressed, setIsPressed] = useState(false);
  const [completedSets, setCompletedSets] = useState<Set<number>>(new Set());
  const [showRestTimer, setShowRestTimer] = useState<number | null>(null);
  const [restTimeRemaining, setRestTimeRemaining] = useState(0);
  const [newlyAddedSetIndex, setNewlyAddedSetIndex] = useState<number | null>(null);
  const [showVideo, setShowVideo] = useState(false);
  const [weightInputValues, setWeightInputValues] = useState<Record<number, string>>({});
  
  // Lazy fetch: only fetch when history is shown
  const { data: lastLiftsData, isLoading: isLoadingHistory } = useLastLifts([exercise.id], {
    enabled: showHistory, // Only fetch when history drawer is open
  });
  
  const lastLiftHistory = lastLiftsData?.[exercise.id] || [];
  
  const touchStartX = useRef(0);
  const touchStartY = useRef(0);
  const isHorizontalSwipe = useRef(false);
  const isDragging = useRef(false);
  const maxSwipeDelta = useRef(0);
  const cardRef = useRef<HTMLDivElement>(null);
  
  const repsInputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const weightInputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const SWIPE_THRESHOLD = 80;
  const SWAP_BUTTON_WIDTH = 80;
  const SWIPE_TRIGGER_THRESHOLD = 100; // Threshold to auto-trigger swap
  const SWIPE_ANGLE_THRESHOLD = 6; // Minimum horizontal movement before considering direction (lower = more responsive)
  const SWIPE_ANGLE_RATIO = 1.2; // Horizontal must be 1.2x vertical (more lenient for natural swipes)

  // Rest timer countdown
  useEffect(() => {
    if (showRestTimer === null || restTimeRemaining <= 0) return;
    
    const interval = setInterval(() => {
      setRestTimeRemaining(prev => {
        if (prev <= 1) {
          setShowRestTimer(null);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    
    return () => clearInterval(interval);
  }, [showRestTimer, restTimeRemaining]);

  // Reset swipe when card scrolls out of view
  useEffect(() => {
    const card = cardRef.current;
    if (!card) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          // If card is less than 50% visible, reset swipe state
          if (!entry.isIntersecting && (isSwipeRevealed || swipeOffset !== 0)) {
            setSwipeOffset(0);
            setIsSwipeRevealed(false);
            setIsPressed(false);
          }
        });
      },
      { threshold: 0.5 }
    );

    observer.observe(card);
    return () => observer.disconnect();
  }, [isSwipeRevealed, swipeOffset]);

  // Use vanilla event listeners with { passive: false } to override browser defaults
  // Using refs for state that changes during swipe to avoid re-attaching listeners
  const swipeOffsetRef = useRef(swipeOffset);
  swipeOffsetRef.current = swipeOffset;
  const isSwipeRevealedRef = useRef(isSwipeRevealed);
  isSwipeRevealedRef.current = isSwipeRevealed;
  
  useEffect(() => {
    const card = cardRef.current;
    if (!card || readOnly || !onSwapRequest) return;

    const onTouchStart = (e: TouchEvent) => {
      // Ignore swipe gesture if touching an input, textarea, or contenteditable element
      const target = e.target as HTMLElement;
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.tagName === 'SELECT' ||
        target.isContentEditable
      ) {
        return;
      }
      
      touchStartX.current = e.touches[0].clientX;
      touchStartY.current = e.touches[0].clientY;
      isHorizontalSwipe.current = false;
      maxSwipeDelta.current = 0;
      setIsPressed(true);
    };

    const onTouchMove = (e: TouchEvent) => {
      const deltaX = e.touches[0].clientX - touchStartX.current;
      const deltaY = e.touches[0].clientY - touchStartY.current;

      // Detect if the gesture is primarily horizontal (strict detection)
      if (!isHorizontalSwipe.current) {
        const absX = Math.abs(deltaX);
        const absY = Math.abs(deltaY);
        
        // Only check direction after minimum horizontal movement
        // Require horizontal to be significantly larger than vertical (2:1 ratio)
        // This prevents accidental swipes during vertical scrolling
        if (absX > SWIPE_ANGLE_THRESHOLD && absX > absY * SWIPE_ANGLE_RATIO) {
          isHorizontalSwipe.current = true;
        } else if (absY > SWIPE_ANGLE_THRESHOLD) {
          // If moving vertically more, definitely not a horizontal swipe
          isHorizontalSwipe.current = false;
        }
      }

      // If we've locked into a horizontal swipe, prevent vertical scrolling
      if (isHorizontalSwipe.current) {
        if (e.cancelable) e.preventDefault();
        
        // Track max swipe distance for trigger detection
        if (deltaX < 0) {
          maxSwipeDelta.current = Math.max(maxSwipeDelta.current, Math.abs(deltaX));
        }
        
        // Visual offset is constrained, but maxSwipeDelta tracks actual distance
        // Use refs to avoid stale closure issues
        const currentRevealed = isSwipeRevealedRef.current;
        const newOffset = currentRevealed
          ? Math.min(0, Math.max(-SWIPE_THRESHOLD, -SWIPE_THRESHOLD + deltaX))
          : Math.min(0, Math.max(-SWIPE_THRESHOLD - 20, deltaX));
        
        setSwipeOffset(newOffset);
      }
    };

    const onTouchEnd = () => {
      setIsPressed(false);
      
      // Check if swiped far enough to auto-trigger swap (use max tracked distance)
      if (maxSwipeDelta.current > SWIPE_TRIGGER_THRESHOLD) {
        // Fully swiped - trigger swap immediately
        setSwipeOffset(0);
        setIsSwipeRevealed(false);
        onSwapRequest?.();
      } else {
        // Not fully swiped - reset immediately
        setSwipeOffset(0);
        setIsSwipeRevealed(false);
      }
      isHorizontalSwipe.current = false;
      maxSwipeDelta.current = 0;
    };

    // Reset state when touch is cancelled (e.g., scroll starts)
    const onTouchCancel = () => {
      setIsPressed(false);
      setSwipeOffset(0);
      setIsSwipeRevealed(false);
      isHorizontalSwipe.current = false;
      maxSwipeDelta.current = 0;
    };

    card.addEventListener('touchstart', onTouchStart, { passive: true });
    card.addEventListener('touchmove', onTouchMove, { passive: false });
    card.addEventListener('touchend', onTouchEnd);
    card.addEventListener('touchcancel', onTouchCancel);

    return () => {
      card.removeEventListener('touchstart', onTouchStart);
      card.removeEventListener('touchmove', onTouchMove);
      card.removeEventListener('touchend', onTouchEnd);
      card.removeEventListener('touchcancel', onTouchCancel);
    };
  }, [readOnly, onSwapRequest]); // Removed isSwipeRevealed and swipeOffset from deps

  const handleMouseDown = (e: React.MouseEvent) => {
    if (readOnly || !onSwapRequest) return;
    
    // Ignore swipe gesture if clicking on an input, textarea, or contenteditable element
    const target = e.target as HTMLElement;
    if (
      target.tagName === 'INPUT' ||
      target.tagName === 'TEXTAREA' ||
      target.tagName === 'SELECT' ||
      target.isContentEditable
    ) {
      return;
    }
    
    isDragging.current = true;
    touchStartX.current = e.clientX;
    touchStartY.current = e.clientY;
    isHorizontalSwipe.current = false;
    maxSwipeDelta.current = 0;
    setIsPressed(true);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (readOnly || !onSwapRequest || !isDragging.current) return;
    
    const deltaX = e.clientX - touchStartX.current;
    const deltaY = e.clientY - touchStartY.current;
    
    // Detect if the gesture is primarily horizontal (strict detection)
    if (!isHorizontalSwipe.current) {
      const absX = Math.abs(deltaX);
      const absY = Math.abs(deltaY);
      
      // Only check direction after minimum horizontal movement
      // Require horizontal to be significantly larger than vertical (2:1 ratio)
      if (absX > SWIPE_ANGLE_THRESHOLD && absX > absY * SWIPE_ANGLE_RATIO) {
        isHorizontalSwipe.current = true;
      } else if (absY > SWIPE_ANGLE_THRESHOLD) {
        isHorizontalSwipe.current = false;
      }
    }
    
    if (!isHorizontalSwipe.current) return;
    
    // Track max swipe distance for trigger detection
    if (deltaX < 0) {
      maxSwipeDelta.current = Math.max(maxSwipeDelta.current, Math.abs(deltaX));
    }
    
    if (isSwipeRevealed) {
      const newOffset = Math.min(0, Math.max(-SWAP_BUTTON_WIDTH, -SWAP_BUTTON_WIDTH + deltaX));
      setSwipeOffset(newOffset);
    } else {
      const newOffset = Math.min(0, Math.max(-SWAP_BUTTON_WIDTH - 20, deltaX));
      setSwipeOffset(newOffset);
    }
  };

  const handleMouseUp = () => {
    if (readOnly || !onSwapRequest) return;
    isDragging.current = false;
    setIsPressed(false);
    
    // Check if swiped far enough to auto-trigger swap (use max tracked distance)
    if (maxSwipeDelta.current > SWIPE_TRIGGER_THRESHOLD) {
      // Fully swiped - trigger swap immediately
      setSwipeOffset(0);
      setIsSwipeRevealed(false);
      onSwapRequest?.();
    } else if (Math.abs(swipeOffset) > SWIPE_THRESHOLD / 2) {
      // Partial swipe - reveal swap button
      setSwipeOffset(-SWAP_BUTTON_WIDTH);
      setIsSwipeRevealed(true);
    } else {
      // Not swiped enough - reset
      setSwipeOffset(0);
      setIsSwipeRevealed(false);
    }
    isHorizontalSwipe.current = false;
    maxSwipeDelta.current = 0;
  };

  const handleMouseLeave = () => {
    if (isDragging.current) {
      handleMouseUp();
    }
    setIsPressed(false);
  };

  const handleSwapClick = () => {
    setSwipeOffset(0);
    setIsSwipeRevealed(false);
    onSwapRequest?.();
  };

  const toggleHistory = () => {
    setShowHistory(!showHistory);
  };

  const getTargetReps = () => {
    const reps = exercise.targetReps;
    if (reps.includes('-')) {
      return reps.split('-')[0]; 
    }
    return reps;
  };
  
  const targetRepsPlaceholder = getTargetReps();

  const updateSet = (index: number, field: 'reps' | 'weight', value: number) => {
    const newSets = [...sets];
    newSets[index] = { ...newSets[index], [field]: value };
    onSetsChange(newSets);
  };

  const addSet = () => {
    const newIndex = sets.length;
    onSetsChange([...sets, { reps: 0, weight: 0, completed: false }]);
    setNewlyAddedSetIndex(newIndex);
    
    // Clear animation flag after animation completes
    setTimeout(() => {
      setNewlyAddedSetIndex(null);
    }, 500);
    
    // Focus the new set's reps input after animation
    setTimeout(() => {
      repsInputRefs.current[newIndex]?.focus();
    }, 300);
  };

  // Smart input flow: reps -> weight -> next set
  const repsTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const weightTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  const handleRepsChange = (index: number, value: string) => {
    const numValue = Number(value) || 0;
    
    // Use optimized handler if available (only POSTs this field)
    if (onSetFieldChange) {
      onSetFieldChange(index, 'reps', numValue);
    } else {
      updateSet(index, 'reps', numValue);
    }
    
    // Clear existing timeout
    if (repsTimeoutRef.current) {
      clearTimeout(repsTimeoutRef.current);
    }
    
    // Auto-focus weight input after 800ms delay (allows typing "10", "12", etc.)
    if (value.length >= 1 && numValue > 0) {
      repsTimeoutRef.current = setTimeout(() => {
        weightInputRefs.current[index]?.focus();
      }, 800);
    }
  };

  const handleWeightChange = (index: number, value: string) => {
    const cleanedValue = value.replace(/[^0-9.]/g, "");
    const [wholePart, ...decimalParts] = cleanedValue.split(".");
    const sanitizedValue = decimalParts.length > 0 ? `${wholePart}.${decimalParts.join("")}` : wholePart;

    setWeightInputValues(prev => ({ ...prev, [index]: sanitizedValue }));
    const parsedValue = Number.parseFloat(sanitizedValue);
    const numValue = Number.isNaN(parsedValue) ? 0 : parsedValue;
    
    // Use optimized handler if available (only POSTs this field)
    if (onSetFieldChange) {
      onSetFieldChange(index, 'weight', numValue);
    } else {
      updateSet(index, 'weight', numValue);
    }
    
    // Clear existing timeout
    if (weightTimeoutRef.current) {
      clearTimeout(weightTimeoutRef.current);
    }
    
    // If both reps and weight are entered, show rest timer options after delay
    if (numValue > 0 && sets[index]?.reps > 0) {
      weightTimeoutRef.current = setTimeout(() => {
        // Mark this set as completed
        setCompletedSets(prev => {
          const newSet = new Set(prev);
          newSet.add(index);
          return newSet;
        });
        
        // Clear completed status after animation
        setTimeout(() => {
          setCompletedSets(prev => {
            const newSet = new Set(prev);
            newSet.delete(index);
            return newSet;
          });
        }, 1500);
        
        // Show rest timer selection instead of auto-starting
        setShowRestTimer(index);
        
        // Call completion callback
        onSetComplete?.();
        
        // Auto-advance to next set
        if (index < sets.length - 1) {
          setTimeout(() => {
            repsInputRefs.current[index + 1]?.focus();
          }, 500);
        }
      }, 600);
    }
  };

  const handleWeightBlur = (index: number) => {
    setWeightInputValues(prev => {
      if (!(index in prev)) return prev;
      const next = { ...prev };
      delete next[index];
      return next;
    });
  };
  
  const startRestTimer = (seconds: number) => {
    setRestTimeRemaining(seconds);
  };

  const getLastSessionStats = () => {
    if (!lastLiftHistory || lastLiftHistory.length === 0) return null;
    
    const lastEntry = lastLiftHistory[0];
    if (!lastEntry || !lastEntry.sets.length) return null;

    const validSets = lastEntry.sets.filter(s => s.weight > 0);
    if (validSets.length === 0) return null;

    const bestSet = validSets.reduce((prev, current) => (prev.weight > current.weight) ? prev : current);
    return `${bestSet.reps} × ${bestSet.weight}kg`;
  };

  const lastSessionSummary = getLastSessionStats();

  const formatRestTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="relative mb-4">
      {onSwapRequest && (
        <button
          onClick={handleSwapClick}
          className="absolute right-0 top-0 bottom-0 w-20 bg-linear-to-br from-[#0078FF] to-[#0066DD] flex items-center justify-center rounded-r-2xl active:scale-95 transition-all duration-200 shadow-[4px_0_16px_rgba(0,120,255,0.3)] z-0"
        >
          <ArrowRightLeft className="w-6 h-6 text-white" />
        </button>
      )}
      
      <div
        ref={cardRef}
        className={`bg-[#1C1C1E] rounded-2xl overflow-hidden relative select-none border border-white/6 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.5)] transition-all duration-300 ease-[cubic-bezier(0.23,1,0.32,1)] ${isPressed ? 'scale-[0.97] shadow-[0_2px_12px_-2px_rgba(0,0,0,0.6)]' : 'scale-100'}`}
        style={{ transform: `translateX(${swipeOffset}px)`, touchAction: 'pan-y' }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
      >
        {/* Exercise Header */}
        <div className="px-4 py-4 border-b border-white/5">
          <div className="flex items-start gap-3 mb-3">
            {exerciseNumber && (
              <div className="w-8 h-8 rounded-full bg-[#0078FF]/15 flex items-center justify-center shrink-0 mt-0.5">
                <span className="text-[13px] font-bold text-[#0078FF]">{exerciseNumber}</span>
              </div>
            )}
            
            {/* Exercise Image / Video Thumbnail */}
            {exercise.thumbnailUrl && (
              <button
                onClick={() => exercise.videoUrl && setShowVideo(true)}
                disabled={!exercise.videoUrl}
                className={`w-12 h-12 rounded-xl overflow-hidden shrink-0 relative bg-[#2C2C2E] ${exercise.videoUrl ? 'cursor-pointer active:scale-95' : ''} transition-transform`}
              >
                <Image
                  src={exercise.thumbnailUrl}
                  alt={exercise.name}
                  fill
                  className="object-cover"
                  sizes="48px"
                />
                {exercise.videoUrl && (
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                    <div className="w-6 h-6 rounded-full bg-white/90 flex items-center justify-center">
                      <Play className="w-3 h-3 text-black fill-black ml-0.5" />
                    </div>
                  </div>
                )}
              </button>
            )}
            
            <div className="flex-1 min-w-0">
              <h3 className="text-[17px] font-semibold leading-tight">{exercise.name}</h3>
              <p className="text-[13px] text-[#636366] mt-1">
                Target: {exercise.targetSets} × {exercise.targetReps}
              </p>
            </div>
          </div>

          {/* Last Session & History Toggle */}
          <div className="flex items-center gap-2">
            {lastSessionSummary && (
              <button 
                onClick={toggleHistory}
                className={`flex items-center gap-2 pl-2.5 pr-3 py-1.5 rounded-full w-fit active:scale-95 transition-all duration-200 ease-[cubic-bezier(0.23,1,0.32,1)] shadow-[inset_0_1px_0_0_rgba(255,255,255,0.05)] ${showHistory ? 'bg-[#0078FF]/20' : 'bg-[#2C2C2E]/80 hover:bg-[#2C2C2E]'}`}
              >
                <div className="w-5 h-5 rounded-full bg-[#3A3A3C] flex items-center justify-center shadow-sm">
                  <History className={`w-3 h-3 transition-colors ${showHistory ? 'text-[#0078FF]' : 'text-[#8E8E93]'}`} />
                </div>
                <span className="text-[13px] font-medium text-[#E5E5EA]">Last: {lastSessionSummary}</span>
                <ChevronRight className={`w-3 h-3 text-[#8E8E93] transition-transform ${showHistory ? 'rotate-90' : ''}`} />
              </button>
            )}
          </div>
        </div>

        {/* Inline History Expansion */}
        <div className={`overflow-hidden transition-all duration-500 ease-[cubic-bezier(0.23,1,0.32,1)] ${showHistory ? 'max-h-[400px] opacity-100' : 'max-h-0 opacity-0'}`}>
          <div className="p-4 bg-[#0A0A0A]/50 border-b border-white/4">
            <div className="space-y-3">
              {lastLiftHistory.slice(0, 3).map((entry, entryIndex) => (
                <div 
                  key={entryIndex} 
                  className="bg-[#1C1C1E] rounded-xl p-3 border border-white/4"
                >
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-[13px] font-medium text-[#D1D1D6]">
                      {new Date(entry.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                    </span>
                    <span className="text-[12px] text-[#8E8E93] bg-[#2C2C2E] px-2 py-0.5 rounded-md">
                      Max: {Math.max(...entry.sets.map(s => s.weight))}kg
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {entry.sets.map((s, i) => (
                      <div key={i} className="bg-[#2C2C2E] px-2 py-1 rounded-lg text-[12px]">
                        <span className="text-white">{s.reps}</span>
                        <span className="text-[#8E8E93] mx-0.5">×</span>
                        <span className="text-[#0078FF] font-medium">{s.weight}kg</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Set Inputs - Right Aligned for Thumb Access */}
        <div>
          {/* Header Row */}
          <div className="grid grid-cols-[1fr_2fr_2fr] px-4 py-2 bg-black/20">
            <span className="text-[12px] text-[#8E8E93] uppercase tracking-wide text-center">Set</span>
            <span className="text-[12px] text-[#8E8E93] uppercase tracking-wide text-right pr-4">Reps</span>
            <span className="text-[12px] text-[#8E8E93] uppercase tracking-wide text-right pr-4">kg</span>
          </div>

          {sets.map((set, index) => (
            <div 
              key={index} 
              className={`grid grid-cols-[1fr_2fr_2fr] items-center px-4 py-3 border-t border-white/5 gap-2 transition-all duration-500 ease-[cubic-bezier(0.23,1,0.32,1)] ${completedSets.has(index) ? 'bg-[#34C759]/5' : ''} ${newlyAddedSetIndex === index ? 'animate-in slide-in-from-top-4 fade-in' : ''}`}
            >
              {/* Set Number with Completion Check */}
              <div className="h-12 flex items-center justify-center relative">
                <span className={`text-[17px] font-medium transition-all duration-300 ${completedSets.has(index) ? 'text-[#34C759] scale-110' : 'text-[#8E8E93]'}`}>
                  {completedSets.has(index) ? (
                    <Check className="w-6 h-6" />
                  ) : (
                    index + 1
                  )}
                </span>
              </div>
              
              {/* Reps Input - Right Aligned */}
              <div className="relative">
                <input 
                  ref={(el) => { repsInputRefs.current[index] = el; }}
                  type="text" 
                  inputMode="numeric"
                  pattern="[0-9]*"
                  placeholder={targetRepsPlaceholder}
                  className={`h-12 w-full bg-[#2C2C2E] border-0 rounded-xl text-[18px] font-semibold text-white placeholder:text-[#48484A] focus:outline-none focus:ring-2 focus:ring-[#0078FF]/50 text-right pr-4 transition-all duration-200 [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none disabled:opacity-70 disabled:cursor-not-allowed ${completedSets.has(index) ? 'bg-[#34C759]/10 text-[#34C759]' : ''}`}
                  value={set.reps || ""} 
                  onChange={(e) => handleRepsChange(index, e.target.value)}
                  disabled={readOnly}
                />
              </div>
              
              {/* Weight Input - Right Aligned */}
              <div className="relative">
                <input 
                  ref={(el) => { weightInputRefs.current[index] = el; }}
                  type="text" 
                  inputMode="decimal"
                  pattern="[0-9.]*"
                  placeholder="—" 
                  className={`h-12 w-full bg-[#2C2C2E] border-0 rounded-xl text-[18px] font-semibold text-white placeholder:text-[#48484A] focus:outline-none focus:ring-2 focus:ring-[#0078FF]/50 text-right pr-4 transition-all duration-200 [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none disabled:opacity-70 disabled:cursor-not-allowed ${completedSets.has(index) ? 'bg-[#34C759]/10 text-[#34C759]' : ''}`}
                  value={weightInputValues[index] ?? (set.weight || "")} 
                  onChange={(e) => handleWeightChange(index, e.target.value)}
                  onBlur={() => handleWeightBlur(index)}
                  disabled={readOnly}
                />
              </div>
            </div>
          ))}

          {/* Rest Timer - Revolut Style Selection */}
          {showRestTimer !== null && restTimeRemaining === 0 && (
            <div className="px-4 py-4 bg-[#0A0A0A] border-t border-white/6">
              <p className="text-[13px] text-[#8E8E93] mb-3 text-center">Rest before next set</p>
              <div className="flex items-center justify-center gap-3">
                {[60, 90, 120].map((seconds) => (
                  <button
                    key={seconds}
                    onClick={() => startRestTimer(seconds)}
                    className="px-5 py-3 bg-[#1C1C1E] rounded-xl border border-white/6 active:scale-95 transition-all duration-200 ease-[cubic-bezier(0.23,1,0.32,1)] hover:bg-[#2C2C2E] hover:border-[#0078FF]/30"
                  >
                    <span className="text-[16px] font-semibold text-white">{seconds / 60}</span>
                    <span className="text-[12px] text-[#8E8E93] ml-0.5">min</span>
                  </button>
                ))}
              </div>
            </div>
          )}
          
          {showRestTimer !== null && restTimeRemaining > 0 && (
            <div className="px-4 py-3 bg-[#0078FF]/10 border-t border-[#0078FF]/20">
              <div className="flex items-center justify-between">
                <span className="text-[14px] font-medium text-[#0078FF]">Rest Timer</span>
                <span className="text-[18px] font-bold text-[#0078FF] tabular-nums">
                  {formatRestTime(restTimeRemaining)}
                </span>
              </div>
              <div className="mt-2 h-1 bg-[#0078FF]/20 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-[#0078FF] transition-all duration-1000 ease-linear"
                  style={{ width: `${(restTimeRemaining / (exercise.restSeconds || 90)) * 100}%` }}
                />
              </div>
            </div>
          )}

          {!readOnly && (
            <button 
              onClick={addSet}
              className="w-full py-4 flex items-center justify-center gap-2 text-[#0078FF] text-[15px] font-medium border-t border-white/6 active:bg-white/4 active:scale-[0.98] transition-all duration-200 ease-[cubic-bezier(0.23,1,0.32,1)]"
            >
              <Plus className="w-4 h-4" />
              Add Set
            </button>
          )}
        </div>
      </div>

      {/* Video Modal */}
      <Dialog open={showVideo} onOpenChange={setShowVideo}>
        <DialogContent className="max-w-lg bg-black border-white/10 p-0 overflow-hidden">
          <DialogTitle className="sr-only">{exercise.name} - Exercise Video</DialogTitle>
          <div className="aspect-video bg-[#0A0A0A] flex items-center justify-center">
            {exercise.videoUrl ? (
              <video
                src={exercise.videoUrl}
                controls
                autoPlay
                className="w-full h-full object-contain"
                playsInline
              />
            ) : (
              <p className="text-[#8E8E93]">No video available</p>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
