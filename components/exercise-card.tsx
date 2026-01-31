"use client";

import { useState, useRef } from "react";
import { Exercise, SetLog } from "@/lib/types";
import { Plus, History, ChevronRight, X, ArrowRightLeft } from "lucide-react";

interface ExerciseCardProps {
  exercise: Exercise;
  exerciseNumber?: number;
  sets: SetLog[];
  onSetsChange: (sets: SetLog[]) => void;
  lastLiftHistory?: Array<{ date: string; sets: Array<{ setNumber: number; reps: number; weight: number }> }>;
  readOnly?: boolean;
  onSwapRequest?: () => void;
}

export function ExerciseCard({ exercise, exerciseNumber, sets, onSetsChange, lastLiftHistory = [], readOnly = false, onSwapRequest }: ExerciseCardProps) {
  const [showHistory, setShowHistory] = useState(false);
  const [modalAnimating, setModalAnimating] = useState(false);
  const [swipeOffset, setSwipeOffset] = useState(0);
  const [isSwipeRevealed, setIsSwipeRevealed] = useState(false);
  
  const touchStartX = useRef(0);
  const touchStartY = useRef(0);
  const isHorizontalSwipe = useRef(false);
  const isDragging = useRef(false);

  const SWIPE_THRESHOLD = 80; // px to reveal swap button
  const SWAP_BUTTON_WIDTH = 80;


  const handleTouchStart = (e: React.TouchEvent) => {
    if (readOnly || !onSwapRequest) return;
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
    isHorizontalSwipe.current = false;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (readOnly || !onSwapRequest) return;
    
    const deltaX = e.touches[0].clientX - touchStartX.current;
    const deltaY = e.touches[0].clientY - touchStartY.current;
    
    // Determine if this is a horizontal swipe on first significant move
    if (!isHorizontalSwipe.current && Math.abs(deltaX) > 10) {
      isHorizontalSwipe.current = Math.abs(deltaX) > Math.abs(deltaY);
    }
    
    if (!isHorizontalSwipe.current) return;
    
    if (isSwipeRevealed) {
      const newOffset = Math.min(0, Math.max(-SWAP_BUTTON_WIDTH, -SWAP_BUTTON_WIDTH + deltaX));
      setSwipeOffset(newOffset);
    } else {
      const newOffset = Math.min(0, Math.max(-SWAP_BUTTON_WIDTH - 20, deltaX));
      setSwipeOffset(newOffset);
    }
  };

  const handleTouchEnd = () => {
    if (readOnly || !onSwapRequest) return;
    
    if (Math.abs(swipeOffset) > SWIPE_THRESHOLD / 2) {
      setSwipeOffset(-SWAP_BUTTON_WIDTH);
      setIsSwipeRevealed(true);
    } else {
      setSwipeOffset(0);
      setIsSwipeRevealed(false);
    }
    isHorizontalSwipe.current = false;
  };


  const handleMouseDown = (e: React.MouseEvent) => {
    if (readOnly || !onSwapRequest) return;
    isDragging.current = true;
    touchStartX.current = e.clientX;
    touchStartY.current = e.clientY;
    isHorizontalSwipe.current = false;
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (readOnly || !onSwapRequest || !isDragging.current) return;
    
    const deltaX = e.clientX - touchStartX.current;
    const deltaY = e.clientY - touchStartY.current;
    
    // Determine if this is a horizontal swipe on first significant move
    if (!isHorizontalSwipe.current && Math.abs(deltaX) > 10) {
      isHorizontalSwipe.current = Math.abs(deltaX) > Math.abs(deltaY);
    }
    
    if (!isHorizontalSwipe.current) return;
    
    // Only allow left swipe (negative delta)
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
    
    // Snap to revealed or closed based on threshold
    if (Math.abs(swipeOffset) > SWIPE_THRESHOLD / 2) {
      setSwipeOffset(-SWAP_BUTTON_WIDTH);
      setIsSwipeRevealed(true);
    } else {
      setSwipeOffset(0);
      setIsSwipeRevealed(false);
    }
    isHorizontalSwipe.current = false;
  };

  const handleMouseLeave = () => {
    if (isDragging.current) {
      handleMouseUp();
    }
  };

  const handleSwapClick = () => {
    setSwipeOffset(0);
    setIsSwipeRevealed(false);
    onSwapRequest?.();
  };

  const openHistory = () => {
    setShowHistory(true);
    requestAnimationFrame(() => {
      setModalAnimating(true);
    });
  };

  const closeHistory = () => {
    setModalAnimating(false);
    setTimeout(() => {
      setShowHistory(false);
    }, 300);
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
    onSetsChange([...sets, { reps: 0, weight: 0, completed: false }]);
  };

  const inputStyle: React.CSSProperties = {
    MozAppearance: 'textfield',
    WebkitAppearance: 'none',
    appearance: 'textfield',
    textAlign: 'center',
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

  return (
    <>
      <div className="relative mb-4 overflow-hidden">
        {onSwapRequest && (
          <button
            onClick={handleSwapClick}
            className="absolute right-0 top-0 bottom-0 w-20 bg-[#0078FF] flex items-center justify-center rounded-r-2xl active:bg-[#0066DD] transition-colors"
          >
            <ArrowRightLeft className="w-6 h-6 text-white" />
          </button>
        )}
        
        <div 
          className="bg-[#1C1C1E] rounded-2xl overflow-hidden relative transition-transform duration-200 ease-out select-none"
          style={{ transform: `translateX(${swipeOffset}px)` }}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseLeave}
        >
        <div className="px-4 py-4 border-b border-white/5">
          <div className="flex items-start gap-3 mb-3">
            {exerciseNumber && (
              <div className="w-8 h-8 rounded-full bg-[#0078FF]/15 flex items-center justify-center shrink-0 mt-0.5">
                <span className="text-[13px] font-bold text-[#0078FF]">{exerciseNumber}</span>
              </div>
            )}
            <div className="flex-1 min-w-0">
              <h3 className="text-[17px] font-semibold leading-tight">{exercise.name}</h3>
              <p className="text-[13px] text-[#636366] mt-1">
                Target: {exercise.targetSets} × {exercise.targetReps}
              </p>
            </div>
          </div>

          {lastSessionSummary && (
            <button 
              onClick={openHistory}
              className="flex items-center gap-2 bg-[#2C2C2E] pl-2.5 pr-3 py-1.5 rounded-full w-fit active:scale-[0.98] transition-transform"
            >
              <div className="w-5 h-5 rounded-full bg-[#3A3A3C] flex items-center justify-center">
                <History className="w-3 h-3 text-[#0078FF]" />
              </div>
              <span className="text-[13px] font-medium text-[#E5E5EA]">Last: {lastSessionSummary}</span>
              <ChevronRight className="w-3 h-3 text-[#8E8E93]" />
            </button>
          )}
        </div>

        <div>
          <div className="grid grid-cols-3 px-4 py-2 bg-black/20">
            <span className="text-[12px] text-[#8E8E93] uppercase tracking-wide text-center">Set</span>
            <span className="text-[12px] text-[#8E8E93] uppercase tracking-wide text-center">Reps</span>
            <span className="text-[12px] text-[#8E8E93] uppercase tracking-wide text-center">kg</span>
          </div>

          {sets.map((set, index) => (
            <div 
              key={index} 
              className="grid grid-cols-3 items-center px-4 py-2 border-t border-white/5 gap-2"
            >
              <div className="h-10 flex items-center justify-center">
                <span className="text-[15px] text-[#8E8E93]">{index + 1}</span>
              </div>
              
              <input 
                type="text" 
                inputMode="numeric"
                pattern="[0-9]*"
                placeholder={targetRepsPlaceholder}
                style={inputStyle}
                className="h-10 w-full bg-[#2C2C2E] border-0 rounded-lg text-[16px] font-medium text-white placeholder:text-[#48484A] focus:outline-none focus:ring-1 focus:ring-[#0078FF] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none disabled:opacity-70 disabled:cursor-not-allowed"
                value={set.reps || ""} 
                onChange={(e) => updateSet(index, 'reps', Number(e.target.value) || 0)}
                disabled={readOnly}
              />
              
              <input 
                type="text" 
                inputMode="decimal"
                pattern="[0-9.]*"
                placeholder="—" 
                style={inputStyle}
                className="h-10 w-full bg-[#2C2C2E] border-0 rounded-lg text-[16px] font-medium text-white placeholder:text-[#48484A] focus:outline-none focus:ring-1 focus:ring-[#0078FF] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none disabled:opacity-70 disabled:cursor-not-allowed"
                value={set.weight || ""} 
                onChange={(e) => updateSet(index, 'weight', Number(e.target.value) || 0)}
                disabled={readOnly}
              />
            </div>
          ))}

          {!readOnly && (
            <button 
              onClick={addSet}
              className="w-full py-3 flex items-center justify-center gap-2 text-[#0078FF] text-[15px] font-medium border-t border-white/5 active:bg-white/5"
            >
              <Plus className="w-4 h-4" />
              Add Set
            </button>
          )}
        </div>
        </div>
      </div>

      {showHistory && (
        <div 
          className={`fixed inset-0 z-999 flex items-center justify-center transition-all duration-300 ease-out ${
            modalAnimating ? 'bg-black/60 backdrop-blur-sm' : 'bg-black/0 backdrop-blur-none'
          }`}
          onClick={closeHistory}
        >
          <div 
            className={`w-[90%] max-w-md bg-[#1C1C1E] rounded-3xl flex flex-col max-h-[60vh] transition-all duration-300 ease-out ${
              modalAnimating 
                ? 'opacity-100 translate-y-0' 
                : 'opacity-0 translate-y-8'
            }`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-4 border-b border-white/5 flex items-center justify-between">
              <div className="w-8" /> 
              <h2 className="text-[17px] font-semibold">{exercise.name}</h2>
              <button 
                onClick={closeHistory}
                className="w-8 h-8 flex items-center justify-center rounded-full bg-[#2C2C2E]"
              >
                <X className="w-5 h-5 text-[#8E8E93]" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {lastLiftHistory
                .map((entry, entryIndex) => (
                  <div key={entryIndex} className="bg-[#2C2C2E] rounded-2xl p-4">
                    <div className="flex justify-between items-center mb-3">
                      <span className="text-[15px] font-medium text-[#D1D1D6]">
                        {new Date(entry.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </span>
                      <span className="text-[13px] text-[#8E8E93] bg-[#3A3A3C] px-2 py-0.5 rounded-md">
                        Max: {Math.max(...entry.sets.map(s => s.weight))}kg
                      </span>
                    </div>
                    
                    <div className="flex flex-wrap gap-2">
                      {entry.sets.map((s, i) => (
                        <div key={i} className="bg-[#3A3A3C] px-3 py-1.5 rounded-lg border border-white/5">
                          <span className="text-[13px] font-medium text-white">{s.reps}</span>
                          <span className="text-[13px] text-[#8E8E93] mx-1">|</span>
                          <span className="text-[13px] font-medium text-[#0078FF]">{s.weight}kg</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
                
                {lastLiftHistory.length === 0 && (
                  <div className="text-center py-10 text-[#8E8E93]">
                    No history found
                  </div>
                )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
