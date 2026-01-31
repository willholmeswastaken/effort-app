"use client";

import Link from "next/link";
import { programs } from "@/lib/data";
import { ChevronRight } from "lucide-react";

export function ProgramSelector() {
  return (
    <div className="bg-[#1C1C1E] rounded-2xl overflow-hidden">
      {programs.map((program, index) => (
        <Link key={program.id} href={`/program/${program.id}`}>
          <div className={`flex items-center px-4 py-3.5 active:bg-white/5 ${index > 0 ? 'border-t border-white/5' : ''}`}>
            {/* Icon */}
            <div className="w-10 h-10 rounded-full bg-[#3A3A3C] flex items-center justify-center mr-4 text-xl">
              🏋️
            </div>
            
            {/* Content */}
            <div className="flex-1 min-w-0">
              <p className="text-[15px] font-medium truncate">{program.name}</p>
              <p className="text-[13px] text-[#8E8E93]">{program.daysPerWeek} days/week</p>
            </div>
            
            {/* Meta */}
            <div className="text-right">
              <p className="text-[15px] font-medium">{program.weeks.length}w</p>
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
}
