import React, { useEffect } from 'react';
import { X } from 'lucide-react';

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
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto overflow-x-hidden p-4 sm:p-6 md:p-8"
         role="dialog" aria-modal="true" aria-labelledby="modal-title">
      {/* Backdrop - Subtle blur and low opacity for "transparent" feel */}
      <div
        className="fixed inset-0 bg-black/10 backdrop-blur-md transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal Content */}
      <div className={`relative w-full ${width} transform rounded-[var(--radius-sm)] bg-[var(--color-surface)] p-5 text-left shadow-lg
                      transition-all border border-[var(--color-border)] flex flex-col max-h-[90vh]`}>
        {(title || showCloseButton) && (
          <div className="flex items-center justify-between mb-4 flex-shrink-0">
            {title && (
              <h3 id="modal-title" className="text-lg font-semibold tracking-tight leading-6 text-[var(--color-text-primary)]">
                {title}
              </h3>
            )}
            {showCloseButton && (
              <button
                type="button"
                className="rounded-[var(--radius-sm)] p-1 text-[var(--color-text-muted)] hover:bg-[var(--color-border)]
                           hover:text-[var(--color-text-primary)] focus:outline-none transition-colors"
                onClick={onClose}
              >
                <span className="sr-only">Cerrar</span>
                <X size={20} strokeWidth={2} />
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
