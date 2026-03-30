interface PetitionFiltersProps {
  activeTab: 'sent' | 'received';
  onTabChange: (tab: 'sent' | 'received') => void;
  filterStatus: string;
  onStatusChange: (status: string) => void;
  onNewPetition: () => void;
  successMessage: string | null;
}

export const PetitionFilters = ({
  activeTab,
  onTabChange,
  filterStatus,
  onStatusChange,
  onNewPetition,
  successMessage,
}: PetitionFiltersProps) => {
  return (
    <div className="p-3 border-b border-slate-200 bg-white">
      <div className="flex justify-between items-center mb-3">
        <h2 className="font-black text-[10px] uppercase tracking-widest text-slate-500">Buzón de Peticiones</h2>
        <button
          onClick={onNewPetition}
          className="bg-slate-900 text-white px-4 py-1.5 rounded-full hover:bg-slate-800 transition shadow-lg flex items-center justify-center gap-1.5 font-black uppercase text-[10px] tracking-widest active:scale-95"
        >
          <span>Nueva</span>
          <span className="material-symbols-outlined text-[16px] font-black">add</span>
        </button>
      </div>

      {successMessage && (
        <div className="mb-3 p-2 bg-slate-900 border border-slate-800 rounded flex items-center gap-2 animate-in fade-in slide-in-from-top-1 duration-300">
          <span className="material-symbols-outlined text-white text-sm">check_circle</span>
          <p className="text-[10px] font-bold text-white tracking-tight italic">
            {successMessage}
          </p>
        </div>
      )}

      <div className="flex bg-slate-100 p-1 rounded-lg mb-3">
        <button
          onClick={() => onTabChange('sent')}
          className={`flex-1 py-1.5 rounded-md text-[10px] font-black uppercase tracking-wider transition-all ${
            activeTab === 'sent' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          Enviadas
        </button>
        <button
          onClick={() => onTabChange('received')}
          className={`flex-1 py-1.5 rounded-md text-[10px] font-black uppercase tracking-wider transition-all ${
            activeTab === 'received' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          Recibidas
        </button>
      </div>

      <div className="relative">
        <select
          value={filterStatus}
          onChange={(e) => onStatusChange(e.target.value)}
          className="w-full bg-white border border-slate-200 text-slate-900 py-2 px-3 rounded font-bold text-[10px] uppercase tracking-widest focus:outline-none focus:ring-1 focus:ring-slate-900 appearance-none"
        >
          <option value="">Todos los estados</option>
          <option value="PENDING">Pendientes</option>
          <option value="APPROVED">Aprobadas</option>
          <option value="REJECTED">Rechazadas</option>
        </select>
        <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
          <span className="material-symbols-outlined text-slate-400 text-sm">filter_list</span>
        </div>
      </div>
    </div>
  );
};
