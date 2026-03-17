"use client";

export function LoadingSkeleton() {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Header skeleton */}
      <div
        className="px-6 pt-12 pb-8"
        style={{
          background: "radial-gradient(ellipse at center top, #E62020 0%, #CC0000 40%, #8B0000 100%)",
        }}
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-white/20" />
          <div className="space-y-2">
            <div className="h-3 w-16 rounded bg-white/20" />
            <div className="h-4 w-24 rounded bg-white/20" />
          </div>
        </div>
        <div className="mt-5 space-y-2">
          <div className="h-7 w-40 rounded bg-white/20" />
          <div className="h-4 w-56 rounded bg-white/20" />
        </div>
      </div>

      {/* Content skeleton */}
      <div className="flex-1 p-4 space-y-4 mt-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-white rounded-2xl p-5 shadow-sm space-y-3">
            <div className="skeleton h-5 w-3/4" />
            <div className="skeleton h-4 w-1/3" />
          </div>
        ))}
      </div>
    </div>
  );
}
