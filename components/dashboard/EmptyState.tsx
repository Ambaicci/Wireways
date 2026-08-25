import { ReactNode } from "react";

export default function EmptyState({
  icon,
  title,
  hint,
  action,
}: {
  icon: ReactNode;
  title: string;
  hint: string;
  action?: ReactNode;
}) {
  return (
    <div className="relative bg-white border border-[#EAE6DF] rounded-[20px] py-14 px-6 text-center overflow-hidden">
      <div className="absolute -top-16 left-1/2 -translate-x-1/2 w-64 h-64 bg-[#F1622C]/10 rounded-full blur-[80px] pointer-events-none" />
      <div className="relative w-14 h-14 mx-auto rounded-[14px] bg-[#FDEBE0] flex items-center justify-center mb-4">
        {icon}
      </div>
      <h2 className="text-[17px] font-semibold text-[#18140F] tracking-tight">{title}</h2>
      <p className="text-[13.5px] text-[#8C8579] mt-1.5 max-w-[380px] mx-auto leading-relaxed">{hint}</p>
      {action && <div className="mt-5 flex justify-center">{action}</div>}
    </div>
  );
}