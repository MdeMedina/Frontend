import React, { useEffect } from 'react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  width?: string;
  showCloseButton?: boolean;
}

export const Modal: React.FC<ModalProps> = ({ 
  isOpen, 
  onClose, 
  title, 
  children, 
  width = 'max-w-md',
  showCloseButton = true
}) => {
  // Prevent scrolling when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto overflow-x-hidden p-4 sm:p-6 md:p-8" role="dialog" aria-modal="true">
      {/* Backdrop - Transparent per user request, but usually needs some visual cue. 
          If user means "transparent" literally, we use bg-transparent. 
          If they mean glassmorphism or lighter, we adjust. 
          User said: "todos los modal tienen un fondo negro, y en verdad estos tendrian que ser transparentes"
          This likely means removing the dark overlay or making it very subtle/glassy.
          Let's try a backdrop blur with very light color instead of heavy black.
      */}
      <div 
        className="fixed inset-0 bg-black/20 backdrop-blur-sm transition-opacity" 
        onClick={onClose} 
        aria-hidden="true"
      />

      {/* Modal Content */}
      <div className={`relative w-full ${width} transform rounded-2xl bg-white p-6 text-left shadow-xl transition-all border border-slate-200 flex flex-col max-h-[90vh]`}>
        {(title || showCloseButton) && (
          <div className="flex items-center justify-between mb-5 flex-shrink-0">
            {title && <h3 className="text-xl font-bold leading-6 text-slate-900">{title}</h3>}
            {showCloseButton && (
              <button
                type="button"
                className="rounded-full p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-500 focus:outline-none transition-colors"
                onClick={onClose}
              >
                <span className="sr-only">Cerrar</span>
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
        )}
        <div className="overflow-y-auto flex-1 pr-1">
          {children}
        </div>
      </div>
    </div>
  );
};
