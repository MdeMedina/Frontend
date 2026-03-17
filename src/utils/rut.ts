/**
 * Utilidades para formatear y validar RUT chileno
 * Formato: XX.XXX.XXX-K
 */

/**
 * Limpia el RUT, removiendo puntos, guiones y espacios
 */
export function cleanRut(rut: string): string {
  return rut.replace(/[.\-\s]/g, '').toUpperCase();
}

/**
 * Formatea un RUT con puntos y guión
 * Ejemplo: 123456789 -> 12.345.678-9
 */
export function formatRut(rut: string): string {
  // Limpiar el RUT primero
  const cleaned = cleanRut(rut);

  if (!cleaned) return '';

  // Separar el dígito verificador del resto
  const body = cleaned.slice(0, -1);
  const dv = cleaned.slice(-1);

  if (!body) return cleaned;

  // Formatear el cuerpo con puntos cada 3 dígitos desde la derecha
  const formattedBody = body.replace(/\B(?=(\d{3})+(?!\d))/g, '.');

  // Retornar con guión antes del dígito verificador
  return `${formattedBody}-${dv}`;
}

/**
 * Valida el formato básico del RUT (debe tener al menos 8 caracteres y terminar con dígito verificador)
 */
export function isValidRutFormat(rut: string): boolean {
  const cleaned = cleanRut(rut);

  // Debe tener al menos 7 dígitos + 1 dígito verificador = 8 caracteres mínimo
  if (cleaned.length < 8) return false;

  // El cuerpo debe ser solo números
  const body = cleaned.slice(0, -1);
  if (!/^\d+$/.test(body)) return false;

  // El dígito verificador debe ser 0-9 o K
  const dv = cleaned.slice(-1);
  if (!/^[0-9K]$/.test(dv)) return false;

  return true;
}

/**
 * Calcula el dígito verificador de un RUT
 */
function calculateDv(rut: string): string {
  let sum = 0;
  let multiplier = 2;

  // Recorrer el RUT de derecha a izquierda
  for (let i = rut.length - 1; i >= 0; i--) {
    sum += parseInt(rut[i]) * multiplier;
    multiplier = multiplier === 7 ? 2 : multiplier + 1;
  }

  const remainder = sum % 11;
  const dv = 11 - remainder;

  if (dv === 11) return '0';
  if (dv === 10) return 'K';
  return dv.toString();
}

/**
 * Valida el RUT completo (formato y dígito verificador)
 */
export function validateRut(rut: string): boolean {
  const cleaned = cleanRut(rut);

  if (!isValidRutFormat(cleaned)) return false;

  const body = cleaned.slice(0, -1);
  const dv = cleaned.slice(-1);
  const calculatedDv = calculateDv(body);

  return dv === calculatedDv;
}

/**
 * Maneja el cambio de input de RUT, formateando automáticamente
 */
export function handleRutInput(value: string): string {
  // Limpiar el valor ingresado
  const cleaned = cleanRut(value);

  if (!cleaned) return '';

  // Limitar a 9 caracteres (8 dígitos + 1 dígito verificador)
  // Si el usuario pega un RUT largo, cortamos
  const maxLength = 9;
  const truncated = cleaned.slice(0, maxLength);

  // Formatear
  return formatRut(truncated);
}
