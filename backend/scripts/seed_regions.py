"""Viloyat kodlarini bazaga kiritish."""
import sys
import os
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app import create_app
from app.extensions import db
from app.models.plate_region import PlateRegion

# O'zbekiston viloyat kodlari (rasmiy)
REGIONS = [
    ('01', 'Toshkent shahri', 'Город Ташкент'),
    ('10', 'Toshkent viloyati', 'Ташкентская область'),
    ('20', 'Sirdaryo viloyati', 'Сырдарьинская область'),
    ('25', 'Jizzax viloyati', 'Джизакская область'),
    ('30', 'Samarqand viloyati', 'Самаркандская область'),
    ('40', "Farg'ona viloyati", 'Ферганская область'),
    ('50', 'Namangan viloyati', 'Наманганская область'),
    ('60', 'Andijon viloyati', 'Андижанская область'),
    ('70', 'Qashqadaryo viloyati', 'Кашкадарьинская область'),
    ('75', 'Surxondaryo viloyati', 'Сурхандарьинская область'),
    ('80', 'Buxoro viloyati', 'Бухарская область'),
    ('85', 'Navoiy viloyati', 'Навоийская область'),
    ('90', 'Xorazm viloyati', 'Хорезмская область'),
    ('95', "Qoraqalpog'iston Respublikasi", 'Республика Каракалпакстан'),
]


def seed():
    app = create_app()
    with app.app_context():
        for code, name_uz, name_ru in REGIONS:
            existing = db.session.get(PlateRegion, code)
            if not existing:
                region = PlateRegion(code=code, name_uz=name_uz, name_ru=name_ru)
                db.session.add(region)
                print(f"  + {code}: {name_uz}")
            else:
                # Yangilash (agar nomi o'zgargan bo'lsa)
                if existing.name_uz != name_uz or existing.name_ru != name_ru:
                    existing.name_uz = name_uz
                    existing.name_ru = name_ru
                    print(f"  ~ {code}: yangilandi -> {name_uz}")
                else:
                    print(f"  = {code}: {name_uz}")

        # Eski noto'g'ri kodlarni o'chirish (35, 65)
        for old_code in ['35', '65']:
            old = db.session.get(PlateRegion, old_code)
            if old:
                db.session.delete(old)
                print(f"  - {old_code}: o'chirildi (noto'g'ri kod)")

        db.session.commit()
        print(f"\n{len(REGIONS)} ta viloyat kodi muvaffaqiyatli sozlandi!")


if __name__ == '__main__':
    seed()
