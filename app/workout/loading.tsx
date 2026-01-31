// Workout page loading state - matches the actual page layout
// Structure: Header (X | Title | Reset), Timer, Exercise Cards, Finish Button
export default function WorkoutLoading() {
  return (
    <div className="min-h-screen bg-black text-white overflow-x-hidden">
      {/* Header - matches client.tsx exactly */}
      <header className="sticky top-0 z-50 bg-black border-b border-white/5">
        <div className="flex items-center justify-between h-14 px-4">
          {/* Close button placeholder */}
          <div className="w-9 h-9 rounded-full bg-white/10 animate-pulse" />
          
          {/* Day title placeholder */}
          <div className="h-4 w-32 bg-white/20 rounded animate-pulse" />
          
          {/* Reset button placeholder */}
          <div className="w-9 h-9 rounded-full bg-[#FF3B30]/20 animate-pulse" />
        </div>
      </header>

      {/* Timer Section - matches client.tsx exactly */}
      <div className="py-14 text-center border-b border-white/5 relative">
        {/* "Duration" label */}
        <div className="h-4 w-24 bg-white/20 rounded mb-3 mx-auto animate-pulse" />
        
        {/* Time display placeholder */}
        <div className="h-16 w-48 bg-white/30 rounded mx-auto animate-pulse" />
        
        {/* Pause button placeholder */}
        <div className="absolute top-1/2 -translate-y-1/2 right-6 w-14 h-14 rounded-full bg-[#1C1C1E] border border-white/10 animate-pulse" />
      </div>

      {/* Exercise Cards - matches ExerciseCard component structure */}
      <div className="px-4 py-6 space-y-4 pb-28">
        {[1, 2, 3, 4].map((i) => (
          <div 
            key={i}
            className="bg-[#1C1C1E] rounded-2xl overflow-hidden animate-pulse"
            style={{ animationDelay: `${i * 100}ms` }}
          >
            {/* Card Header */}
            <div className="px-4 py-3 border-b border-white/5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                {/* Exercise number circle */}
                <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center">
                  <div className="w-4 h-4 bg-white/30 rounded" />
                </div>
                {/* Exercise name */}
                <div className="h-5 w-40 bg-white/20 rounded" />
              </div>
              {/* Swap icon */}
              <div className="w-5 h-5 bg-white/10 rounded" />
            </div>
            
            {/* Set inputs */}
            <div className="p-4">
              <div className="flex items-center gap-3">
                {[1, 2, 3].map((setNum) => (
                  <div key={setNum} className="flex-1">
                    <div className="h-4 w-8 bg-white/10 rounded mb-2 mx-auto" />
                    <div className="h-12 bg-white/5 rounded-lg border border-white/10" />
                  </div>
                ))}
              </div>
              {/* Target info */}
              <div className="mt-3 flex items-center justify-center gap-2">
                <div className="h-3 w-20 bg-white/10 rounded" />
                <div className="h-3 w-1 bg-white/10 rounded" />
                <div className="h-3 w-16 bg-white/10 rounded" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Finish Button - fixed at bottom */}
      <div className="fixed bottom-0 left-0 right-0 p-4 pb-[max(1rem,env(safe-area-inset-bottom))] bg-linear-to-t from-black via-black/95 to-transparent pt-10">
        <div className="w-full h-14 bg-[#0078FF]/50 rounded-2xl animate-pulse" />
      </div>
    </div>
  );
}
