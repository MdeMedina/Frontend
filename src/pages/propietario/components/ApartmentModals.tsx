import React from 'react';
import { Modal } from '../../../components/Modal';
import type { Apartment, AvailableManager } from '../apartments.types';

interface AssignManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  apartment: Apartment | null;
  availableManagers: AvailableManager[];
  selectedManagerId: string;
  setSelectedManagerId: (id: string) => void;
  reason: string;
  setReason: (r: string) => void;
  onSubmit: () => void;
}

export const AssignManagerModal = ({
  isOpen, onClose, apartment, availableManagers, selectedManagerId, setSelectedManagerId, reason, setReason, onSubmit
}: AssignManagerModalProps) => (
  <Modal
    isOpen={isOpen && !!apartment}
    onClose={onClose}
    title={apartment?.manager ? 'Protocolo: Cambiar Responsable' : 'Protocolo: Asignar Responsable'}
    width="max-w-md"
  >
    {apartment && (
      <div className="space-y-8 p-2">
        <div className="bg-gray-50 p-5 rounded-sm border-2 border-black/[0.03]">
          <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 mb-2">Unidad Destino</h4>
          <p className="text-[14px] font-bold text-gray-950 uppercase tracking-tight">
            Depto {apartment.number} — {apartment.building?.name || 'Protocolo_Alpha'}
          </p>
        </div>

        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-[10px] font-black text-gray-950 uppercase tracking-[0.2em] block">
              Seleccionar Operativo / Responsable *
            </label>
            <select
              value={selectedManagerId}
              onChange={(e) => setSelectedManagerId(e.target.value)}
              className="w-full border-2 border-black/[0.1] rounded-sm px-4 py-3 text-[14px] font-bold text-gray-950 focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all appearance-none bg-white cursor-pointer"
            >
              <option value="">-- Sin responsable --</option>
              {availableManagers.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.firstName} {m.lastName} ({m.email})
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-gray-950 uppercase tracking-[0.2em] block">
              Justificación de Auditoría
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
              placeholder="Indique el motivo técnico de la solicitud"
              className="w-full border-2 border-black/[0.1] rounded-sm px-4 py-3 text-[14px] font-medium text-gray-950 focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all placeholder:text-gray-300"
            />
          </div>
        </div>

        <div className="flex gap-4 pt-6 border-t border-black/[0.08]">
          <button
            onClick={onClose}
            className="flex-1 px-6 py-4 border-2 border-black rounded-sm text-gray-950 font-black uppercase text-[11px] tracking-[0.2em] transition-all hover:bg-gray-50 active:scale-95"
          >
            Anular
          </button>
          <button
            onClick={onSubmit}
            className="flex-1 px-6 py-4 bg-gray-950 text-white rounded-sm font-black uppercase text-[11px] tracking-[0.2em] transition-all hover:bg-blue-600 active:scale-95 shadow-2xl shadow-black/20"
          >
            Enviar Petición
          </button>
        </div>
      </div>
    )}
  </Modal>
);

interface EditApartmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  apartment: Apartment | null;
  formData: { parkingNumber: string };
  setFormData: (d: any) => void;
  onSubmit: (e: React.FormEvent) => void;
}

export const EditApartmentModal = ({
  isOpen, onClose, apartment, formData, setFormData, onSubmit
}: EditApartmentModalProps) => (
  <Modal
    isOpen={isOpen && !!apartment}
    onClose={onClose}
    title={`Protocolo: Modificar Depto ${apartment?.number}`}
    width="max-w-md"
  >
    <form onSubmit={onSubmit} className="space-y-8 p-2">
      <div className="bg-gray-950 text-white p-6 rounded-sm border-l-4 border-blue-600 mb-8 shadow-2xl shadow-black/20">
         <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-blue-400 mb-2">Nota de Seguridad</h4>
         <p className="text-[12px] font-medium opacity-80 uppercase tracking-tight leading-relaxed">
           La modificación de la asignación de estacionamiento requiere validación administrativa antes de su persistencia.
         </p>
      </div>

      <div className="space-y-6">
        <div className="space-y-2">
          <label className="text-[10px] font-black text-gray-950 uppercase tracking-[0.2em] block">Identificador Estacionamiento</label>
          <input
            type="text"
            value={formData.parkingNumber}
            onChange={(e) => setFormData({ ...formData, parkingNumber: e.target.value })}
            placeholder="Ej: E-ALPHA-101"
            className="w-full border-2 border-black/[0.1] rounded-sm px-4 py-3 text-[14px] font-bold text-gray-950 uppercase tracking-tight focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all placeholder:text-gray-300"
          />
        </div>
      </div>

      <div className="flex gap-4 pt-6 border-t border-black/[0.08]">
        <button
          type="button"
          onClick={onClose}
          className="flex-1 px-6 py-4 border-2 border-black rounded-sm text-gray-950 font-black uppercase text-[11px] tracking-[0.2em] transition-all hover:bg-gray-50 active:scale-95"
        >
          Anular
        </button>
        <button
          type="submit"
          className="flex-1 px-6 py-4 bg-gray-950 text-white rounded-sm font-black uppercase text-[11px] tracking-[0.2em] transition-all hover:bg-blue-600 active:scale-95 shadow-2xl shadow-black/20"
        >
          Solicitar Cambio
        </button>
      </div>
    </form>
  </Modal>
);
