import { useState } from 'react';
import { Modal } from '../../../../components/Modal';

interface ReviewPetitionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (action: 'APPROVED' | 'REJECTED', note: string) => Promise<void>;
  action: 'APPROVED' | 'REJECTED' | null;
}

export const ReviewPetitionModal = ({
  isOpen,
  onClose,
  onConfirm,
  action,
}: ReviewPetitionModalProps) => {
  const [rejectionReasonEnum, setRejectionReasonEnum] = useState('INCOMPLETE_INFO');
  const [reviewReason, setReviewReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleConfirm = async () => {
    setIsSubmitting(true);
    let finalNote = '';

    if (action === 'REJECTED') {
      const reasonMap: Record<string, string> = {
        'INCOMPLETE_INFO': 'Información incompleta',
        'EXPIRED_DOCS': 'Documentación vencida',
        'REQUIREMENTS_NOT_MET': 'No cumple con requisitos',
        'OTHER': 'Otros'
      };
      const selectedReasonText = reasonMap[rejectionReasonEnum];
      finalNote = `Motivo: ${selectedReasonText}. ${reviewReason ? `Comentarios: ${reviewReason}` : ''}`;

      if (rejectionReasonEnum === 'OTHER' && !reviewReason.trim()) {
        alert('Por favor agrega comentarios adicionales para el motivo "Otros".');
        setIsSubmitting(false);
        return;
      }
    } else {
      finalNote = reviewReason;
    }

    try {
      await onConfirm(action!, finalNote);
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={action === 'APPROVED' ? 'APROBAR PETICIÓN' : 'RECHAZAR PETICIÓN'}
      width="max-w-md"
    >
      <div className="space-y-4">
        {action === 'REJECTED' && (
          <div>
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Motivo de Rechazo</label>
            <select
              value={rejectionReasonEnum}
              onChange={(e) => setRejectionReasonEnum(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded px-3 py-2.5 text-sm font-bold text-slate-900 focus:outline-none focus:border-slate-900 appearance-none"
            >
              <option value="INCOMPLETE_INFO">Información incompleta</option>
              <option value="EXPIRED_DOCS">Documentación vencida</option>
              <option value="REQUIREMENTS_NOT_MET">No cumple con requisitos</option>
              <option value="OTHER">Otros</option>
            </select>
          </div>
        )}

        <div>
          <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">
            {action === 'APPROVED' ? 'Notas de Aprobación (Opcional)' : 'Comentarios Adicionales'}
          </label>
          <textarea
            value={reviewReason}
            onChange={(e) => setReviewReason(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded px-3 py-2.5 text-sm font-bold min-h-[100px] resize-none focus:outline-none focus:border-slate-900"
            placeholder={action === 'APPROVED' ? "Aprobar con condiciones o adjuntos..." : "Escriba aquí los detalles..."}
          />
        </div>

        <div className="flex justify-end gap-2 pt-4">
          <button
            onClick={onClose}
            className="px-6 py-2.5 rounded text-[10px] font-black uppercase tracking-widest text-slate-500 hover:bg-slate-100 transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleConfirm}
            disabled={isSubmitting}
            className={`
              px-8 py-2.5 rounded font-black uppercase text-[10px] tracking-[0.2em] shadow-lg transition-all active:scale-95
              ${action === 'APPROVED' 
                ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-blue-500/20' 
                : 'bg-red-600 text-white hover:bg-red-700 shadow-red-500/20'
              }
            `}
          >
            {isSubmitting ? 'Confirmando...' : `Confirmar ${action === 'APPROVED' ? 'Aprobación' : 'Rechazo'}`}
          </button>
        </div>
      </div>
    </Modal>
  );
};
