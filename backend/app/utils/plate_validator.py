import re

# O'zbekiston avtomobil raqamlari viloyat kodlari (rasmiy)
VALID_REGION_CODES = {
    '01',  # Toshkent shahri
    '10',  # Toshkent viloyati
    '20',  # Sirdaryo viloyati
    '25',  # Jizzax viloyati
    '30',  # Samarqand viloyati
    '40',  # Farg'ona viloyati
    '50',  # Namangan viloyati
    '60',  # Andijon viloyati
    '70',  # Qashqadaryo viloyati
    '75',  # Surxondaryo viloyati
    '80',  # Buxoro viloyati
    '85',  # Navoiy viloyati
    '90',  # Xorazm viloyati
    '95',  # Qoraqalpog'iston Respublikasi
}

PLATE_PATTERN = re.compile(
    r'^(\d{2})\s*([A-Z])\s*(\d{3})\s*([A-Z]{2})$',
    re.IGNORECASE
)


def validate_plate_number(plate_number):
    plate_clean = plate_number.strip().upper()
    match = PLATE_PATTERN.match(plate_clean)

    if not match:
        return None, "Raqam formati noto'g'ri. To'g'ri format: XX A 000 XX"

    region_code = match.group(1)
    letter1 = match.group(2)
    digits = match.group(3)
    letters2 = match.group(4)

    if region_code not in VALID_REGION_CODES:
        return None, f"Noto'g'ri viloyat kodi: {region_code}. Faqat {', '.join(sorted(VALID_REGION_CODES))} kodlari ruxsat etilgan."

    if int(digits) < 1 or int(digits) > 999:
        return None, "Raqam qismi 001-999 oralig'ida bo'lishi kerak"

    formatted = f"{region_code} {letter1} {digits} {letters2}"
    return formatted, None


def get_region_code(plate_number):
    match = PLATE_PATTERN.match(plate_number.strip().upper())
    if match:
        return match.group(1)
    return None
