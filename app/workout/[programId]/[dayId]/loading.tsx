import { Skeleton } from "@/components/ui/skeleton";

export default function WorkoutLoading() {
  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-black border-b border-white/5">
        <div className="flex items-center justify-between h-14 px-4">
          <Skeleton className="w-9 h-9 rounded-full bg-[#2C2C2E]" />
          <Skeleton className="h-5 w-32 bg-[#2C2C2E]" />
          <Skeleton className="w-9 h-9 rounded-full bg-[#2C2C2E]" />
        </div>
      </header>

      {/* Timer Section */}
      <div className="py-14 text-center border-b border-white/5 relative">
        <Skeleton className="h-4 w-20 bg-[#2C2C2E] mx-auto mb-3" />
        <Skeleton className="h-20 w-48 bg-[#3A3A3C] mx-auto" />
        
        <Skeleton className="absolute top-1/2 -translate-y-1/2 right-6 w-14 h-14 rounded-full bg-[#1C1C1E] border border-white/10" />
      </div>

      {/* Exercise Cards */}
      <div className="px-4 py-6 pb-28 space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-[#1C1C1E] rounded-2xl overflow-hidden">
            {/* Exercise Header */}
            <div className="px-4 py-4 border-b border-white/5">
              <div className="flex items-start gap-3 mb-3">
                {/* Position Badge */}
                <Skeleton className="w-8 h-8 rounded-full bg-[#0078FF]/15 shrink-0" />
                <div className="flex-1 min-w-0">
                  <Skeleton className="h-5 w-40 bg-[#2C2C2E] mb-2" />
                  <Skeleton className="h-4 w-28 bg-[#3A3A3C]" />
                </div>
              </div>
            </div>

            {/* Sets Table */}
            <div>
              <div className="grid grid-cols-3 px-4 py-2 bg-black/20">
                <Skeleton className="h-3 w-8 bg-[#3A3A3C] justify-self-center" />
                <Skeleton className="h-3 w-10 bg-[#3A3A3C] justify-self-center" />
                <Skeleton className="h-3 w-6 bg-[#3A3A3C] justify-self-center" />
              </div>

              {[1, 2, 3].map((si) => (
                <div 
                  key={si}
                  className="grid grid-cols-3 items-center px-4 py-2 border-t border-white/5 gap-2"
                >
                  <div className="h-10 flex items-center justify-center">
                    <Skeleton className="h-4 w-4 bg-[#3A3A3C]" />
                  </div>
                  <Skeleton className="h-10 w-full bg-[#2C2C2E] rounded-lg" />
                  <Skeleton className="h-10 w-full bg-[#2C2C2E] rounded-lg" />
                </div>
              ))}

              <div className="py-3 border-t border-white/5">
                <Skeleton className="h-5 w-24 bg-[#2C2C2E] mx-auto" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Floating Finish Button */}
      <div className="fixed bottom-0 left-0 right-0 p-4 pb-[max(1rem,env(safe-area-inset-bottom))] bg-linear-to-t from-black via-black/95 to-transparent pt-10">
        <Skeleton className="w-full h-14 rounded-2xl bg-[#0078FF]/30" />
      </div>
    </div>
  );
}
