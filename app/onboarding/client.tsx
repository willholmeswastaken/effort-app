"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Check, Loader2, Dumbbell } from "lucide-react";
import { useUpdatePreferences } from "@/lib/queries";
import { AnimateIn } from "@/components/animate-in";

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
  const [selectedProgramId, setSelectedProgramId] = useState<string | null>(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [modalAnimating, setModalAnimating] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setMounted(true), 100);
    return () => clearTimeout(timer);
  }, []);

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

  return (
    <AnimateIn>
    <main className="min-h-screen bg-black text-white flex flex-col">
      <div className={`flex-1 px-6 pt-14 transition-all duration-500 ease-out ${
        mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
      }`}>
        {/* Welcome Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-full bg-[#0078FF]/15 flex items-center justify-center mx-auto mb-4">
            <Dumbbell className="w-8 h-8 text-[#0078FF]" />
          </div>
          <h1 className="text-3xl font-bold mb-2 tracking-tight">
            Welcome
          </h1>
          <p className="text-[#8E8E93] text-base max-w-xs mx-auto">
            Choose a training program to get started
          </p>
        </div>

        {/* Program List */}
        <div className="space-y-3">
          {programs.map((p, index) => (
            <button
              key={p.id}
              onClick={() => setSelectedProgramId(p.id)}
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
                <div className="w-5" />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Bottom CTA */}
      <div className="p-6 pb-[max(2.5rem,env(safe-area-inset-bottom))]">
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
            'Get Started'
          )}
        </button>
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
            <div className="w-12 h-1.5 bg-white/10 rounded-full mx-auto mb-8 overflow-hidden">
              <div 
                className={`h-full bg-[#0078FF] rounded-full ${modalAnimating ? 'animate-countdown' : ''}`}
                style={{ 
                  transformOrigin: 'left',
                  animation: modalAnimating ? 'countdown 2s linear forwards' : 'none',
                }}
              />
            </div>
            
            <div className="w-20 h-20 rounded-full bg-[#34C759] flex items-center justify-center mx-auto mb-6 shadow-[0_0_32px_rgba(52,199,89,0.4)]">
              <Check className="w-10 h-10 text-white" />
            </div>
            
            <h2 className="text-[24px] font-bold mb-2 tracking-tight">You're all set!</h2>
            <p className="text-[15px] text-[#8E8E93] mb-8 leading-relaxed">
              Your workout program is ready. Let's start building strength together.
            </p>
            
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
    </AnimateIn>
  );
}
