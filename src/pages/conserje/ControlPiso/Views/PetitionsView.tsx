import type { Petition } from '../../../../api/petitions';

interface PetitionsViewProps {
  petitions: Petition[];
  isLoading: boolean;
  onPetitionClick: (p: Petition) => void;
  onCreateNew: () => void;
  formatDateOnly: (date: string) => string;
}

export const PetitionsView = ({
  petitions, isLoading, onPetitionClick, onCreateNew, formatDateOnly
}: PetitionsViewProps) => {

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'PENDING': return 'bg-white text-slate-900 border-slate-900 shadow-[2px_2px_0px_0px_rgba(0,0,0,0.1)]';
      case 'APPROVED': return 'bg-slate-100 text-slate-400 border-slate-200';
      case 'REJECTED': return 'bg-red-50 text-red-700 border-red-100';
      default: return 'bg-slate-50 text-slate-500 border-slate-100';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'PENDING': return 'Pendiente';
      case 'APPROVED': return 'Aprobada';
      case 'REJECTED': return 'Rechazada';
      default: return status;
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tighter uppercase">Historial de Peticiones</h1>
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-[0.3em] mt-1">
            Gestión de solicitudes a propietarios
          </p>
        </div>
        <button
          onClick={onCreateNew}
          className="px-5 py-2.5 bg-slate-900 text-white text-[11px] font-black uppercase tracking-[0.2em] rounded shadow-[4px_4px_0px_0px_rgba(0,0,0,0.2)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-all flex items-center gap-2"
        >
          <span className="material-symbols-outlined text-sm">add_circle</span>
          Nueva Petición
        </button>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-[4px_4px_0px_0px_rgba(0,0,0,0.05)] overflow-hidden">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <div className="w-8 h-8 rounded-full border-2 border-slate-200 border-b-slate-900 animate-spin"></div>
            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Cargando Historial...</span>
          </div>
        ) : petitions.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <div className="p-8 rounded-full bg-slate-50 opacity-20">
                <span className="material-symbols-outlined text-6xl">file_open</span>
            </div>
            <div className="text-center">
                <span className="block text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Sin Peticiones Emitidas</span>
                <p className="text-[10px] font-bold text-slate-300 italic mt-1">Sus solicitudes recientes aparecerán aquí.</p>
            </div>
          </div>
        ) : (
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-100">
                <th className="px-6 py-3 text-[10px] font-black uppercase tracking-widest text-slate-400">Destinatario</th>
                <th className="px-6 py-3 text-[10px] font-black uppercase tracking-widest text-slate-400">Unidad</th>
                <th className="px-6 py-3 text-[10px] font-black uppercase tracking-widest text-slate-400">Asunto</th>
                <th className="px-6 py-3 text-[10px] font-black uppercase tracking-widest text-slate-400">Estado</th>
                <th className="px-6 py-3 text-[10px] font-black uppercase tracking-widest text-slate-400 text-right">Fecha</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {petitions.map(petition => (
                <tr
                  key={petition.id}
                  onClick={() => onPetitionClick(petition)}
                  className="group hover:bg-slate-50 cursor-pointer transition-colors"
                >
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                        <div className={`w-1.5 h-1.5 rounded-full ${petition.type === 'CANCEL_MOVEMENT' ? 'bg-slate-900' : 'bg-slate-400'}`}></div>
                        <span className="text-[11px] font-black uppercase tracking-tight text-slate-900">
                            {petition.type === 'CANCEL_MOVEMENT' 
                              ? 'Administración' 
                              : (petition.apartment?.owner 
                                  ? `${petition.apartment.owner.firstName} ${petition.apartment.owner.lastName}` 
                                  : (petition.stay as any)?.apartment?.owner 
                                    ? `${(petition.stay as any).apartment.owner.firstName} ${(petition.stay as any).apartment.owner.lastName}`
                                    : 'Propietario')}
                        </span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-[12px] font-black text-slate-900">
                        {petition.apartment?.number || (petition.stay as any)?.apartment?.number || 'S/N'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-[11px] font-bold text-slate-600 line-clamp-1 group-hover:text-slate-900 transition-colors">
                        {petition.title}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-0.5 text-[9px] font-black uppercase tracking-tighter border rounded-full ${getStatusStyle(petition.status)}`}>
                        {getStatusLabel(petition.status)}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <span className="text-[10px] font-bold text-slate-400 font-mono">
                        {formatDateOnly(petition.createdAt)}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};
