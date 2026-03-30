import { useState } from 'react';
import { Modal } from '../../../../components/Modal';
import type { Manager, MyApartment } from '../useManagers';

interface AssignmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  manager: Manager | null;
  apartments: MyApartment[];
  onConfirm: (apartment: MyApartment) => void;
}

export const AssignmentModal = ({
  isOpen,
  onClose,
  manager,
  apartments,
  onConfirm,
}: AssignmentModalProps) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedAptId, setSelectedAptId] = useState('');

  const filteredApts = apartments
    .filter(apt => !apt.managerId)
    .filter(apt => {
      const searchStr = `${apt.number} ${typeof apt.building === 'string' ? apt.building : apt.building?.name || ''}`.toLowerCase();
      return searchStr.includes(searchTerm.toLowerCase());
    });

  const handleConfirm = () => {
    const apt = apartments.find(a => a.id === selectedAptId);
    if (apt) onConfirm(apt);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="ASIGNAR DEPARTAMENTO"
      width="max-w-md"
    >
      <div className="space-y-5">
        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1.5 pl-1">
            Personal Seleccionado
          </p>
          <div className="flex items-center gap-3 pl-1">
             <div className="w-8 h-8 rounded-full bg-slate-900 flex items-center justify-center text-white text-[10px] font-bold tracking-tighter">
                {manager?.firstName[0]}{manager?.lastName[0]}
             </div>
             <p className="text-sm font-bold text-slate-900 tracking-tight uppercase">
                {manager?.firstName} {manager?.lastName}
             </p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="relative">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-[18px]">
              search
            </span>
            <input
              type="text"
              placeholder="Buscar por departamento o torre..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900/5 focus:border-slate-900 transition-all tracking-tight"
            />
          </div>

          <div className="max-h-60 overflow-y-auto bg-slate-50 border border-slate-200 rounded-xl overflow-hidden divide-y divide-slate-200">
            {filteredApts.length > 0 ? (
              filteredApts.map((apt) => (
                <button
                  key={apt.id}
                  onClick={() => setSelectedAptId(apt.id)}
                  className={`w-full text-left p-4 flex items-center justify-between transition-all group ${
                    selectedAptId === apt.id ? 'bg-slate-900' : 'hover:bg-white'
                  }`}
                >
                  <div>
                    <p className={`text-sm font-bold tracking-tighter ${selectedAptId === apt.id ? 'text-white' : 'text-slate-900'}`}>
                      DEPTO {apt.number}
                    </p>
                    <p className={`text-[10px] font-bold uppercase tracking-widest ${selectedAptId === apt.id ? 'text-slate-400' : 'text-slate-500'}`}>
                      {typeof apt.building === 'string' ? apt.building : apt.building?.name || 'SIN TORRE'}
                    </p>
                  </div>
                  {selectedAptId === apt.id && (
                    <span className="material-symbols-outlined text-white text-[20px]">check_circle</span>
                  )}
                </button>
              ))
            ) : (
              <div className="p-8 text-center bg-white">
                <span className="material-symbols-outlined text-slate-300 text-[40px] mb-2">apartment</span>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">No hay departamentos disponibles</p>
              </div>
            )}
          </div>
        </div>

        <div className="flex gap-3 mt-6 pt-5 border-t border-slate-100">
           <button
            onClick={onClose}
            className="flex-1 px-4 py-2.5 border border-slate-200 text-slate-600 text-[10px] font-bold uppercase tracking-widest rounded-lg hover:bg-slate-50 transition-all"
          >
            Cancelar
          </button>
          <button
            onClick={handleConfirm}
            disabled={!selectedAptId}
            className="flex-1 px-4 py-2.5 bg-slate-900 text-white text-[10px] font-bold uppercase tracking-widest rounded-lg hover:bg-slate-800 disabled:opacity-30 disabled:grayscale transition-all active:scale-[0.98]"
          >
            Confirmar Asignación
          </button>
        </div>
      </div>
    </Modal>
  );
};
