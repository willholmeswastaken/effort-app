// Homepage loading state - matches the new home page layout
export default function HomeLoading() {
  return (
    <main className="min-h-screen bg-black text-white">
      {/* Header Section */}
      <div className="px-6 pt-14 pb-8">
        {/* Top Bar - Profile | Program Name | History Button */}
        <div className="flex items-center justify-between mb-10">
          <div className="w-9 h-9 rounded-full bg-[#1C1C1E] animate-pulse" />
          <div className="w-32 h-4 bg-[#1C1C1E] rounded animate-pulse" />
          <div className="w-10 h-10 rounded-full bg-[#1C1C1E] animate-pulse" />
        </div>
        
        {/* Big Week Number */}
        <div className="text-center mb-2">
          <div className="w-40 h-12 bg-[#1C1C1E] rounded mx-auto animate-pulse" />
        </div>
        
        {/* Session Count */}
        <div className="text-center mb-4">
          <div className="w-28 h-5 bg-[#1C1C1E] rounded mx-auto animate-pulse" />
        </div>
        
        {/* Program Progress Link */}
        <div className="flex justify-center mb-8">
          <div className="w-40 h-4 bg-[#1C1C1E] rounded animate-pulse" />
        </div>
        
        {/* CTA Button */}
        <div className="flex justify-center mb-8">
          <div className="w-full max-w-xs h-14 bg-[#0078FF]/50 rounded-2xl animate-pulse" />
        </div>
      </div>
      
      {/* Week Tabs - Pill Style */}
      <div className="px-6 pb-6">
        {/* Pill Tabs */}
        <div className="flex gap-2 overflow-x-auto scrollbar-hide mb-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div
              key={i}
              className={`shrink-0 px-4 py-2 rounded-full h-9 ${
                i === 1 ? 'bg-[#0078FF]/50 w-24' : 'bg-[#1C1C1E] w-20'
              } animate-pulse`}
            />
          ))}
        </div>
        
        {/* Page Indicator Dots */}
        <div className="flex justify-center items-center gap-2 mb-6">
          {[1, 2, 3, 4, 5].map((i) => (
            <div
              key={i}
              className={`rounded-full animate-pulse ${
                i === 1 ? 'w-2 h-2 bg-white/50' : 'w-1.5 h-1.5 bg-[#48484A]'
              }`}
            />
          ))}
        </div>
        
        {/* Workout List Card */}
        <div className="bg-[#1C1C1E] rounded-2xl overflow-hidden shadow-[0_2px_8px_rgba(0,0,0,0.4)]">
          {[1, 2, 3, 4, 5].map((i) => (
            <div 
              key={i}
              className={`flex items-center px-4 py-4 ${i > 1 ? 'border-t border-white/6' : ''}`}
            >
              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="h-4 w-32 bg-[#2C2C2E] mb-2 rounded animate-pulse" />
                <div className="h-3 w-24 bg-[#3A3A3C] rounded animate-pulse" />
              </div>

              {/* Chevron */}
              <div className="w-5 h-5 bg-[#48484A]/30 rounded ml-4 shrink-0 animate-pulse" />
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
