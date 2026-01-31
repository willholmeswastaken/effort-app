"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Dumbbell, ChevronRight, Check, Loader2, Sparkles } from "lucide-react";
import { useUpdatePreferences } from "@/lib/queries";

interface Program {
  id: string;
  name: string;
  description: string | null;
  daysPerWeek: number;
  weekCount: number;
}

interface OnboardingClientProps {
  programs: Program[];
}

export function OnboardingClient({ programs }: OnboardingClientProps) {
  const router = useRouter();
  const updatePreferences = useUpdatePreferences();
  const [step, setStep] = useState(0);
  const [selectedProgramId, setSelectedProgramId] = useState<string | null>(null);
  const [isAnimating, setIsAnimating] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [modalAnimating, setModalAnimating] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Entry animation
  useEffect(() => {
    const timer = setTimeout(() => setMounted(true), 100);
    return () => clearTimeout(timer);
  }, []);

  const handleSelectProgram = (id: string) => {
    setSelectedProgramId(id);
  };

  const handleComplete = () => {
    if (!selectedProgramId || updatePreferences.isPending) return;
    
    updatePreferences.mutate({
      activeProgramId: selectedProgramId,
      hasOnboarded: true,
    }, {
      onSuccess: () => {
        setShowSuccessModal(true);
        requestAnimationFrame(() => {
          setModalAnimating(true);
        });
      },
      onError: (e) => {
        console.error("Failed to save preferences", e);
      },
    });
  };

  // Auto-navigate after modal shows
  useEffect(() => {
    if (showSuccessModal && modalAnimating) {
      const timer = setTimeout(() => {
        navigateToHome();
      }, 2000);
      
      return () => clearTimeout(timer);
    }
  }, [showSuccessModal, modalAnimating]);

  const navigateToHome = () => {
    setModalAnimating(false);
    setTimeout(() => {
      router.push("/");
    }, 300);
  };

  const nextStep = () => {
    setIsAnimating(true);
    setTimeout(() => {
      setStep(step + 1);
      setIsAnimating(false);
    }, 300);
  };

  return (
    <main className="min-h-screen bg-black text-white flex flex-col">
      {/* Progress Bar */}
      <div className="px-6 pt-14 pb-8">
        <div className="flex gap-2">
          {[0, 1].map((i) => (
            <div 
              key={i} 
              className="flex-1 h-1 rounded-full bg-white/10 overflow-hidden"
            >
              <div 
                className={`h-full rounded-full transition-all duration-500 ease-out ${
                  i < step ? 'w-full bg-[#34C759]' : 
                  i === step ? 'w-full bg-[#0078FF]' : 
                  'w-0 bg-[#0078FF]'
                }`}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className={`flex-1 px-6 transition-all duration-300 ease-out ${
        isAnimating ? 'opacity-0 translate-x-8' : 'opacity-100 translate-x-0'
      } ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
        {step === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center">
            {/* Animated Gradient Icon */}
            <div className="relative mb-10">
              <div 
                className="w-28 h-28 rounded-full animate-gradient-slow flex items-center justify-center"
                style={{
                  background: 'linear-gradient(135deg, #8B5CF6 0%, #6366F1 25%, #4F46E5 50%, #6366F1 75%, #8B5CF6 100%)',
                  backgroundSize: '200% 200%',
                }}
              >
                <Dumbbell className="w-14 h-14" />
              </div>
              {/* Glow effect */}
              <div 
                className="absolute inset-0 rounded-full blur-2xl opacity-40 -z-10"
                style={{
                  background: 'linear-gradient(135deg, #8B5CF6 0%, #6366F1 50%, #4F46E5 100%)',
                }}
              />
            </div>
            
            {/* Welcome Text */}
            <h1 className="text-4xl font-bold mb-4 tracking-tight">
              Welcome to EffortApp
            </h1>
            <p className="text-[#8E8E93] text-lg max-w-xs leading-relaxed">
              Your personal workout companion for building strength and tracking progress.
            </p>
          </div>
        )}

        {step === 1 && (
          <div className="h-full flex flex-col">
            <div className="text-center mb-10">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#0078FF]/10 text-[#0078FF] text-sm font-medium mb-4">
                <Sparkles className="w-4 h-4" />
                Step 2 of 2
              </div>
              <h1 className="text-3xl font-bold mb-3 tracking-tight">
                Choose Your Program
              </h1>
              <p className="text-[#8E8E93] text-base">
                Select a training split that fits your schedule
              </p>
            </div>

            <div className="flex-1 space-y-3">
              {programs.map((p, index) => (
                <button
                  key={p.id}
                  onClick={() => handleSelectProgram(p.id)}
                  className={`w-full text-left p-5 rounded-2xl flex items-center justify-between transition-all duration-200 ${
                    selectedProgramId === p.id 
                      ? 'bg-[#0078FF] shadow-[0_0_24px_rgba(0,120,255,0.3)]' 
                      : 'bg-[#1C1C1E] active:scale-[0.98]'
                  }`}
                  style={{
                    animationDelay: `${index * 100}ms`,
                  }}
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 ${
                      selectedProgramId === p.id ? 'bg-white/20' : 'bg-[#2C2C2E]'
                    }`}>
                      <span className={`text-lg font-bold ${
                        selectedProgramId === p.id ? 'text-white' : 'text-[#0078FF]'
                      }`}>
                        {p.daysPerWeek}x
                      </span>
                    </div>
                    <div>
                      <p className="font-semibold text-[17px]">{p.name}</p>
                      <p className={`text-[13px] ${selectedProgramId === p.id ? 'text-white/70' : 'text-[#636366]'}`}>
                        {p.daysPerWeek} sessions/week • {p.weekCount} weeks
                      </p>
                    </div>
                  </div>
                  {selectedProgramId === p.id ? (
                    <div className="w-7 h-7 rounded-full bg-white flex items-center justify-center shrink-0">
                      <Check className="w-4 h-4 text-[#0078FF]" />
                    </div>
                  ) : (
                    <ChevronRight className="w-5 h-5 text-[#48484A] shrink-0" />
                  )}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Bottom Action - Safe area padding */}
      <div className="p-6 pb-[max(2.5rem,env(safe-area-inset-bottom))]">
        {step === 0 && (
          <button
            onClick={nextStep}
            className="w-full py-4 bg-[#0078FF] rounded-2xl text-[17px] font-semibold active:scale-[0.98] transition-transform shadow-[0_0_24px_rgba(0,120,255,0.3)]"
          >
            Get Started
          </button>
        )}
        
        {step === 1 && (
          <button
            onClick={handleComplete}
            disabled={!selectedProgramId || updatePreferences.isPending}
            className={`w-full py-4 rounded-2xl text-[17px] font-semibold transition-all duration-200 flex items-center justify-center gap-2 ${
              selectedProgramId && !updatePreferences.isPending
                ? 'bg-[#0078FF] active:scale-[0.98] shadow-[0_0_24px_rgba(0,120,255,0.3)]' 
                : 'bg-[#2C2C2E] text-[#636366] cursor-not-allowed'
            }`}
          >
            {updatePreferences.isPending ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Setting up...
              </>
            ) : (
              'Continue'
            )}
          </button>
        )}
      </div>

      {/* Success Modal */}
      {showSuccessModal && (
        <div 
          className={`fixed inset-0 z-50 flex items-center justify-center transition-all duration-300 ease-out ${
            modalAnimating ? 'bg-black/80' : 'bg-black/0'
          }`}
          style={{ backdropFilter: modalAnimating ? 'blur(12px)' : 'blur(0px)' }}
        >
          <div 
            className={`w-[85%] max-w-sm bg-[#1C1C1E] rounded-3xl p-8 text-center transition-all duration-300 ease-out ${
              modalAnimating 
                ? 'opacity-100 translate-y-0 scale-100' 
                : 'opacity-0 translate-y-8 scale-95'
            }`}
          >
            {/* Progress Handle - CSS animation for countdown */}
            <div className="w-12 h-1.5 bg-white/10 rounded-full mx-auto mb-8 overflow-hidden">
              <div 
                className={`h-full bg-[#0078FF] rounded-full ${modalAnimating ? 'animate-countdown' : ''}`}
                style={{ 
                  transformOrigin: 'left',
                  animation: modalAnimating ? 'countdown 2s linear forwards' : 'none',
                }}
              />
            </div>
            
            {/* Animated Checkmark */}
            <div className="w-20 h-20 rounded-full bg-[#34C759] flex items-center justify-center mx-auto mb-6 shadow-[0_0_32px_rgba(52,199,89,0.4)]">
              <Check className="w-10 h-10 text-white" />
            </div>
            
            {/* Title */}
            <h2 className="text-[24px] font-bold mb-2 tracking-tight">You're all set!</h2>
            <p className="text-[15px] text-[#8E8E93] mb-8 leading-relaxed">
              Your workout program is ready. Let's start building strength together.
            </p>
            
            {/* CTA */}
            <button 
              onClick={navigateToHome}
              className="w-full py-4 bg-[#0078FF] rounded-2xl text-[17px] font-semibold active:scale-[0.98] transition-transform shadow-[0_0_24px_rgba(0,120,255,0.3)]"
            >
              Let's Go
            </button>
          </div>
        </div>
      )}
    </main>
  );
}
