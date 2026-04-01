import React from 'react';
import type { AuditLog, AuditStats } from '../../../api/audit';
import { 
  formatAuditDate, 
  getActionLabel, 
  getActionColor, 
  getActionIcon, 
  getStatusDetails 
} from '../audit.utils';

interface AuditStatCardsProps {
  stats: AuditStats;
}

export const AuditStatCards: React.FC<AuditStatCardsProps> = ({ stats }) => {
  const statItems = [
    { label: 'Total de registros', value: stats.totalLogs, bg: 'bg-blue-50/30', glow: 'group-hover:bg-blue-500/10' },
    { label: 'Acciones hoy', value: stats.todayLogs, bg: 'bg-green-50/30', glow: 'group-hover:bg-green-500/10' },
    { 
      label: 'Peticiones procesadas', 
      value: stats.byAction.filter(a => ['PETITION_APPROVED', 'PETITION_REJECTED'].includes(a.action)).reduce((sum: number, a: any) => sum + a.count, 0),
      bg: 'bg-amber-50/30',
      glow: 'group-hover:bg-amber-500/10'
    },
    { 
      label: 'Check-In/Out', 
      value: stats.byAction.filter(a => ['CHECKIN_CONFIRMED', 'CHECKOUT_CONFIRMED'].includes(a.action)).reduce((sum: number, a: any) => sum + a.count, 0),
      bg: 'bg-indigo-50/30',
      glow: 'group-hover:bg-indigo-500/10'
    }
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-5 mb-8">
      {statItems.map((stat, i) => (
        <div key={i} className={`bg-white rounded-xl border border-[var(--color-border)] p-5 shadow-[var(--shadow-surgical)] hover:shadow-xl hover:border-black/20 hover:-translate-y-1 transition-all duration-300 group overflow-hidden relative active:scale-95 cursor-default`}>
          <div className={`absolute top-0 right-0 w-20 h-20 ${stat.bg} -mr-10 -mt-10 rounded-full blur-3xl ${stat.glow} transition-colors duration-500`}></div>
          <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-gray-400 mb-1 relative z-10 select-none">{stat.label}</p>
          <div className="text-[24px] font-black text-gray-950 tracking-tighter leading-none relative z-10 group-hover:scale-105 transition-transform duration-300 origin-left">{stat.value}</div>
        </div>
      ))}
    </div>
  );
};

interface LogRowProps {
  log: AuditLog;
}

export const PetitionLogRow: React.FC<LogRowProps> = ({ log }) => {
  const details = log.details || {};
  const { status, statusLabel, statusColor } = getStatusDetails(log);
  
  const reviewerName = (log.action === 'PETITION_APPROVED' || log.action === 'PETITION_REJECTED') ? log.performedByName : '';
  const reviewDate = (log.action === 'PETITION_APPROVED' || log.action === 'PETITION_REJECTED') ? log.timestamp : '';

  const ownerName = details.ownerName;
  const ownerEmail = details.ownerEmail || 'No disponible';
  const creatorName = log.targetUserName || log.performedByName;

  const building = details.buildingName || 'N/A';
  const apartment = details.apartmentNumber || 'N/A';
  const parking = details.parkingNumber || 'N/A';

  const petitionTitle = log.description.split('"')[1] || log.description;
  const petitionDate = details.petitionCreatedAt ? formatAuditDate(details.petitionCreatedAt) : formatAuditDate(log.timestamp);

  return (
    <div className="p-6 bg-white hover:bg-gray-50/40 transition-all duration-300 border-b border-black/[0.08] group relative hover:z-10 hover:shadow-2xl hover:shadow-black/[0.01]">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Petition Data (7/12) */}
        <div className="lg:col-span-7 border border-[var(--color-border)] rounded-xl p-5 bg-gray-50/40 shadow-[var(--shadow-surgical)] group-hover:bg-white group-hover:border-black/[0.1] transition-all duration-500 relative overflow-hidden">
          <div className="absolute top-3 right-3 h-8 w-8 rounded-full border border-black/[0.03] flex items-center justify-center opacity-10 group-hover:opacity-20 group-hover:scale-110 transition-all duration-700">
            <span className="material-symbols-outlined text-base" aria-hidden="true">description</span>
          </div>
          <h3 className="text-[10px] font-bold uppercase tracking-[0.15em] text-gray-400 mb-5 border-b border-black/[0.05] pb-2.5 flex items-center gap-2 group-hover:text-gray-500 transition-colors">
            <span className="h-1.5 w-1.5 bg-blue-500 rounded-full animate-pulse"></span>
            Metadatos de Petición
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-y-3.5 gap-x-6">
            <div className="space-y-3.5">
              <div className="flex flex-col group/item">
                <span className="text-[9px] font-bold uppercase text-gray-400 tracking-[0.12em] mb-0.5 group-hover:text-blue-500 transition-colors">Solicita</span>
                <span className="text-[12px] font-bold text-gray-950 truncate group-hover/item:translate-x-0.5 transition-transform">{creatorName}</span>
              </div>
              <div className="flex flex-col group/item">
                <span className="text-[9px] font-bold uppercase text-gray-400 tracking-[0.12em] mb-0.5 group-hover:text-blue-500 transition-colors">Unidad</span>
                <span className="text-[12px] font-bold text-gray-950 group-hover/item:translate-x-0.5 transition-transform">{apartment} <span className="text-gray-300 mx-1">|</span> {building}</span>
              </div>
              <div className="flex flex-col group/item">
                <span className="text-[9px] font-bold uppercase text-gray-400 tracking-[0.12em] mb-0.5 group-hover:text-blue-500 transition-colors">Fecha</span>
                <span className="text-[12px] font-bold text-gray-950 uppercase tracking-tight group-hover/item:translate-x-0.5 transition-transform">{petitionDate}</span>
              </div>
            </div>
            <div className="space-y-3.5">
              <div className="flex flex-col group/item">
                <span className="text-[9px] font-bold uppercase text-gray-400 tracking-[0.12em] mb-0.5 group-hover:text-blue-500 transition-colors">Contacto</span>
                <span className="text-[12px] font-bold text-gray-950 truncate group-hover/item:translate-x-0.5 transition-transform">{ownerEmail}</span>
              </div>
              <div className="flex flex-col group/item">
                <span className="text-[9px] font-bold uppercase text-gray-400 tracking-[0.12em] mb-0.5 group-hover:text-blue-500 transition-colors">Concepto</span>
                <span className="text-[12px] font-bold text-blue-600 leading-tight group-hover/item:translate-x-0.5 transition-transform">"{petitionTitle}"</span>
              </div>
              {parking !== 'N/A' && (
                <div className="flex flex-col group/item">
                  <span className="text-[9px] font-bold uppercase text-gray-400 tracking-[0.12em] mb-0.5 group-hover:text-blue-500 transition-colors">Parking</span>
                  <span className="text-[12px] font-bold text-gray-950 group-hover/item:translate-x-0.5 transition-transform">{parking}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Status/Admin Data (5/12) */}
        <div className="lg:col-span-5 border border-[var(--color-border)] rounded-xl p-5 bg-white shadow-[var(--shadow-surgical)] flex flex-col justify-center items-center text-center hover:shadow-xl hover:border-black/20 transition-all duration-500 border-l-4 border-l-black relative overflow-hidden group-hover:border-l-[#001640]">
          <div className="absolute inset-0 bg-blue-50/10 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"></div>
          <h3 className="text-[10px] font-bold uppercase tracking-[0.15em] text-gray-400 mb-5 w-full border-b border-black/[0.05] pb-2.5 relative z-10">Estado Operativo</h3>

          <div className={`px-5 py-1.5 rounded-lg border mb-5 ${statusColor} text-[10px] font-bold uppercase tracking-[0.2em] shadow-md relative z-10 group-hover:scale-105 transition-transform duration-300`}>
            {statusLabel}
          </div>

          {status !== 'PENDING' ? (
            <div className="text-[11px] space-y-2 w-full relative z-10">
              <div className="bg-gray-50 p-4 rounded-xl border border-[var(--color-border)] relative overflow-hidden group-hover:bg-white group-hover:shadow-inner transition-all duration-500">
                <span className="absolute bottom-1 right-2 text-[32px] opacity-[0.02] font-black uppercase pointer-events-none group-hover:opacity-[0.04] transition-all">ADMIN</span>
                <p className="text-[8px] font-bold uppercase text-gray-400 tracking-[0.12em] mb-2.5">Resolución por</p>
                <p className="font-bold text-gray-950 uppercase tracking-tighter text-[16px] leading-none mb-2">{reviewerName}</p>
                <p className="text-[9px] font-bold text-white bg-gray-950 px-2.5 py-1 rounded-sm inline-block tracking-widest shadow-lg shadow-black/20">{formatAuditDate(reviewDate)}</p>
              </div>
              {details.adminNotes && (
                <div className="mt-3 text-[10px] font-medium text-gray-600 bg-blue-50/20 p-3.5 rounded-xl border border-blue-100/20 italic leading-relaxed text-left border-l-[3px] border-l-blue-500 group-hover:bg-blue-50/40 transition-colors">
                  "{details.adminNotes}"
                </div>
              )}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-5 px-4 bg-gray-50/50 border-2 border-dashed border-black/[0.06] rounded-sm w-full group-hover:bg-white group-hover:border-blue-200 transition-all duration-500 relative z-10">
              <span className="material-symbols-outlined text-gray-300 text-[28px] mb-2 animate-bounce" aria-hidden="true">hourglass_empty</span>
              <p className="text-[9px] font-bold text-gray-400 uppercase tracking-[0.25em] italic">
                Aguardando Revisión
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export const StandardLogRow: React.FC<LogRowProps> = ({ log }) => {
  return (
    <div className="p-6 bg-white hover:bg-gray-50/20 transition-all duration-300 border-b border-black/[0.08] group relative hover:z-10 hover:shadow-2xl hover:shadow-black/[0.01]">
      <div className="flex justify-between items-start gap-6">
        <div className="flex-1 min-w-0">
          {/* Tipo de acción y badge */}
          <div className="flex items-center gap-3.5 mb-3.5 flex-wrap">
            <span className={`px-2.5 py-1 text-[9px] font-bold rounded-lg border uppercase tracking-[0.15em] shadow-sm flex items-center gap-2 hover:scale-105 transition-transform duration-300 ${getActionColor(log.action)}`}>
              <span className="material-symbols-outlined text-[14px]" aria-hidden="true">{getActionIcon(log.action)}</span>
              {getActionLabel(log.action)}
            </span>
            <span className="text-[9px] font-bold text-gray-500 uppercase tracking-[0.12em] bg-white border border-[var(--color-border)] px-2.5 py-1 rounded-lg hover:border-black/10 transition-colors">
              {formatAuditDate(log.timestamp)}
            </span>
          </div>

          {/* Descripción principal */}
          <p className="text-gray-950 text-[16px] font-bold tracking-tight mb-5 group-hover:text-blue-600 transition-all duration-300 leading-tight group-hover:translate-x-0.5">
            {log.description}
          </p>

          {/* Detalles para carga masiva */}
          {log.action === 'APARTMENT_BULK_IMPORT' && log.details?.stats && (
            <div className="mb-5 bg-[#001640] p-5 rounded-xl border-l-[3px] border-l-blue-400 shadow-[var(--shadow-surgical)] overflow-hidden relative group-hover:shadow-md transition-all duration-500">
              <div className="absolute top-0 right-0 w-28 h-28 bg-blue-500/5 -mr-14 -mt-14 rounded-full blur-2xl group-hover:scale-125 transition-transform duration-1000"></div>
              <ul className="grid grid-cols-2 md:grid-cols-4 gap-5 relative z-10">
                {[
                  { label: 'Creados', value: log.details.stats.ownersCreated, color: 'text-blue-400' },
                  { label: 'Actualizados', value: log.details.stats.ownersUpdated, color: 'text-green-400' },
                  { label: 'Deptos', value: log.details.stats.apartmentsCreated, color: 'text-amber-400' },
                  { label: 'Deptos Act', value: log.details.stats.apartmentsUpdated, color: 'text-purple-400' },
                ].map((item, i) => (
                  <li key={i} className="flex flex-col gap-0.5 hover:translate-x-0.5 transition-transform duration-300">
                    <span className="font-bold uppercase text-[8px] tracking-[0.15em] text-gray-500">{item.label}</span> 
                    <span className={`font-black text-[18px] tracking-tighter ${item.color}`}>{item.value}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Quién realizó la acción */}
          <div className="flex items-center gap-3 text-[11px] bg-gray-50/50 p-2.5 rounded-xl border border-[var(--color-border)] inline-flex pr-5 hover:bg-white hover:border-black/10 transition-all duration-300">
            <div className="h-9 w-9 rounded-full bg-[#001640] flex items-center justify-center text-white text-[11px] font-bold uppercase shadow-sm group-hover:scale-105 transition-transform duration-300">
              {log.performedByName.split(' ').map((n: string) => n[0]).join('').slice(0, 2)}
            </div>
            <div className="flex flex-col">
              <span className="text-[8px] font-bold text-gray-400 uppercase tracking-[0.15em] mb-0.5">Operador</span>
              <span className="font-bold text-gray-950 uppercase tracking-normal leading-none text-[12px]">{log.performedByName}</span>
              <span className="text-[9px] font-semibold text-blue-600 uppercase tracking-widest mt-0.5 opacity-80">{log.performedByRole}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
