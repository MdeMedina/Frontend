import { format, isSameDay } from 'date-fns';
import { es } from 'date-fns/locale';
import type { Petition, PetitionStatus } from './usePetitions';

interface PetitionSidebarProps {
  petitions: Petition[];
  selectedPetitionId?: string;
  onSelect: (petition: Petition) => void;
  activeTab: 'sent' | 'received';
  loading: boolean;
}

const statusLabels: Record<PetitionStatus, string> = {
  PENDING: 'Pendiente',
  APPROVED: 'Aprobada',
  REJECTED: 'Rechazada',
};

const statusClasses: Record<PetitionStatus, string> = {
  PENDING: 'bg-slate-100 text-slate-700 border-slate-200',
  APPROVED: 'bg-blue-50 text-blue-700 border-blue-100',
  REJECTED: 'bg-red-50 text-red-700 border-red-100',
};

export const PetitionSidebar = ({
  petitions,
  selectedPetitionId,
  onSelect,
  activeTab,
  loading,
}: PetitionSidebarProps) => {
  const formatRelativeTime = (dateString: string) => {
    try {
      const date = new Date(dateString);
      const now = new Date();
      if (isSameDay(date, now)) {
        return format(date, 'HH:mm');
      }
      return format(date, 'd MMM', { locale: es });
    } catch {
      return '';
    }
  };

  const getRecipientLabel = (petition: Petition) => {
    if (petition.type === 'CANCEL_MOVEMENT') return 'Administración';
    const owner = petition.apartment?.owner || (petition.stay as any)?.apartment?.owner;
    return owner ? `${owner.firstName} ${owner.lastName}` : 'Administración';
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-slate-900"></div>
      </div>
    );
  }

  if (petitions.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
        <span className="material-symbols-outlined text-slate-200 text-4xl mb-2">inbox</span>
        <p className="text-xs text-slate-400 font-medium italic">No hay peticiones registradas</p>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto custom-scrollbar p-2 space-y-1">
      {petitions.map((petition) => (
        <div
          key={petition.id}
          onClick={() => onSelect(petition)}
          className={`
            group p-3 rounded-lg cursor-pointer transition-all border
            ${selectedPetitionId === petition.id
              ? 'bg-slate-900 border-transparent'
              : 'bg-white border-slate-100 hover:border-slate-300 hover:bg-slate-50 shadow-sm'
            }
          `}
        >
          <div className="flex justify-between items-start mb-1.5">
            <span className={`
              text-[8px] uppercase font-black tracking-widest px-1.5 py-0.5 rounded
              ${selectedPetitionId === petition.id 
                ? 'bg-white/10 text-white' 
                : 'bg-slate-100 text-slate-500'
              }
            `}>
              {activeTab === 'sent' ? `Para: ${getRecipientLabel(petition)}` : `De: ${petition.user?.firstName} ${petition.user?.lastName}`}
            </span>
            <span className={`text-[9px] font-bold ${selectedPetitionId === petition.id ? 'text-slate-400' : 'text-slate-400'}`}>
              {formatRelativeTime(petition.createdAt)}
            </span>
          </div>

          <h3 className={`
            text-[13px] font-black tracking-tighter truncate mb-2
            ${selectedPetitionId === petition.id ? 'text-white' : 'text-slate-900'}
          `}>
            {petition.title}
          </h3>

          <div className="flex items-center justify-between">
            <span className={`
              text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-sm border
              ${selectedPetitionId === petition.id 
                ? 'bg-white/10 text-white border-white/20' 
                : statusClasses[petition.status]
              }
            `}>
              {statusLabels[petition.status]}
            </span>
            
            {(petition.apartment?.number || (petition.stay as any)?.apartment?.number) && (
              <span className={`text-[10px] font-bold ${selectedPetitionId === petition.id ? 'text-slate-400' : 'text-slate-500'}`}>
                {petition.apartment?.number || (petition.stay as any)?.apartment?.number}
              </span>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};
