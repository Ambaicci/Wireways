export default function DashboardLoading() {
  return (
    <div className="max-w-[1000px] mx-auto space-y-8 pb-20" aria-busy="true" aria-label="Loading">
      {/* Page header */}
      <div className="space-y-2.5">
        <div className="h-7 w-48 rounded-lg bg-[#EAE6DF] animate-pulse" />
        <div className="h-4 w-72 rounded-lg bg-[#F1EEE8] animate-pulse" />
      </div>

      {/* Stat chips */}
      <div className="grid grid-cols-3 gap-3">
        {[0, 1, 2].map((i) => (
          <div key={i} className="h-[86px] rounded-[14px] bg-white border border-[#EAE6DF] p-4">
            <div className="h-3 w-20 rounded bg-[#F1EEE8] animate-pulse" />
            <div className="h-6 w-16 rounded bg-[#EAE6DF] animate-pulse mt-3" />
          </div>
        ))}
      </div>

      {/* Intelligence panel */}
      <div className="h-[180px] rounded-[20px] bg-[#0E1116] relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/[0.04] to-transparent animate-pulse" />
      </div>

      {/* Content rows */}
      <div className="space-y-3">
        {[0, 1, 2].map((i) => (
          <div key={i} className="h-[76px] rounded-[16px] bg-white border border-[#EAE6DF] animate-pulse" />
        ))}
      </div>

      <p className="text-center text-[11px] text-[#B3AC9F] font-mono tracking-widest uppercase">
        Loading your money…
      </p>
    </div>
  );
}