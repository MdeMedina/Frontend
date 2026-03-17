import React, { useState } from 'react';
import { Modal } from './Modal';
import { Copy, CheckCircle2 } from 'lucide-react';

interface SetupLinkModalProps {
  isOpen: boolean;
  onClose: () => void;
  setupLink: string | null;
  userName?: string;
  isReset?: boolean;
}

export const SetupLinkModal: React.FC<SetupLinkModalProps> = ({ 
  isOpen, 
  onClose, 
  setupLink, 
  userName,
  isReset = false
}) => {
  const [copied, setCopied] = useState(false);

  if (!setupLink) return null;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(setupLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={isReset ? "Enlace de Reseteo Generado" : "Enlace de Acceso Generado"}>
      <div className="space-y-4">
        <p className="text-gray-600">
          {isReset 
            ? `Se ha generado un enlace de recuperación para `
            : `Se ha creado la cuenta para `
          }
          <strong>{userName || 'el usuario'}</strong> de forma exitosa. 
          Copia el siguiente enlace y envíaselo para que pueda {isReset ? 'restablecer' : 'configurar'} su contraseña e ingresar al sistema.
        </p>

        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 relative">
          <p className="text-sm font-mono text-gray-800 break-all pr-12">
            {setupLink}
          </p>
          <button
            onClick={handleCopy}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
            title="Copiar enlace"
          >
            {copied ? (
              <CheckCircle2 className="w-5 h-5 text-green-500" />
            ) : (
              <Copy className="w-5 h-5" />
            )}
          </button>
        </div>

        <p className="text-xs text-yellow-600 bg-yellow-50 p-3 rounded-lg border border-yellow-200">
          ⚠️ Este enlace expirará en <strong>{isReset ? '30 minutos' : '24 horas'}</strong> por seguridad. Si expira, puedes generar uno nuevo desde la lista de usuarios.
        </p>

        <div className="flex justify-end pt-4">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 transition"
          >
            Entendido
          </button>
        </div>
      </div>
    </Modal>
  );
};
