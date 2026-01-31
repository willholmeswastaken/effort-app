"use client";

import Link from "next/link";
import { programs } from "@/lib/data";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Play } from "lucide-react";
import { getDayVolume } from "@/lib/utils/program";

export default function ProgramDetailClient({ id }: { id: string }) {
  const program = programs.find((p) => p.id === id);

  if (!program) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center text-white">
        <p>Program not found</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white pb-20">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-black/80 backdrop-blur-lg border-b border-white/5">
        <div className="flex items-center h-14 px-4">
          <Link href="/" className="p-2 -ml-2">
            <ChevronLeft className="w-6 h-6" />
          </Link>
          <h1 className="flex-1 text-center text-[17px] font-semibold">{program.name}</h1>
          <div className="w-10" />
        </div>
      </header>

      {/* Description */}
      <div className="px-6 py-6 border-b border-white/5">
        <p className="text-[15px] text-[#8E8E93] leading-relaxed">{program.description}</p>
      </div>

      {/* Weeks */}
      <div className="px-6 py-6">
        {program.weeks.map((week) => (
          <div key={week.weekNumber} className="mb-8">
            <h2 className="text-[13px] font-medium text-[#8E8E93] uppercase tracking-wide mb-3">
              Week {week.weekNumber}
            </h2>
            
            <div className="bg-[#1C1C1E] rounded-2xl overflow-hidden">
              {week.days.map((day, index) => (
                <Link key={day.id} href={`/workout/${program.id}/${day.id}`}>
                  <div className={`flex items-center px-4 py-3.5 active:bg-white/5 ${index > 0 ? 'border-t border-white/5' : ''}`}>
                    {/* Play Icon */}
                    <div className="w-10 h-10 rounded-full bg-[#0078FF] flex items-center justify-center mr-4">
                      <Play className="w-4 h-4 fill-current ml-0.5" />
                    </div>
                    
                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <p className="text-[15px] font-medium truncate">{day.title}</p>
                      <p className="text-[13px] text-[#8E8E93]">{day.exercises.length} exercises</p>
                    </div>
                    
                    {/* Chevron */}
                    <ChevronRight className="w-5 h-5 text-[#8E8E93]" />
                  </div>
                </Link>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
