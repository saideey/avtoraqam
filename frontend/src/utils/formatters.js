import { format, formatDistanceToNow } from 'date-fns'
import { uz } from 'date-fns/locale'

export function formatPrice(price) {
  return new Intl.NumberFormat('uz-UZ').format(price) + " so'm"
}

export function formatDate(dateStr) {
  if (!dateStr) return ''
  return format(new Date(dateStr), 'dd.MM.yyyy HH:mm')
}

export function formatRelativeDate(dateStr) {
  if (!dateStr) return ''
  return formatDistanceToNow(new Date(dateStr), { addSuffix: true, locale: uz })
}

export function formatPhone(phone) {
  if (!phone) return ''
  // +998901234567 -> +998 (90) 123-45-67
  const cleaned = phone.replace(/\D/g, '')
  if (cleaned.length === 12) {
    return `+${cleaned.slice(0, 3)} (${cleaned.slice(3, 5)}) ${cleaned.slice(5, 8)}-${cleaned.slice(8, 10)}-${cleaned.slice(10)}`
  }
  return phone
}
