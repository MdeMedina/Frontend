import { useState, useRef, useEffect } from 'react';
import { formatPhoneNumber, validatePhoneNumber, cleanPhoneNumber } from '../utils/phone';

// Lista de países comunes con sus códigos, banderas y dígitos requeridos
const COUNTRIES = [
  { code: 'CL', dialCode: '+56', flag: '🇨🇱', name: 'Chile', minDigits: 9, maxDigits: 9 },
  { code: 'AR', dialCode: '+54', flag: '🇦🇷', name: 'Argentina', minDigits: 10, maxDigits: 10 },
  { code: 'PE', dialCode: '+51', flag: '🇵🇪', name: 'Perú', minDigits: 9, maxDigits: 9 },
  { code: 'CO', dialCode: '+57', flag: '🇨🇴', name: 'Colombia', minDigits: 10, maxDigits: 10 },
  { code: 'MX', dialCode: '+52', flag: '🇲🇽', name: 'México', minDigits: 10, maxDigits: 10 },
  { code: 'ES', dialCode: '+34', flag: '🇪🇸', name: 'España', minDigits: 9, maxDigits: 9 },
  { code: 'US', dialCode: '+1', flag: '🇺🇸', name: 'Estados Unidos', minDigits: 10, maxDigits: 10 },
  { code: 'BR', dialCode: '+55', flag: '🇧🇷', name: 'Brasil', minDigits: 10, maxDigits: 11 },
  { code: 'UY', dialCode: '+598', flag: '🇺🇾', name: 'Uruguay', minDigits: 8, maxDigits: 8 },
  { code: 'PY', dialCode: '+595', flag: '🇵🇾', name: 'Paraguay', minDigits: 9, maxDigits: 9 },
  { code: 'BO', dialCode: '+591', flag: '🇧🇴', name: 'Bolivia', minDigits: 8, maxDigits: 8 },
  { code: 'EC', dialCode: '+593', flag: '🇪🇨', name: 'Ecuador', minDigits: 9, maxDigits: 9 },
  { code: 'VE', dialCode: '+58', flag: '🇻🇪', name: 'Venezuela', minDigits: 10, maxDigits: 10 },
  { code: 'CR', dialCode: '+506', flag: '🇨🇷', name: 'Costa Rica', minDigits: 8, maxDigits: 8 },
  { code: 'PA', dialCode: '+507', flag: '🇵🇦', name: 'Panamá', minDigits: 7, maxDigits: 8 },
  { code: 'GT', dialCode: '+502', flag: '🇬🇹', name: 'Guatemala', minDigits: 8, maxDigits: 8 },
  { code: 'DO', dialCode: '+1', flag: '🇩🇴', name: 'República Dominicana', minDigits: 10, maxDigits: 10 },
  { code: 'CU', dialCode: '+53', flag: '🇨🇺', name: 'Cuba', minDigits: 8, maxDigits: 8 },
  { code: 'HN', dialCode: '+504', flag: '🇭🇳', name: 'Honduras', minDigits: 8, maxDigits: 8 },
  { code: 'NI', dialCode: '+505', flag: '🇳🇮', name: 'Nicaragua', minDigits: 8, maxDigits: 8 },
  { code: 'SV', dialCode: '+503', flag: '🇸🇻', name: 'El Salvador', minDigits: 8, maxDigits: 8 },
];

interface PhoneInputProps {
  value: string;
  onChange: (value: string) => void;
  onValidationChange?: (isValid: boolean, error?: string) => void;
  placeholder?: string;
  className?: string;
  required?: boolean;
}

export const PhoneInput = ({
  value,
  onChange,
  onValidationChange,
  placeholder,
  className = '',
  required = false,
}: PhoneInputProps) => {
  const [selectedCountry, setSelectedCountry] = useState(COUNTRIES[0]); // Chile por defecto
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [phoneError, setPhoneError] = useState('');
  const [displayValue, setDisplayValue] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);
  const isUserChangingCountry = useRef(false);

  // Obtener solo los dígitos del número (sin código de país) del valor completo
  const getNumberDigits = (fullValue: string): string => {
    if (!fullValue) return '';
    const cleaned = fullValue.replace(/\D/g, '');
    const countryDigits = selectedCountry.dialCode.replace('+', '');
    if (cleaned.startsWith(countryDigits)) {
      return cleaned.slice(countryDigits.length);
    }
    return cleaned;
  };

  // Detectar país inicial desde el valor si ya tiene código (solo cuando no es un cambio manual del usuario)
  useEffect(() => {
    if (isUserChangingCountry.current) {
      isUserChangingCountry.current = false;
      return;
    }
    
    if (value && value.startsWith('+')) {
      const detectedCountry = COUNTRIES.find(country => 
        value.startsWith(country.dialCode)
      );
      if (detectedCountry && detectedCountry.code !== selectedCountry.code) {
        setSelectedCountry(detectedCountry);
      }
    }
  }, [value]);

  // Actualizar displayValue cuando cambia el valor o el país (solo cuando viene del backend)
  useEffect(() => {
    // Si el usuario está cambiando el país manualmente, no actualizar aquí
    if (isUserChangingCountry.current) {
      return;
    }
    
    if (value && value.trim() !== '') {
      const cleaned = value.replace(/\D/g, '');
      const countryDigits = selectedCountry.dialCode.replace('+', '');
      
      // Solo procesar si el valor empieza con el código del país seleccionado
      if (cleaned.startsWith(countryDigits)) {
        const numberDigits = cleaned.slice(countryDigits.length);
        if (numberDigits.length > 0) {
          setDisplayValue(formatPhoneNumberDigits(numberDigits, selectedCountry));
        } else {
          setDisplayValue('');
        }
      } else {
        // Si el valor no coincide con el país seleccionado, limpiar
        setDisplayValue('');
      }
    } else {
      setDisplayValue('');
    }
  }, [value, selectedCountry.code]);

  // Cerrar dropdown al hacer click fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };

    if (isDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isDropdownOpen]);

  const handleCountrySelect = (country: typeof COUNTRIES[0]) => {
    // Marcar que el usuario está cambiando el país manualmente
    isUserChangingCountry.current = true;
    
    // Limpiar primero el displayValue y el valor
    setDisplayValue('');
    setPhoneError('');
    onChange('');
    
    // Cambiar el país después
    setSelectedCountry(country);
    setIsDropdownOpen(false);
    
    // Resetear la validación
    onValidationChange?.(true);
    
    // Resetear el flag después de un pequeño delay para que el useEffect no interfiera
    setTimeout(() => {
      isUserChangingCountry.current = false;
    }, 100);
  };

  // Formatear solo los dígitos del número (sin código de país)
  const formatPhoneNumberDigits = (digits: string, country: typeof COUNTRIES[0]): string => {
    if (!digits) return '';
    
    switch (country.code) {
      case 'CL': // Chile: 9 XXXX XXXX
        if (digits.length <= 1) return digits;
        if (digits.length <= 2) return `${digits.slice(0, 1)} ${digits.slice(1)}`;
        if (digits.length <= 6) return `${digits.slice(0, 1)} ${digits.slice(1, 5)} ${digits.slice(5)}`;
        return `${digits.slice(0, 1)} ${digits.slice(1, 5)} ${digits.slice(5, 9)}`;
      
      case 'AR': // Argentina: 9 XXXX XXXX
        if (digits.length <= 1) return digits;
        if (digits.length <= 5) return `${digits.slice(0, 1)} ${digits.slice(1, 5)} ${digits.slice(5)}`;
        return `${digits.slice(0, 1)} ${digits.slice(1, 5)} ${digits.slice(5, 9)}`;
      
      case 'US': // USA: (XXX) XXX-XXXX
        if (digits.length <= 3) return `(${digits}`;
        if (digits.length <= 6) return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
        return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6, 10)}`;
      
      case 'MX': // México: XX XXXX XXXX
        if (digits.length <= 2) return digits;
        if (digits.length <= 6) return `${digits.slice(0, 2)} ${digits.slice(2, 6)} ${digits.slice(6)}`;
        return `${digits.slice(0, 2)} ${digits.slice(2, 6)} ${digits.slice(6, 10)}`;
      
      case 'ES': // España: XXX XXX XXX
        if (digits.length <= 3) return digits;
        if (digits.length <= 6) return `${digits.slice(0, 3)} ${digits.slice(3, 6)} ${digits.slice(6)}`;
        return `${digits.slice(0, 3)} ${digits.slice(3, 6)} ${digits.slice(6, 9)}`;
      
      default:
        // Formato genérico: XXXX XXXX
        if (digits.length <= 4) return digits;
        return `${digits.slice(0, 4)} ${digits.slice(4, 8)}`;
    }
  };

  // Obtener placeholder según el país
  const getPlaceholder = (country: typeof COUNTRIES[0]): string => {
    switch (country.code) {
      case 'CL': return '9 1234 5678';
      case 'AR': return '9 1234 5678';
      case 'US': return '(123) 456-7890';
      case 'MX': return '55 1234 5678';
      case 'ES': return '612 345 678';
      default: return '1234 5678';
    }
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let inputValue = e.target.value;
    
    // Remover todos los caracteres no numéricos
    const digitsOnly = inputValue.replace(/\D/g, '');
    
    // Si no hay dígitos, limpiar todo
    if (digitsOnly === '') {
      setDisplayValue('');
      onChange('');
      setPhoneError('');
      onValidationChange?.(true);
      return;
    }
    
    // Formatear para mostrar en el input
    const formatted = formatPhoneNumberDigits(digitsOnly, selectedCountry);
    setDisplayValue(formatted);
    
    // Guardar el valor completo con código de país para el backend
    const fullValue = selectedCountry.dialCode + digitsOnly;
    onChange(fullValue);
    
    // Validar según el país seleccionado
    const validation = validatePhoneNumberByCountry(fullValue, selectedCountry);
    setPhoneError(validation.error || '');
    onValidationChange?.(validation.isValid, validation.error);
  };
  
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' || e.key === 'Delete') {
      const input = e.currentTarget;
      const cursorPosition = input.selectionStart || 0;
      const currentValue = input.value;
      const digitsInValue = currentValue.replace(/\D/g, '');
      
      // Si solo queda 1 dígito o menos, limpiar todo
      if (digitsInValue.length <= 1) {
        setDisplayValue('');
        onChange('');
        setPhoneError('');
        onValidationChange?.(true);
        e.preventDefault();
        return;
      }
      
      // Si el usuario está borrando un carácter de formateo (espacio, paréntesis, guión)
      // borrar el dígito correspondiente en su lugar
      if (cursorPosition > 0) {
        const charBefore = currentValue[cursorPosition - 1];
        if (charBefore && /\D/.test(charBefore)) {
          // Es un carácter de formateo, encontrar el dígito correspondiente y borrarlo
          const digitsBefore = currentValue.slice(0, cursorPosition).replace(/\D/g, '');
          const digitsAfter = currentValue.slice(cursorPosition).replace(/\D/g, '');
          
          // Borrar el último dígito antes del cursor
          if (digitsBefore.length > 0) {
            const newDigits = digitsBefore.slice(0, -1) + digitsAfter;
            
            if (newDigits === '') {
              setDisplayValue('');
              onChange('');
              setPhoneError('');
              onValidationChange?.(true);
            } else {
              const formatted = formatPhoneNumberDigits(newDigits, selectedCountry);
              setDisplayValue(formatted);
              const fullValue = selectedCountry.dialCode + newDigits;
              onChange(fullValue);
              
              const validation = validatePhoneNumberByCountry(fullValue, selectedCountry);
              setPhoneError(validation.error || '');
              onValidationChange?.(validation.isValid, validation.error);
            }
            e.preventDefault();
            return;
          }
        }
      }
      
      // Si está borrando un dígito normalmente, dejar que el onChange lo maneje
      // pero asegurarse de que el cursor se posicione correctamente
      setTimeout(() => {
        const newValue = input.value;
        const newDigits = newValue.replace(/\D/g, '');
        if (newDigits.length < digitsInValue.length) {
          // Se borró un dígito, ajustar el cursor
          const formatted = formatPhoneNumberDigits(newDigits, selectedCountry);
          const newCursorPos = Math.min(cursorPosition - 1, formatted.length);
          input.setSelectionRange(newCursorPos, newCursorPos);
        }
      }, 0);
    }
  };

  // Validar número según el país seleccionado
  const validatePhoneNumberByCountry = (phone: string, country: typeof COUNTRIES[0]): { isValid: boolean; error?: string } => {
    if (!phone || phone.trim() === '') {
      return { isValid: true }; // Opcional, no requiere validación
    }
    
    // Contar solo dígitos (sin el código de país)
    const cleaned = phone.replace(/\D/g, '');
    const countryDigits = country.dialCode.replace('+', '');
    const numberDigits = cleaned.startsWith(countryDigits) 
      ? cleaned.slice(countryDigits.length)
      : cleaned;
    
    // Mínimo según el país
    if (numberDigits.length < country.minDigits) {
      return {
        isValid: false,
        error: `El número de teléfono debe tener al menos ${country.minDigits} dígitos`
      };
    }
    
    // Máximo según el país
    if (numberDigits.length > country.maxDigits) {
      return {
        isValid: false,
        error: `El número de teléfono no puede tener más de ${country.maxDigits} dígitos para ${country.name}`
      };
    }
    
    return { isValid: true };
  };


  return (
    <div className="relative" style={{ zIndex: isDropdownOpen ? 1000 : 'auto' }}>
      <div className="flex">
        {/* Selector de país */}
        <div className="relative" ref={dropdownRef} style={{ zIndex: 1000 }}>
          <button
            type="button"
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="flex items-center gap-2 px-3 py-2 border border-r-0 border-gray-300 rounded-l-lg bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <span className="text-xl">{selectedCountry.flag}</span>
            <span className="text-sm font-medium text-gray-700">{selectedCountry.dialCode}</span>
            <span className="text-gray-400">▼</span>
          </button>

          {/* Dropdown de países */}
          {isDropdownOpen && (
            <div 
              className="absolute top-full left-0 mt-1 w-64 bg-white border border-gray-300 rounded-lg shadow-xl max-h-80 overflow-y-auto"
              style={{ 
                zIndex: 99999,
              }}
            >
              {COUNTRIES.map((country) => (
                <button
                  key={country.code}
                  type="button"
                  onClick={() => handleCountrySelect(country)}
                  className={`w-full flex items-center gap-3 px-4 py-2 hover:bg-gray-50 transition ${
                    selectedCountry.code === country.code ? 'bg-indigo-50' : ''
                  }`}
                >
                  <span className="text-xl">{country.flag}</span>
                  <span className="flex-1 text-left text-sm font-medium text-gray-700">
                    {country.name}
                  </span>
                  <span className="text-sm text-gray-500">{country.dialCode}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Input de teléfono */}
        <input
          type="tel"
          value={displayValue}
          onChange={handlePhoneChange}
          onKeyDown={handleKeyDown}
          placeholder={placeholder || getPlaceholder(selectedCountry)}
          className={`flex-1 border rounded-r-lg px-3 py-2 focus:outline-none focus:ring-2 ${
            phoneError 
              ? 'border-red-300 focus:ring-red-500' 
              : 'border-gray-300 focus:ring-indigo-500'
          } ${className}`}
        />
      </div>
      
      {phoneError && (
        <p className="mt-1 text-sm text-red-600">{phoneError}</p>
      )}
      <p className="mt-1 text-xs text-gray-500">
        {selectedCountry.minDigits} dígitos requeridos
      </p>
    </div>
  );
};
