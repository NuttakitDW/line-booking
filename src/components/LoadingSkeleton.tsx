"use client";

export function LoadingSkeleton() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-md space-y-6">
        {/* Logo area */}
        <div className="flex flex-col items-center space-y-3">
          <div className="skeleton h-16 w-16 rounded-full" />
          <div className="skeleton h-6 w-40" />
          <div className="skeleton h-4 w-56" />
        </div>

        {/* Service cards */}
        <div className="space-y-4 mt-8">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white rounded-2xl p-4 shadow-sm space-y-3">
              <div className="skeleton h-5 w-3/4" />
              <div className="skeleton h-4 w-1/2" />
              <div className="skeleton h-10 w-full rounded-xl" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
