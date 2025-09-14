import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Formatear moneda
export function formatCurrency(amount: number, currency: string = 'PEN'): string {
  const symbol = currency === 'USD' ? '$' : 'S/.'
  return `${symbol} ${amount.toLocaleString('es-PE', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })}`
}

// Formatear fecha
export function formatDate(dateString: string): string {
  const date = new Date(dateString)
  return date.toLocaleDateString('es-PE', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  })
}

// Formatear fecha y hora
export function formatDateTime(dateString: string): string {
  const date = new Date(dateString)
  return date.toLocaleString('es-PE', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
}

// Validar RUC
export function validateRUC(ruc: string): boolean {
  if (!ruc || typeof ruc !== 'string') return false

  const rucClean = ruc.replace(/\D/g, '')
  if (rucClean.length !== 11) return false

  // Validar dígito verificador
  const multiplicadores = [5, 4, 3, 2, 7, 6, 5, 4, 3, 2]
  let suma = 0

  for (let i = 0; i < 10; i++) {
    suma += parseInt(rucClean[i]) * multiplicadores[i]
  }

  const resto = suma % 11
  const digitoVerificador = resto < 2 ? resto : 11 - resto

  return parseInt(rucClean[10]) === digitoVerificador
}
