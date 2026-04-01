import React from 'react';

interface CardProps {
  title: string;
  icon: string;
  children: React.ReactNode;
  className?: string;
}

export const Card = ({ title, icon, children, className }: CardProps) => (
  <div className={`bg-white rounded-xl p-4 border border-black/[0.05] shadow-[var(--shadow-surgical)] hover:shadow-lg hover:border-black/[0.1] transition-all duration-300 ${className}`}>
    <div className="flex items-center gap-2 mb-3 border-b border-black/[0.03] pb-2">
      <span className="material-symbols-outlined text-primary text-base font-bold">{icon}</span>
      <h3 className="text-[10px] font-bold uppercase tracking-widest text-gray-400">{title}</h3>
    </div>
    {children}
  </div>
);

export const Field = ({ label, value }: { label: string; value: any }) => (
  <div className="bg-gray-50/50 p-2 rounded-lg border border-black/[0.03] text-center hover:bg-gray-100/50 hover:border-black/[0.06] transition-all duration-200 group">
    <p className="text-[9px] uppercase font-bold text-gray-400 tracking-widest mb-0.5">{label}</p>
    <p className="text-[12px] font-bold text-gray-950 tracking-tight truncate">{value || 'N/A'}</p>
  </div>
);

export const DiffField = ({ label, current, requested, isDate = false, formatDate }: any) => {
  const currentVal = isDate ? current?.split('T')[0] : current;
  const requestedVal = isDate ? requested?.split('T')[0] : requested;
  const isChanged = requestedVal !== undefined && requestedVal !== currentVal && requestedVal !== '';
  
  return (
    <div className={`p-2 rounded-lg border transition-all duration-200 hover:shadow-sm ${isChanged ? 'bg-amber-50/50 border-amber-200 hover:bg-amber-100/50 hover:border-amber-300' : 'bg-gray-50/30 border-black/[0.03] hover:bg-gray-100/30 hover:border-black/[0.06]'}`}>
      <p className="text-[9px] uppercase font-bold text-gray-400 tracking-widest mb-1">{label}</p>
      <div className="flex items-center justify-between gap-2">
        <span className={`text-[12px] ${isChanged ? 'text-gray-400 line-through' : 'font-bold text-gray-950'}`}>
          {isDate ? formatDate(current) : (current || 'N/A')}
        </span>
        {isChanged && (
          <>
            <span className="material-symbols-outlined text-sm text-amber-500 font-bold">arrow_forward</span>
            <span className="text-[12px] font-bold text-amber-800">{isDate ? formatDate(requested) : requested}</span>
          </>
        )}
      </div>
    </div>
  );
};
