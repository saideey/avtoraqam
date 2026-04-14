"""Birinchi SuperAdmin foydalanuvchisini yaratish."""
import sys
import os
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app import create_app
from app.extensions import db, bcrypt
from app.models.user import User


def create_superadmin():
    app = create_app()
    with app.app_context():
        phone = os.getenv('SUPERADMIN_PHONE', '+998901234567')
        password = os.getenv('SUPERADMIN_PASSWORD', 'superadmin123')
        name = os.getenv('SUPERADMIN_NAME', 'Super Admin')

        existing = User.query.filter_by(phone_number=phone).first()
        if existing:
            print(f"SuperAdmin allaqachon mavjud: {phone}")
            return

        password_hash = bcrypt.generate_password_hash(password).decode('utf-8')

        superadmin = User(
            phone_number=phone,
            full_name=name,
            password_hash=password_hash,
            role='superadmin',
            is_verified=True,
            is_active=True,
        )
        db.session.add(superadmin)
        db.session.commit()

        print(f"SuperAdmin yaratildi!")
        print(f"  Telefon: {phone}")
        print(f"  Parol: {password}")
        print(f"  MUHIM: Parolni ishga tushirgandan keyin o'zgartiring!")


if __name__ == '__main__':
    create_superadmin()
