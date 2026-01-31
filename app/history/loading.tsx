import Link from "next/link";
import { ChevronLeft } from "lucide-react";

export default function HistoryLoading() {
  return (
    <div className="min-h-screen bg-black text-white pb-20">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-black/80 backdrop-blur-lg border-b border-white/5">
        <div className="flex items-center h-14 px-4">
          <Link href="/" className="p-2 -ml-2">
            <ChevronLeft className="w-6 h-6" />
          </Link>
          <h1 className="flex-1 text-center text-[17px] font-semibold">History</h1>
          <div className="w-10" />
        </div>
      </header>

      <div className="px-4 py-6">
        <div className="bg-[#1C1C1E] rounded-2xl overflow-hidden">
          {Array.from({ length: 8 }).map((_, i) => (
            <div
              key={i}
              className={`flex items-center px-4 py-3.5 ${
                i > 0 ? "border-t border-white/5" : ""
              }`}
            >
              <div className="w-10 h-10 rounded-full bg-[#3A3A3C] animate-pulse mr-4" />
              <div className="flex-1">
                <div className="h-4 w-32 bg-[#3A3A3C] rounded animate-pulse mb-2" />
                <div className="h-3 w-20 bg-[#3A3A3C] rounded animate-pulse" />
              </div>
              <div className="h-4 w-8 bg-[#3A3A3C] rounded animate-pulse mr-2" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
