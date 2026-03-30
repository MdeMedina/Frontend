import { useState } from 'react';
import { Modal } from '../../../../components/Modal';
import type { PetitionType } from '../usePetitions';

interface UpsertPetitionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (formData: any) => Promise<void>;
  myApartments: any[];
  allApartments: any[];
}

const typeLabels: Record<string, string> = {
  OTHER: 'Otro / General',
  CREATE_APARTMENT: 'Registrar Departamento',
  DELETE_APARTMENT: 'Eliminar Departamento',
  CREATE_MANAGER: 'Asignar Responsable',
  ASSIGN_PARKING: 'Préstamo de Estacionamiento',
};

export const UpsertPetitionModal = ({
  isOpen,
  onClose,
  onSubmit,
  myApartments,
  allApartments,
}: UpsertPetitionModalProps) => {
  const [formData, setFormData] = useState({
    type: 'OTHER' as PetitionType,
    title: '',
    reason: '',
    apartmentId: '',
    showDescription: false,
    targetApartment: '',
    parkingNumber: '',
    startDate: '',
    endDate: '',
    searchText: '',
    showDropdown: false,
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const targetApt = allApartments.find(a => a.id === formData.targetApartment);
      const finalTitle = formData.title.trim() || typeLabels[formData.type] || 'Nueva Petición';

      const payload = {
        type: formData.type,
        title: finalTitle,
        reason: formData.showDescription && formData.reason.trim() ? formData.reason : 'Sin descripción adicional',
        apartmentId: formData.apartmentId || undefined,
        requestedData: formData.type === 'ASSIGN_PARKING' ? {
          targetApartmentId: formData.targetApartment,
          targetApartmentNumber: targetApt?.number,
          targetBuildingName: typeof targetApt?.building === 'string' ? targetApt.building : targetApt?.building?.name,
          parkingNumber: formData.parkingNumber,
          startDate: formData.startDate,
          endDate: formData.endDate
        } : undefined,
      };

      await onSubmit(payload);
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredTargetApartments = allApartments
    .filter(a => {
      const search = (formData.searchText || '').toLowerCase();
      const ownerName = `${a.owner?.firstName || ''} ${a.owner?.lastName || ''}`.toLowerCase();
      const aptNumber = a.number.toLowerCase();
      return aptNumber.includes(search) || ownerName.includes(search);
    })
    .filter(a => a.id !== formData.apartmentId)
    .sort((a, b) => a.number.localeCompare(b.number));

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="SOLICITAR NUEVA ACCIÓN" width="max-w-md">
      <form onSubmit={handleFormSubmit} className="space-y-4">
        <div>
          <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Tipo de Petición</label>
          <div className="relative">
            <select
              value={formData.type}
              onChange={(e) => setFormData({ ...formData, type: e.target.value as PetitionType, title: '' })}
              className="w-full bg-slate-50 border border-slate-200 rounded px-3 py-2.5 text-sm font-bold text-slate-900 focus:outline-none focus:border-slate-900 appearance-none"
              required
            >
              {Object.entries(typeLabels).map(([val, label]) => (
                <option key={val} value={val}>{label}</option>
              ))}
            </select>
            <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">expand_more</span>
          </div>
        </div>

        <div>
          <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Título / Resumen</label>
          <input
            type="text"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            className="w-full bg-slate-50 border border-slate-200 rounded px-3 py-2.5 text-sm font-bold text-slate-900 focus:outline-none focus:border-slate-900"
            placeholder="Ej: Cambio de Estacionamiento..."
          />
        </div>

        {['MODIFY_APARTMENT', 'CREATE_MANAGER'].includes(formData.type) && (
          <div>
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Departamento</label>
            <select
              value={formData.apartmentId}
              onChange={(e) => setFormData({ ...formData, apartmentId: e.target.value })}
              className="w-full bg-slate-50 border border-slate-200 rounded px-3 py-2.5 text-sm font-bold text-slate-900"
              required
            >
              <option value="">Selecciona un departamento</option>
              {myApartments.map(apt => (
                <option key={apt.id} value={apt.id}>{apt.number} - {typeof apt.building === 'string' ? apt.building : apt.building?.name}</option>
              ))}
            </select>
          </div>
        )}

        {formData.type === 'ASSIGN_PARKING' && (
          <div className="space-y-4 bg-slate-50 p-4 rounded-lg border border-slate-200 border-dashed">
            <div>
              <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5">Mi Departamento (Origen)</label>
              <select
                value={formData.apartmentId}
                onChange={(e) => {
                  const apt = myApartments.find(a => a.id === e.target.value);
                  setFormData({ ...formData, apartmentId: e.target.value, parkingNumber: apt?.parkingNumber || '' });
                }}
                className="w-full bg-white border border-slate-200 rounded px-3 py-2 text-sm font-bold"
                required
              >
                <option value="">Selecciona tu departamento</option>
                {myApartments.filter(apt => apt.parkingNumber || (apt.sourceAssignments && apt.sourceAssignments.length > 0)).map(apt => (
                  <option key={apt.id} value={apt.id}>{apt.number} (Est: {apt.parkingNumber || 'N/A'})</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5">Estacionamiento a prestar</label>
              <input
                type="text"
                value={formData.parkingNumber}
                className="w-full bg-slate-100 border border-slate-200 rounded px-3 py-2 text-sm font-bold text-slate-500 cursor-not-allowed"
                readOnly
              />
            </div>

            <div className="relative">
              <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5">Destinatario (Buscador)</label>
              <input
                type="text"
                placeholder="Número o Propietario..."
                className="w-full bg-white border border-slate-200 rounded px-3 py-2 text-sm font-bold focus:outline-none focus:border-slate-900"
                value={formData.targetApartment ? 
                  (() => {
                    const apt = allApartments.find(a => a.id === formData.targetApartment);
                    return apt ? `Depto ${apt.number} - ${apt.owner?.firstName || ''} ${apt.owner?.lastName || ''}` : '';
                  })() : formData.searchText}
                onChange={(e) => setFormData({ ...formData, targetApartment: '', searchText: e.target.value, showDropdown: true })}
                onFocus={() => setFormData({ ...formData, showDropdown: true })}
                onBlur={() => setTimeout(() => setFormData(prev => ({ ...prev, showDropdown: false })), 200)}
                required={!formData.targetApartment}
              />
              
              {formData.showDropdown && (
                <div className="absolute z-50 w-full bg-white max-h-48 overflow-y-auto border border-slate-200 rounded shadow-xl mt-1 custom-scrollbar">
                  {filteredTargetApartments.map(apt => (
                    <div
                      key={apt.id}
                      className="p-2.5 hover:bg-slate-50 cursor-pointer border-b border-slate-50 last:border-0"
                      onMouseDown={() => setFormData({ ...formData, targetApartment: apt.id, searchText: '', showDropdown: false })}
                    >
                      <div className="flex justify-between items-center">
                        <span className="font-black text-slate-900 text-[11px]">Depto {apt.number}</span>
                        <span className="text-[8px] font-black text-slate-400 uppercase">{typeof apt.building === 'string' ? apt.building : apt.building?.name}</span>
                      </div>
                      <span className="block text-[10px] text-slate-500 font-bold">{apt.owner?.firstName} {apt.owner?.lastName}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Desde</label>
                <input
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                  className="w-full bg-white border border-slate-200 rounded px-3 py-2 text-xs font-bold"
                  required
                />
              </div>
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Hasta</label>
                <input
                  type="date"
                  value={formData.endDate}
                  onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                  className="w-full bg-white border border-slate-200 rounded px-3 py-2 text-xs font-bold"
                  required
                />
              </div>
            </div>
          </div>
        )}

        <div className="flex items-center gap-2 mb-2">
            <input
                type="checkbox"
                id="showDesc"
                checked={formData.showDescription}
                onChange={(e) => setFormData({ ...formData, showDescription: e.target.checked })}
                className="w-4 h-4 text-slate-900 border-slate-300 rounded focus:ring-slate-900"
            />
            <label htmlFor="showDesc" className="text-[10px] font-black text-slate-600 uppercase tracking-widest cursor-pointer">
                Agregar descripción detallada
            </label>
        </div>

        {formData.showDescription && (
          <textarea
            value={formData.reason}
            onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
            className="w-full bg-slate-50 border border-slate-200 rounded px-3 py-2 text-sm font-bold min-h-[80px] resize-none focus:outline-none focus:border-slate-900"
            placeholder="Explique el motivo de su solicitud..."
            required
          />
        )}

        <div className="flex justify-end gap-2 pt-4">
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-2.5 rounded text-[10px] font-black uppercase tracking-widest text-slate-500 hover:bg-slate-100 transition-colors"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-8 py-2.5 rounded bg-slate-900 text-white font-black uppercase text-[10px] tracking-[0.2em] shadow-lg hover:bg-slate-800 disabled:opacity-50 transition-all active:scale-95"
          >
            {isSubmitting ? 'Enviando...' : 'Enviar Petición'}
          </button>
        </div>
      </form>
    </Modal>
  );
};
