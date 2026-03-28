import { statusConfig, categoryConfig } from '../../api/stays';

interface ReservationStatusBadgeProps {
  type: 'status' | 'category';
  value: string;
  className?: string;
}

export const ReservationStatusBadge = ({ type, value, className = '' }: ReservationStatusBadgeProps) => {
  const config = type === 'status' ? statusConfig[value] : categoryConfig[value];
  
  if (!config) return <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${className}`}>{value}</span>;

  return (
    <span className={`px-2 py-0.5 rounded-[var(--radius-sm)] text-[10px] font-bold uppercase tracking-widest border border-black/5 inline-flex items-center gap-1.5 ${config.bg} ${config.text} ${className}`}>
      {type === 'category' && (
        <span className={`h-1.5 w-1.5 rounded-full ${(config as any).dot}`}></span>
      )}
      {config.label}
    </span>
  );
};
