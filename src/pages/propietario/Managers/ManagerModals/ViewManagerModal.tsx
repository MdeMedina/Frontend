import { Modal } from '../../../../components/Modal';
import type { Manager } from '../useManagers';
import { formatPhoneNumber } from '../../../../utils/phone';

interface ViewManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  manager: Manager | null;
}

export const ViewManagerModal = ({
  isOpen,
  onClose,
  manager,
}: ViewManagerModalProps) => {
  if (!manager) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="DETALLES DEL RESPONSABLE"
      width="max-w-2xl"
    >
      <div className="space-y-6">
        {/* Información Personal */}
        <div className="bg-slate-50 p-5 rounded-xl border border-slate-200">
          <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-4 border-b border-slate-200 pb-2 flex items-center gap-2">
            <span className="material-symbols-outlined text-[16px]">person</span>
            Información de Perfil
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-5">
            <div className="space-y-1">
              <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest pl-0.5">Nombre Completo</label>
              <p className="text-sm font-bold text-slate-900 tracking-tight pl-0.5 uppercase">{manager.firstName} {manager.lastName}</p>
            </div>
            <div className="space-y-1">
              <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest pl-0.5">RUT / Identificación</label>
              <p className="text-sm font-bold text-slate-900 tracking-tight pl-0.5 uppercase">{manager.rut || 'NO REGISTRADO'}</p>
            </div>
            <div className="space-y-1">
              <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest pl-0.5">Correo Electrónico</label>
              <p className="text-sm font-bold text-slate-900 tracking-tight pl-0.5 select-all">{manager.email}</p>
            </div>
            <div className="space-y-1">
              <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest pl-0.5">Número de Teléfono</label>
              <p className="text-sm font-bold text-slate-900 tracking-tight pl-0.5">
                {manager.phone ? formatPhoneNumber(manager.phone) : 'NO REGISTRADO'}
              </p>
            </div>
          </div>
        </div>

        {/* Documento RUT Adjunto */}
        <div className="bg-white p-5 rounded-xl border border-slate-200">
          <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-4 border-b border-slate-200 pb-2 flex items-center gap-2">
            <span className="material-symbols-outlined text-[16px]">description</span>
            Documentación Verificada
          </h3>

          {manager.rutDocumentUrl ? (
            <div className="flex justify-center items-center bg-slate-50 rounded-lg border border-dashed border-slate-300 p-2 overflow-hidden">
              {manager.rutDocumentUrl.toLowerCase().endsWith('.pdf') ? (
                <iframe
                  src={manager.rutDocumentUrl}
                  className="w-full h-[350px] border-0 rounded-md"
                  title="Document Preview"
                />
              ) : (
                <img
                  src={manager.rutDocumentUrl}
                  alt="Document Preview"
                  className="max-w-full max-h-[350px] object-contain rounded-md"
                />
              )}
            </div>
          ) : (
            <div className="text-center py-12 bg-slate-50/50 border border-dashed border-slate-200 rounded-lg text-slate-400 text-xs font-bold uppercase tracking-widest">
              No hay documentación adjunta
            </div>
          )}
        </div>

        <div className="flex justify-end pt-2">
          <button
            onClick={onClose}
            className="px-6 py-2.5 bg-slate-900 text-white text-[10px] font-bold uppercase tracking-widest rounded-lg hover:bg-slate-800 transition-all active:scale-[0.98]"
          >
            Cerrar Ventana
          </button>
        </div>
      </div>
    </Modal>
  );
};
