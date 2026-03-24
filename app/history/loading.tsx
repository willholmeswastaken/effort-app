export default function HistoryLoading() {
  return (
    <div className="min-h-screen bg-black text-white pb-20">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-black/80 backdrop-blur-lg border-b border-white/5">
        <div className="flex items-center h-14 px-4">
          <h1 className="flex-1 text-center text-[17px] font-semibold">History</h1>
        </div>
      </header>

      <div className="px-4 py-6 space-y-4">
        {/* Summary card placeholder */}
        <div className="bg-[#1C1C1E] rounded-2xl px-4 py-3 flex items-center gap-4">
          <div className="flex-1">
            <div className="h-3 w-20 bg-[#3A3A3C] rounded animate-pulse mb-2" />
            <div className="h-5 w-24 bg-[#3A3A3C] rounded animate-pulse" />
          </div>
          <div className="w-px h-8 bg-white/8" />
          <div className="text-right">
            <div className="h-3 w-16 bg-[#3A3A3C] rounded animate-pulse mb-2 ml-auto" />
            <div className="h-5 w-20 bg-[#3A3A3C] rounded animate-pulse ml-auto" />
          </div>
        </div>

        {/* List items */}
        <div className="bg-[#1C1C1E] rounded-2xl overflow-hidden">
          {Array.from({ length: 8 }).map((_, i) => (
            <div
              key={i}
              className={`flex items-center px-4 py-3.5 ${
                i > 0 ? "border-t border-white/5" : ""
              }`}
            >
              <div className="w-2.5 h-2.5 rounded-full bg-[#3A3A3C] animate-pulse mr-4 shrink-0" />
              <div className="flex-1">
                <div className="h-4 w-32 bg-[#3A3A3C] rounded animate-pulse mb-2" />
                <div className="h-3 w-20 bg-[#3A3A3C] rounded animate-pulse" />
              </div>
              <div className="h-4 w-12 bg-[#3A3A3C] rounded animate-pulse mr-2" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
