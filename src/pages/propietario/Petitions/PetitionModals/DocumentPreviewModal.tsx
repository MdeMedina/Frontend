import { Modal } from '../../../../components/Modal';

interface DocumentPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  url: string;
}

export const DocumentPreviewModal = ({
  isOpen,
  onClose,
  url,
}: DocumentPreviewModalProps) => {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="VISTA PREVIA DE DOCUMENTO"
      width="max-w-4xl"
    >
      <div className="flex justify-center bg-slate-100 rounded-lg overflow-hidden min-h-[500px] border border-slate-200">
        {url ? (
          <iframe src={url} className="w-full h-[600px] border-none shadow-inner" title="Document Preview" />
        ) : (
          <div className="flex flex-col items-center justify-center p-10 text-slate-400 gap-2">
            <span className="material-symbols-outlined text-4xl">description_off</span>
            <p className="text-xs font-black uppercase tracking-widest text-slate-300 italic">No hay documento disponible</p>
          </div>
        )}
      </div>
    </Modal>
  );
};
