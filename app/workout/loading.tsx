"use client";

// Workout page loading state - Premium Revolut-style shimmer loading
// Uses wave shimmer animations with glassmorphism effects
export default function WorkoutLoading() {
  return (
    <div className="min-h-screen bg-black text-white overflow-x-hidden">
      {/* Header - Premium glass effect */}
      <header className="sticky top-0 z-50 bg-black/90 backdrop-blur-xl border-b border-white/[0.06]">
        <div className="flex items-center justify-between h-14 px-4">
          <div className="w-9 h-9 rounded-full bg-white/5 animate-pulse" />
          <div className="h-4 w-32 bg-white/10 rounded animate-pulse" style={{ animationDelay: '0.1s' }} />
          <div className="w-9 h-9 rounded-full bg-[#FF3B30]/10 animate-pulse" style={{ animationDelay: '0.2s' }} />
        </div>
      </header>

      {/* Timer Section with glassmorphism */}
      <div className="py-14 text-center border-b border-white/[0.06] relative overflow-hidden">
        <div className="h-4 w-24 bg-white/15 rounded mb-3 mx-auto animate-pulse" />
        <div className="h-20 w-56 bg-white/20 rounded-xl mx-auto animate-pulse" style={{ animationDelay: '0.15s' }} />
        <div className="absolute top-1/2 -translate-y-1/2 right-6 w-14 h-14 rounded-full bg-[#1C1C1E] border border-white/[0.06] animate-pulse" style={{ animationDelay: '0.3s' }} />
      </div>

      {/* Exercise Cards with glass effect and staggered shimmer */}
      <div className="px-4 py-6 space-y-4 pb-28">
        {[1, 2, 3, 4].map((i) => (
          <div 
            key={i}
            className="bg-[#0A0A0A]/80 backdrop-blur-sm rounded-2xl overflow-hidden border border-white/[0.04] shadow-[0_4px_20px_-4px_rgba(0,0,0,0.5)]"
            style={{ animationDelay: `${i * 120}ms` }}
          >
            {/* Card Header */}
            <div className="px-4 py-3 border-b border-white/[0.04] flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-[#0078FF]/10 flex items-center justify-center animate-pulse" style={{ animationDelay: `${i * 0.15}s` }}>
                  <div className="w-4 h-4 bg-white/20 rounded" />
                </div>
                <div className="h-5 w-36 bg-white/15 rounded animate-pulse" style={{ animationDelay: `${i * 0.15 + 0.1}s` }} />
              </div>
              <div className="w-5 h-5 rounded bg-white/10 animate-pulse" style={{ animationDelay: `${i * 0.15 + 0.2}s` }} />
            </div>
            
            {/* Set inputs with wave shimmer */}
            <div className="p-4">
              <div className="flex items-center gap-3">
                {[1, 2, 3].map((setNum) => (
                  <div key={setNum} className="flex-1">
                    <div className="h-3 w-6 bg-white/10 rounded mb-2 mx-auto animate-pulse" style={{ animationDelay: `${i * 0.15 + setNum * 0.05}s` }} />
                    <div className="h-12 bg-white/[0.03] rounded-xl border border-white/[0.06] animate-pulse" style={{ animationDelay: `${i * 0.15 + setNum * 0.05 + 0.03}s` }} />
                  </div>
                ))}
              </div>
              <div className="mt-3 flex items-center justify-center gap-2">
                <div className="h-3 w-16 bg-white/10 rounded animate-pulse" style={{ animationDelay: `${i * 0.15 + 0.4}s` }} />
                <div className="h-3 w-1 bg-white/10 rounded" />
                <div className="h-3 w-12 bg-white/10 rounded animate-pulse" style={{ animationDelay: `${i * 0.15 + 0.45}s` }} />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Finish Button with shimmer */}
      <div className="fixed bottom-0 left-0 right-0 p-4 pb-[max(1rem,env(safe-area-inset-bottom))] bg-gradient-to-t from-black via-black/95 to-transparent pt-10">
        <div className="w-full h-14 bg-gradient-to-r from-[#0078FF]/30 via-[#0078FF]/50 to-[#0078FF]/30 rounded-2xl animate-pulse shadow-[0_0_32px_rgba(0,120,255,0.2)]" />
      </div>
    </div>
  );
}
