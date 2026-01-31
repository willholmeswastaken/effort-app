// Revolut-style minimal loading state - subtle, premium, intentional
// Shows just enough structure to maintain visual continuity without jarring flash
export default function WorkoutLoading() {
  return (
    <div className="min-h-screen bg-black">
      {/* Header placeholder - consistent with workout page layout */}
      <div className="px-4 pt-12 pb-4">
        <div className="animate-pulse">
          <div className="h-4 w-24 bg-white/10 rounded mb-2" />
          <div className="h-8 w-32 bg-white/20 rounded" />
        </div>
      </div>
      
      {/* Exercise list placeholders - very subtle shimmer */}
      <div className="px-4 space-y-3">
        {[1, 2, 3].map((i) => (
          <div 
            key={i} 
            className="h-20 bg-white/5 rounded-xl animate-pulse"
            style={{ animationDelay: `${i * 100}ms` }}
          />
        ))}
      </div>
    </div>
  );
}
