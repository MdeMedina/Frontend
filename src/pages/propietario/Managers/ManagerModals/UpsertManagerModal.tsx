import React, { useState, useEffect } from 'react';
import { Modal } from '../../../../components/Modal';
import { PhoneInput } from '../../../../components/PhoneInput';
import { handleRutInput } from '../../../../utils/rut';
import type { Manager, MyApartment } from '../useManagers';

interface UpsertManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => Promise<void>;
  editingManager: Manager | null;
  myApartments: MyApartment[];
  loading: boolean;
  onFileUpload: (e: React.ChangeEvent<HTMLInputElement>) => Promise<string | undefined>;
  onResetKey: (manager: Manager) => void;
}

export const UpsertManagerModal = ({
  isOpen,
  onClose,
  onSubmit,
  editingManager,
  myApartments,
  loading,
  onFileUpload,
  onResetKey,
}: UpsertManagerModalProps) => {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    rut: '',
    phone: '+56',
    apartmentId: '',
    description: '',
    showDescription: false,
    rutDocumentUrl: '',
  });
  const [isPhoneValid, setIsPhoneValid] = useState(true);

  useEffect(() => {
    if (editingManager) {
      setFormData({
        firstName: editingManager.firstName,
        lastName: editingManager.lastName,
        email: editingManager.email,
        rut: editingManager.rut || '',
        phone: editingManager.phone || '+56',
        apartmentId: '',
        description: '',
        showDescription: false,
        rutDocumentUrl: editingManager.rutDocumentUrl || '',
      });
    } else {
      setFormData({
        firstName: '',
        lastName: '',
        email: '',
        rut: '',
        phone: '+56',
        apartmentId: '',
        description: '',
        showDescription: false,
        rutDocumentUrl: '',
      });
    }
  }, [editingManager, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isPhoneValid) return;
    await onSubmit(formData);
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const url = await onFileUpload(e);
    if (url) {
      setFormData(prev => ({ ...prev, rutDocumentUrl: url }));
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={editingManager ? 'MODIFICAR RESPONSABLE' : 'NUEVO RESPONSABLE'}
      width="max-w-md"
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">
              Nombre *
            </label>
            <input
              type="text"
              required
              value={formData.firstName}
              onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2.5 text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/5 focus:border-slate-900 transition-all tracking-tight"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">
              Apellido *
            </label>
            <input
              type="text"
              required
              value={formData.lastName}
              onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2.5 text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/5 focus:border-slate-900 transition-all tracking-tight"
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">
            Correo electrónico *
          </label>
          <input
            type="email"
            required
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            placeholder="ejm: responsable@email.com"
            className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2.5 text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/5 focus:border-slate-900 transition-all tracking-tight"
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">
            RUT
          </label>
          <input
            type="text"
            value={formData.rut}
            onChange={(e) => setFormData({ ...formData, rut: handleRutInput(e.target.value) })}
            placeholder="12.345.678-9"
            maxLength={12}
            className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2.5 text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/5 focus:border-slate-900 transition-all tracking-tight"
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">
            Teléfono
          </label>
          <PhoneInput
            value={formData.phone}
            onChange={(val) => setFormData({ ...formData, phone: val })}
            onValidationChange={setIsPhoneValid}
          />
        </div>

        {!editingManager && myApartments.length > 0 && (
          <div className="space-y-1.5 pt-2 border-t border-slate-100">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">
              Asignar a departamento (opcional)
            </label>
            <select
              value={formData.apartmentId}
              onChange={(e) => setFormData({ ...formData, apartmentId: e.target.value })}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2.5 text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/5 focus:border-slate-900 transition-all tracking-tight cursor-pointer"
            >
              <option value="">Sin asignar departamento</option>
              {myApartments.map((apt) => (
                <option key={apt.id} value={apt.id}>
                  DEPTO {apt.number} - {typeof apt.building === 'string' ? apt.building : apt.building?.name || 'Sin torre'}
                  {apt.managerId ? ' (ya tiene responsable)' : ''}
                </option>
              ))}
            </select>
          </div>
        )}

        <div className="space-y-2">
          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">
            Cédula de Identidad (PDF/JPG/PNG)
          </label>
          <input
            type="file"
            accept=".pdf,.jpg,.jpeg,.png"
            onChange={handleFileChange}
            className="w-full text-xs text-slate-500
              file:mr-4 file:py-2 file:px-4
              file:rounded-full file:border-0
              file:text-[10px] file:font-bold file:uppercase file:tracking-widest
              file:bg-slate-900 file:text-white
              hover:file:bg-slate-800 transition-all cursor-pointer"
          />
          {formData.rutDocumentUrl && (
            <div className="flex items-center gap-1.5 px-3 py-2 bg-emerald-50 border border-emerald-100 rounded-lg text-emerald-700">
              <span className="material-symbols-outlined text-[18px]">check_circle</span>
              <span className="text-[11px] font-bold uppercase tracking-tight">Archivo adjuntado correctamente</span>
            </div>
          )}
        </div>

        <div className="space-y-2.5 pt-2">
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="showDesc"
              checked={formData.showDescription}
              onChange={(e) => setFormData({ ...formData, showDescription: e.target.checked })}
              className="w-4 h-4 text-slate-900 rounded border-slate-300 focus:ring-slate-900 transition-all cursor-pointer"
            />
            <label htmlFor="showDesc" className="text-xs font-bold text-slate-600 uppercase tracking-tight cursor-pointer select-none">
              Motivo adicional de la petición
            </label>
          </div>

          {formData.showDescription && (
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2.5 text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/5 focus:border-slate-900 transition-all tracking-tight h-24 resize-none"
              placeholder="Describa el motivo de esta solicitud..."
              required
            />
          )}
        </div>

        <div className="flex flex-col gap-3 mt-6 pt-5 border-t border-slate-100">
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 border border-slate-200 text-slate-600 text-xs font-bold uppercase tracking-widest rounded-lg hover:bg-slate-50 transition-all"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading || !isPhoneValid}
              className="flex-1 px-4 py-2.5 bg-slate-900 text-white text-xs font-bold uppercase tracking-widest rounded-lg hover:bg-slate-800 disabled:opacity-50 active:scale-[0.98] transition-all"
            >
              {loading ? 'ENVIANDO...' : 'ENVIAR SOLICITUD'}
            </button>
          </div>
          
          {editingManager && (
            <button
              type="button"
              onClick={() => onResetKey(editingManager)}
              className="w-full px-4 py-2 bg-orange-50 text-orange-700 text-[10px] font-bold uppercase tracking-widest rounded-lg hover:bg-orange-100 transition-all"
            >
              Reiniciar Clave (Generar enlace temporal)
            </button>
          )}
        </div>
      </form>
    </Modal>
  );
};
