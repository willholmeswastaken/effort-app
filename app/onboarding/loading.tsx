import { Skeleton } from "@/components/ui/skeleton";

export default function OnboardingLoading() {
  return (
    <main className="min-h-screen bg-black text-white flex flex-col">
      {/* Progress Bar - matches client exactly */}
      <div className="px-6 pt-14 pb-8">
        <div className="flex gap-2">
          {[0, 1].map((i) => (
            <div 
              key={i} 
              className="flex-1 h-1 rounded-full bg-white/10 overflow-hidden"
            >
              <div 
                className={`h-full rounded-full ${
                  i === 0 ? 'w-full bg-[#0078FF]' : 'w-0'
                }`}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Content - matches step 0 layout exactly */}
      <div className="flex-1 px-6">
        <div className="flex flex-col items-center justify-center h-full text-center">
          {/* Animated Gradient Icon placeholder */}
          <div className="relative mb-10">
            <Skeleton 
              className="w-28 h-28 rounded-full"
              style={{
                background: 'linear-gradient(135deg, rgba(139,92,246,0.3) 0%, rgba(99,102,241,0.3) 50%, rgba(79,70,229,0.3) 100%)',
              }}
            />
          </div>
          
          {/* Welcome Text - text-4xl is ~36px/2.25rem height */}
          <Skeleton className="h-10 w-72 bg-[#2C2C2E] rounded-lg mb-4" />
          {/* Subtitle - text-lg is ~28px, two lines */}
          <Skeleton className="h-5 w-64 bg-[#2C2C2E] rounded mb-2" />
          <Skeleton className="h-5 w-56 bg-[#2C2C2E] rounded" />
        </div>
      </div>

      {/* Bottom Action - matches p-6 pb-[max(2.5rem,env(safe-area-inset-bottom))] */}
      <div className="p-6 pb-[max(2.5rem,env(safe-area-inset-bottom))]">
        <Skeleton className="w-full h-14 rounded-2xl bg-[#0078FF]/30" />
      </div>
    </main>
  );
}
