// O'zbekiston avtomobil raqamlari viloyat kodlari (rasmiy)
const VALID_REGIONS = [
  '01', '10', '20', '25', '30', '40', '50', '60', '70', '75', '80', '85', '90', '95'
]

const REGION_NAMES = {
  '01': 'Toshkent shahri',
  '10': 'Toshkent viloyati',
  '20': 'Sirdaryo viloyati',
  '25': 'Jizzax viloyati',
  '30': 'Samarqand viloyati',
  '40': "Farg'ona viloyati",
  '50': 'Namangan viloyati',
  '60': 'Andijon viloyati',
  '70': 'Qashqadaryo viloyati',
  '75': 'Surxondaryo viloyati',
  '80': 'Buxoro viloyati',
  '85': 'Navoiy viloyati',
  '90': 'Xorazm viloyati',
  '95': "Qoraqalpog'iston Respublikasi",
}

export function validatePlateNumber(plate) {
  const cleaned = plate.trim().toUpperCase()
  const match = cleaned.match(/^(\d{2})\s*([A-Z])\s*(\d{3})\s*([A-Z]{2})$/)

  if (!match) return { valid: false, error: "Format: XX A 000 XX" }

  const region = match[1]
  if (!VALID_REGIONS.includes(region)) {
    return { valid: false, error: `Noto'g'ri viloyat kodi: ${region}. Faqat ${VALID_REGIONS.join(', ')} kodlari ruxsat etilgan.` }
  }

  const formatted = `${match[1]} ${match[2]} ${match[3]} ${match[4]}`
  return { valid: true, formatted, region }
}

export function getRegionName(code) {
  return REGION_NAMES[code] || code
}

export { VALID_REGIONS, REGION_NAMES }
