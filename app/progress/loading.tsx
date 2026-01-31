import Link from "next/link";
import { ChevronLeft } from "lucide-react";

export default function ProgressLoading() {
  return (
    <div className="min-h-screen bg-black text-white">
      <header className="sticky top-0 z-50 bg-black/80 backdrop-blur-lg border-b border-white/5">
        <div className="flex items-center h-14 px-4">
          <Link href="/" className="p-2 -ml-2">
            <ChevronLeft className="w-6 h-6" />
          </Link>
          <h1 className="flex-1 text-center text-[17px] font-semibold">
            Progress
          </h1>
          <div className="w-10" />
        </div>
      </header>

      <div className="p-4">
        <div className="h-4 w-16 bg-[#3A3A3C] rounded animate-pulse mb-3" />
        <div className="grid grid-cols-3 gap-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="bg-[#1C1C1E] rounded-2xl p-3">
              <div className="w-8 h-8 rounded-full bg-[#3A3A3C] animate-pulse mb-2" />
              <div className="h-6 w-12 bg-[#3A3A3C] rounded animate-pulse mb-1" />
              <div className="h-3 w-16 bg-[#3A3A3C] rounded animate-pulse" />
            </div>
          ))}
        </div>
      </div>

      <div className="p-4 pt-2">
        <div className="h-4 w-24 bg-[#3A3A3C] rounded animate-pulse mb-3" />
        <div className="bg-[#1C1C1E] rounded-2xl p-4">
          <div className="flex gap-2 mb-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div
                key={i}
                className="h-8 w-24 bg-[#3A3A3C] rounded-full animate-pulse"
              />
            ))}
          </div>
          <div className="h-8 w-20 bg-[#3A3A3C] rounded animate-pulse mb-2" />
          <div className="h-4 w-32 bg-[#3A3A3C] rounded animate-pulse mb-4" />
          <div className="h-48 bg-[#3A3A3C] rounded animate-pulse" />
          <div className="flex justify-center mt-4">
            <div className="h-8 w-64 bg-[#3A3A3C] rounded-full animate-pulse" />
          </div>
        </div>
      </div>
    </div>
  );
}
