import { Skeleton } from "@/components/ui/skeleton";

export default function OnboardingLoading() {
  return (
    <main className="min-h-screen bg-black text-white flex flex-col">
      <div className="flex-1 px-6 pt-14">
        {/* Welcome Header */}
        <div className="text-center mb-8">
          <Skeleton className="w-16 h-16 rounded-full mx-auto mb-4" />
          <Skeleton className="h-9 w-40 mx-auto mb-2" />
          <Skeleton className="h-5 w-56 mx-auto" />
        </div>

        {/* Program List */}
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="bg-[#1C1C1E] rounded-2xl p-5 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Skeleton className="w-12 h-12 rounded-full" />
                <div>
                  <Skeleton className="h-5 w-32 mb-1.5" />
                  <Skeleton className="h-4 w-40" />
                </div>
              </div>
              <Skeleton className="w-5 h-5 rounded-full" />
            </div>
          ))}
        </div>
      </div>

      {/* Bottom CTA */}
      <div className="p-6 pb-[max(2.5rem,env(safe-area-inset-bottom))]">
        <Skeleton className="w-full h-14 rounded-2xl bg-[#0078FF]/30" />
      </div>
    </main>
  );
}
