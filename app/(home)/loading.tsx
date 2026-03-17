function PulseBlock({ className }: { className: string }) {
  return <div className={`animate-pulse rounded bg-[#1C1C1E] ${className}`} />;
}

export default function HomeLoading() {
  return (
    <main className="min-h-screen bg-black text-white">
      <div>
        <div className="relative z-10 px-6 pt-14 pb-4">
          <div className="flex items-center justify-between mb-10">
            <PulseBlock className="h-9 w-9 rounded-full" />

            <div className="flex items-center gap-1">
              <PulseBlock className="h-4 w-28" />
              <PulseBlock className="h-4 w-4 rounded-full" />
            </div>

            <PulseBlock className="h-10 w-10 rounded-full" />
          </div>

          <div className="text-center mb-2">
            <PulseBlock className="mx-auto h-12 w-40 rounded-xl" />
          </div>

          <div className="text-center mb-4">
            <PulseBlock className="mx-auto h-5 w-32" />
          </div>

          <div className="flex justify-center mb-8">
            <div className="flex items-center gap-1.5">
              <PulseBlock className="h-4 w-28" />
              <PulseBlock className="h-3.5 w-3.5 rounded-full" />
            </div>
          </div>

          <div className="flex justify-center">
            <div className="flex h-14 w-full max-w-xs items-center justify-center gap-2 rounded-2xl bg-[#0078FF]/70 px-6 animate-pulse">
              <div className="flex items-center justify-center gap-2">
                <PulseBlock className="h-5 w-5 rounded-full bg-white/25" />
                <PulseBlock className="h-5 w-32 bg-white/25" />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="px-6 pb-20">
        <div className="sticky top-0 z-20 -mx-6 bg-black px-6 pt-3 pb-4">
          <div className="flex gap-2 overflow-hidden">
            <div className="shrink-0 rounded-full bg-[#0078FF]/70 px-4 py-2 animate-pulse">
              <PulseBlock className="h-5 w-16 bg-white/25" />
            </div>
            {[1, 2, 3].map((item) => (
              <div
                key={item}
                className="shrink-0 rounded-full bg-[#1C1C1E] px-4 py-2 animate-pulse"
              >
                <PulseBlock className="h-5 w-14 bg-[#2C2C2E]" />
              </div>
            ))}
          </div>

          <div className="mt-3 flex items-center justify-center gap-2">
            <div className="h-2 w-2 rounded-full bg-white/70 animate-pulse" />
            {[1, 2, 3].map((item) => (
              <div
                key={item}
                className="h-1.5 w-1.5 rounded-full bg-[#48484A] animate-pulse"
              />
            ))}
          </div>
        </div>

        <div className="overflow-hidden rounded-2xl bg-[#1C1C1E] shadow-[0_2px_8px_rgba(0,0,0,0.4)]">
          {[
            { status: "chevron" },
            { status: "progress" },
            { status: "done" },
            { status: "chevron" },
            { status: "chevron" },
          ].map((item, index) => (
            <div
              key={index}
              className={`flex min-h-[74px] items-center px-4 py-4 ${index > 0 ? "border-t border-white/6" : ""}`}
            >
              <div className="min-w-0 flex-1">
                <PulseBlock className="mb-2 h-5 w-40 bg-[#2C2C2E]" />
                <PulseBlock className="h-4 w-28 bg-[#3A3A3C]" />
              </div>

              {item.status === "done" ? (
                <div className="ml-4 h-5 w-5 shrink-0 rounded-full bg-[#34C759]/70 animate-pulse" />
              ) : item.status === "progress" ? (
                <div className="ml-4 h-2 w-2 shrink-0 rounded-full bg-[#FF9F0A] animate-pulse" />
              ) : (
                <PulseBlock className="ml-4 h-5 w-5 shrink-0 rounded-full bg-[#48484A]/40" />
              )}
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
