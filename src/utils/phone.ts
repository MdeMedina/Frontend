/**
 * Formatea un número de teléfono para visualización
 * Mantiene el formato original si ya está formateado
 */
export const formatPhoneNumber = (phone: string): string => {
  if (!phone) return '';
  
  // Si ya tiene espacios o paréntesis, probablemente ya está formateado
  if (phone.includes(' ') || phone.includes('(') || phone.includes('-')) {
    return phone;
  }
  
  // Remover todos los caracteres no numéricos excepto el +
  const cleaned = phone.replace(/[^\d+]/g, '');
  
  if (!cleaned.startsWith('+')) {
    return phone; // Si no tiene código de país, devolver tal cual
  }
  
  // Detectar código de país común
  let countryCode = '';
  let numberDigits = '';
  
  if (cleaned.startsWith('+56')) { // Chile
    countryCode = '+56';
    numberDigits = cleaned.slice(3);
    if (numberDigits.length <= 1) return `${countryCode} ${numberDigits}`;
    if (numberDigits.length <= 2) return `${countryCode} ${numberDigits.slice(0, 1)} ${numberDigits.slice(1)}`;
    if (numberDigits.length <= 6) return `${countryCode} ${numberDigits.slice(0, 1)} ${numberDigits.slice(1, 5)} ${numberDigits.slice(5)}`;
    return `${countryCode} ${numberDigits.slice(0, 1)} ${numberDigits.slice(1, 5)} ${numberDigits.slice(5, 9)}`;
  } else if (cleaned.startsWith('+1')) { // USA/Canadá/República Dominicana
    countryCode = '+1';
    numberDigits = cleaned.slice(2);
    if (numberDigits.length <= 3) return `${countryCode} (${numberDigits}`;
    if (numberDigits.length <= 6) return `${countryCode} (${numberDigits.slice(0, 3)}) ${numberDigits.slice(3)}`;
    return `${countryCode} (${numberDigits.slice(0, 3)}) ${numberDigits.slice(3, 6)}-${numberDigits.slice(6, 10)}`;
  } else if (cleaned.startsWith('+54')) { // Argentina
    countryCode = '+54';
    numberDigits = cleaned.slice(3);
    if (numberDigits.length <= 1) return `${countryCode} ${numberDigits}`;
    if (numberDigits.length <= 5) return `${countryCode} ${numberDigits.slice(0, 1)} ${numberDigits.slice(1, 5)} ${numberDigits.slice(5)}`;
    return `${countryCode} ${numberDigits.slice(0, 1)} ${numberDigits.slice(1, 5)} ${numberDigits.slice(5, 9)}`;
  } else if (cleaned.startsWith('+52')) { // México
    countryCode = '+52';
    numberDigits = cleaned.slice(3);
    if (numberDigits.length <= 2) return `${countryCode} ${numberDigits}`;
    if (numberDigits.length <= 6) return `${countryCode} ${numberDigits.slice(0, 2)} ${numberDigits.slice(2, 6)} ${numberDigits.slice(6)}`;
    return `${countryCode} ${numberDigits.slice(0, 2)} ${numberDigits.slice(2, 6)} ${numberDigits.slice(6, 10)}`;
  } else if (cleaned.startsWith('+34')) { // España
    countryCode = '+34';
    numberDigits = cleaned.slice(3);
    if (numberDigits.length <= 3) return `${countryCode} ${numberDigits}`;
    if (numberDigits.length <= 6) return `${countryCode} ${numberDigits.slice(0, 3)} ${numberDigits.slice(3, 6)} ${numberDigits.slice(6)}`;
    return `${countryCode} ${numberDigits.slice(0, 3)} ${numberDigits.slice(3, 6)} ${numberDigits.slice(6, 9)}`;
  }
  
  // Formato genérico para otros países
  const digits = cleaned.slice(1);
  if (digits.length <= 2) return `+${digits}`;
  if (digits.length <= 4) return `+${digits.slice(0, 2)} ${digits.slice(2)}`;
  if (digits.length <= 8) return `+${digits.slice(0, 2)} ${digits.slice(2, 6)} ${digits.slice(6)}`;
  return `+${digits.slice(0, 2)} ${digits.slice(2, 6)} ${digits.slice(6, 10)}`;
};

/**
 * Valida que un número de teléfono tenga al menos 8 dígitos
 */
export const validatePhoneNumber = (phone: string): { isValid: boolean; error?: string } => {
  if (!phone || phone.trim() === '') {
    return { isValid: true }; // Opcional, no requiere validación
  }
  
  // Contar solo dígitos
  const digits = phone.replace(/\D/g, '');
  
  if (digits.length < 8) {
    return {
      isValid: false,
      error: 'El número de teléfono debe tener al menos 8 dígitos'
    };
  }
  
  return { isValid: true };
};

/**
 * Limpia un número de teléfono removiendo todos los caracteres no numéricos
 */
export const cleanPhoneNumber = (phone: string): string => {
  if (!phone) return '';
  return phone.replace(/\D/g, '');
};
