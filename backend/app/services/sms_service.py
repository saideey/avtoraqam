# SMS service hozircha o'chirilgan
# Redis va SMS API qo'shilganda qayta yoqiladi
from flask import current_app

# In-memory OTP saqlash (faqat development uchun)
_otp_store = {}


def generate_otp():
    # Test mode: always return "1234"
    return "1234"


def send_otp(phone_number):
    otp = generate_otp()
    _otp_store[phone_number] = otp
    current_app.logger.info(f"OTP for {phone_number}: {otp}")
    return True, "OTP yuborildi"


def verify_otp(phone_number, otp):
    stored_otp = _otp_store.get(phone_number)
    if not stored_otp:
        return False, "OTP muddati tugagan yoki yuborilmagan"

    if stored_otp != otp:
        return False, "Noto'g'ri OTP"

    del _otp_store[phone_number]
    return True, "OTP tasdiqlandi"
