import { Skeleton } from "@/components/ui/skeleton";

export default function HomeLoading() {
  return (
    <main className="min-h-screen bg-black text-white">
      {/* Hero Section */}
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
            <Skeleton className="w-10 h-10 rounded-full bg-white/15" />
            <div className="flex items-center gap-3">
              <Skeleton className="w-10 h-10 rounded-full bg-white/15" />
            </div>
          </div>
          
          {/* Program Name & Week */}
          <div className="text-center mb-8">
            <Skeleton className="h-[20px] w-48 bg-white/20 mx-auto mb-3" />
            <Skeleton className="h-[48px] w-40 bg-white/30 mx-auto mb-2" />
            <Skeleton className="h-[20px] w-32 bg-white/15 mx-auto" />
          </div>
          
          {/* Sessions Pill */}
          <div className="flex justify-center">
            <Skeleton className="h-[46px] w-[178px] rounded-full bg-black/30 border border-white/10" />
          </div>
        </div>
      </div>
      
      {/* Quick Actions */}
      <div className="px-6 py-8">
        <div className="flex justify-between items-start">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="flex flex-col items-center gap-2.5">
              <Skeleton className={`w-16 h-16 rounded-full ${i === 1 ? 'bg-[#0078FF]/30' : 'bg-[#1C1C1E]'}`} />
              <Skeleton className="h-[20px] w-14 bg-[#2C2C2E]" />
            </div>
          ))}
        </div>
      </div>
      
      {/* Week Tabs */}
      <div className="px-6 pb-6">
        <div className="flex flex-col gap-2 w-full">
          {/* TabsList */}
          <div className="w-full h-[36px] bg-[#1C1C1E] p-1.5 rounded-2xl mb-6 flex items-center justify-start gap-1">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className={`flex-1 h-full rounded-xl ${i === 1 ? 'bg-[#2C2C2E]' : ''}`}
              />
            ))}
          </div>

          {/* Week Header */}
          <div className="mb-4 flex items-center justify-between h-[28px]">
            <Skeleton className="h-[20px] w-36 bg-[#2C2C2E]" />
            <Skeleton className="h-[28px] w-12 rounded-full bg-[#1C1C1E]" />
          </div>
          
          {/* Workout Days List */}
          <div className="bg-[#1C1C1E] rounded-2xl overflow-hidden">
            {[1, 2, 3, 4, 5].map((i) => (
              <div 
                key={i}
                className={`flex items-center px-4 h-[76px] ${i > 1 ? 'border-t border-white/5' : ''}`}
              >
                {/* Status Icon */}
                <Skeleton className="w-11 h-11 rounded-full bg-[#0078FF]/30 mr-4 shrink-0" />
                
                {/* Content */}
                <div className="flex-1 min-w-0">
                  <Skeleton className="h-[18px] w-40 bg-[#2C2C2E] mb-1.5" />
                  <Skeleton className="h-[14px] w-28 bg-[#3A3A3C]" />
                </div>

                {/* Chevron */}
                <Skeleton className="w-5 h-5 rounded bg-[#48484A]/30 ml-2 shrink-0" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}
