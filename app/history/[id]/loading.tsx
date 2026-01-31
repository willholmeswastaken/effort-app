import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export default function HistoryDetailLoading() {
  return (
    <div className="min-h-screen bg-black text-white pb-20">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-black/80 backdrop-blur-lg border-b border-white/5">
        <div className="flex items-center h-14 px-4">
          <Link href="/history" className="p-2 -ml-2">
            <ChevronLeft className="w-6 h-6" />
          </Link>
          <h1 className="flex-1 text-center text-[17px] font-semibold">Details</h1>
          <div className="w-10" />
        </div>
      </header>

      {/* Summary Skeleton */}
      <div className="px-4 py-6 border-b border-white/5">
        <Skeleton className="h-7 w-48 bg-[#2C2C2E] mb-2" />
        <Skeleton className="h-5 w-32 bg-[#2C2C2E]" />
        
        <div className="flex gap-6 mt-4">
          <div>
            <Skeleton className="h-4 w-16 bg-[#2C2C2E] mb-1" />
            <Skeleton className="h-5 w-12 bg-[#3A3A3C]" />
          </div>
          <div>
            <Skeleton className="h-4 w-16 bg-[#2C2C2E] mb-1" />
            <Skeleton className="h-5 w-8 bg-[#3A3A3C]" />
          </div>
          <div>
            <Skeleton className="h-4 w-12 bg-[#2C2C2E] mb-1" />
            <Skeleton className="h-5 w-10 bg-[#3A3A3C]" />
          </div>
        </div>
      </div>

      {/* Exercises Skeleton */}
      <div className="px-4 py-6">
        {[1, 2, 3].map((i) => (
          <div key={i} className="mb-6">
            <Skeleton className="h-5 w-40 bg-[#2C2C2E] mb-3" />
            
            <div className="bg-[#1C1C1E] rounded-2xl overflow-hidden">
              {/* Header */}
              <div className="grid grid-cols-3 px-4 py-2.5 border-b border-white/5">
                <Skeleton className="h-4 w-8 bg-[#2C2C2E]" />
                <Skeleton className="h-4 w-6 bg-[#2C2C2E] justify-self-center" />
                <Skeleton className="h-4 w-10 bg-[#2C2C2E] justify-self-center" />
              </div>
              
              {/* Rows */}
              {[1, 2, 3].map((si) => (
                <div 
                  key={si} 
                  className={`grid grid-cols-3 items-center px-4 py-2.5 ${si > 1 ? 'border-t border-white/5' : ''}`}
                >
                  <Skeleton className="h-4 w-4 bg-[#2C2C2E]" />
                  <Skeleton className="h-4 w-10 bg-[#3A3A3C] justify-self-center" />
                  <Skeleton className="h-4 w-8 bg-[#3A3A3C] justify-self-center" />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
