"""Test ma'lumotlarini bazaga kiritish.
Agar DB bo'sh bo'lsa (faqat superadmin mavjud) — 20+ user, 40+ e'lon, takliflar yaratiladi.
"""
import sys
import os
import random
from datetime import datetime, timedelta, timezone

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app import create_app
from app.extensions import db, bcrypt
from app.models.user import User
from app.models.listing import Listing
from app.models.offer import Offer
from app.models.like import Like
from app.models.listing_view import ListingView
from app.models.payment import Payment


# ═══════════════ TEST MA'LUMOTLARI ═══════════════

USERS = [
    ('+998901111111', 'Alisher Ibrogimov', 'test1234'),
    ('+998901111112', 'Bekzod Karimov', 'test1234'),
    ('+998901111113', 'Dilshod Rashidov', 'test1234'),
    ('+998901111114', 'Erkin Tursunov', 'test1234'),
    ('+998901111115', 'Farrux Yusupov', 'test1234'),
    ('+998901111116', 'Gʻofur Ahmadjonov', 'test1234'),
    ('+998901111117', 'Hasan Murodov', 'test1234'),
    ('+998901111118', 'Islom Rahmonov', 'test1234'),
    ('+998901111119', 'Javohir Olimov', 'test1234'),
    ('+998901111120', 'Kamol Nuriddinov', 'test1234'),
    ('+998901111121', 'Lutfullo Xoliqov', 'test1234'),
    ('+998901111122', 'Muzaffar Sodiqov', 'test1234'),
    ('+998901111123', 'Nodir Abdullayev', 'test1234'),
    ('+998901111124', 'Otabek Rasulov', 'test1234'),
    ('+998901111125', 'Parviz Mirzaqulov', 'test1234'),
    ('+998901111126', 'Qahramon Ergashev', 'test1234'),
    ('+998901111127', 'Rustam Qodirov', 'test1234'),
    ('+998901111128', 'Sardor Hamidov', 'test1234'),
    ('+998901111129', 'Timur Yuldashev', 'test1234'),
    ('+998901111130', 'Umid Soliyev', 'test1234'),
    ('+998901111131', "Ulug'bek Azimov", 'test1234'),
    ('+998901111132', 'Vohid Sulaymonov', 'test1234'),
    ('+998901111133', 'Yusuf Tolipov', 'test1234'),
    ('+998901111134', 'Zafar Ismoilov', 'test1234'),
    ('+998901111135', 'Shahzod Mamajonov', 'test1234'),
]

REGIONS = ['01', '10', '20', '25', '30', '40', '50', '60', '70', '75', '80', '85', '90', '95']
LETTERS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H']
SUFFIXES = ['AA', 'BB', 'CC', 'DD', 'AB', 'CD', 'EF', 'GH', 'MN', 'XY', 'PR', 'ST', 'UV', 'WZ']

DESCRIPTIONS = [
    "Chiroyli va eslab qolishga oson raqam",
    "VIP raqam, kollektsiya uchun ajoyib",
    "Biznes uchun mos yaxshi raqam",
    "Premium toifadagi raqam",
    "Sotiladi, shoshiling!",
    "Moslashuvchan narx, chiqishish mumkin",
    "Yangi avtomobil uchun ideal",
    "Tez sotiladi, fursatni boy bermang",
    "Egasi o'zi sotadi, vositachilar bezovta qilmasin",
    None,
    None,
    None,
]

PAYMENT_METHODS = ['click', 'payme', 'paynet']

# Chiroyli VIP raqam patternlari — real bozorda qadrli raqamlar
VIP_DIGIT_PATTERNS = [
    # Bir xil uch raqamli (triples)
    "111", "222", "333", "444", "555", "666", "777", "888", "999", "000",
    # Ketma-ket (sequential)
    "123", "234", "345", "456", "567", "678", "789",
    "321", "432", "543", "654", "765", "876", "987",
    # Yumaloq / muhim sanalar
    "001", "007", "100", "200", "300", "500", "700", "800", "900", "101", "010",
    # Palindrom
    "121", "131", "141", "151", "161", "171", "181", "191", "202", "212",
]

VIP_SUFFIX_PATTERNS = [
    "AA", "BB", "CC", "DD", "EE", "FF", "GG", "HH",
    "AB", "BA", "XX", "ZZ", "MM", "VV", "PP", "SS",
]


def generate_plate(index=0):
    """Chiroyli noyob raqam yaratish.
    Index asosida turli patternlarni ishlatadi — bir xilligi oldini oladi.
    """
    region = random.choice(REGIONS)
    letter = random.choice(LETTERS)
    # Ko'pchilik raqamlar VIP pattern bilan
    digits = random.choice(VIP_DIGIT_PATTERNS)
    suffix = random.choice(VIP_SUFFIX_PATTERNS)
    return f"{region} {letter} {digits} {suffix}"


def generate_price():
    """Real bozorga yaqin narx."""
    ranges = [
        (500_000, 2_000_000),
        (2_000_000, 10_000_000),
        (10_000_000, 50_000_000),
        (50_000_000, 200_000_000),
    ]
    low, high = random.choice(ranges)
    # Yumaloq raqamlar
    price = random.randint(low // 100_000, high // 100_000) * 100_000
    return price


def random_past_date(max_days=60):
    """Tasodifiy o'tgan sana."""
    now = datetime.now(timezone.utc)
    return now - timedelta(
        days=random.randint(0, max_days),
        hours=random.randint(0, 23),
        minutes=random.randint(0, 59),
    )


def seed_test_data():
    app = create_app()

    with app.app_context():
        # Agar foydalanuvchilar ko'p bo'lsa (superadmin dan tashqari) — seed qilmaymiz
        user_count = User.query.count()
        if user_count > 5:
            print(f"DB da allaqachon {user_count} ta foydalanuvchi bor. Seed o'tkazib yuborildi.")
            return

        print("═══ TEST MA'LUMOTLARI KIRITILMOQDA ═══\n")

        # ── 1. Foydalanuvchilar ──
        print("1. Foydalanuvchilar yaratilmoqda...")
        created_users = []
        for phone, name, password in USERS:
            existing = User.query.filter_by(phone_number=phone).first()
            if existing:
                created_users.append(existing)
                continue
            hash_pw = bcrypt.generate_password_hash(password).decode('utf-8')
            user = User(
                phone_number=phone,
                full_name=name,
                password_hash=hash_pw,
                role='user',
                is_verified=True,
                is_active=True,
                created_at=random_past_date(90),
            )
            db.session.add(user)
            created_users.append(user)
        db.session.commit()
        print(f"   ✓ {len(created_users)} ta foydalanuvchi")

        # ── 2. E'lonlar (50 ta) ──
        print("\n2. E'lonlar yaratilmoqda...")
        used_plates = set()
        listings_created = []

        # Active listings (40 ta)
        while len(listings_created) < 40:
            plate = generate_plate()
            if plate in used_plates:
                continue
            used_plates.add(plate)

            seller = random.choice(created_users)
            region_code = plate[:2]
            created = random_past_date(45)
            price = generate_price()

            listing = Listing(
                seller_id=seller.id,
                plate_number=plate,
                region_code=region_code,
                price=price,
                description=random.choice(DESCRIPTIONS),
                status='active',
                views_count=random.randint(5, 500),
                likes_count=0,  # keyin hisoblanadi
                created_at=created,
            )
            db.session.add(listing)
            listings_created.append(listing)
        db.session.commit()

        # Sold listings (7 ta)
        for _ in range(7):
            plate = generate_plate()
            while plate in used_plates:
                plate = generate_plate()
            used_plates.add(plate)

            seller = random.choice(created_users)
            created = random_past_date(45)
            sold = created + timedelta(days=random.randint(1, 10))

            listing = Listing(
                seller_id=seller.id,
                plate_number=plate,
                region_code=plate[:2],
                price=generate_price(),
                description=random.choice(DESCRIPTIONS),
                status='sold',
                views_count=random.randint(50, 1000),
                created_at=created,
                sold_at=sold,
            )
            db.session.add(listing)
            listings_created.append(listing)

        # Cancelled listings (5 ta)
        for _ in range(5):
            plate = generate_plate()
            while plate in used_plates:
                plate = generate_plate()
            used_plates.add(plate)

            seller = random.choice(created_users)
            listing = Listing(
                seller_id=seller.id,
                plate_number=plate,
                region_code=plate[:2],
                price=generate_price(),
                description=random.choice(DESCRIPTIONS),
                status='cancelled',
                views_count=random.randint(5, 100),
                created_at=random_past_date(60),
            )
            db.session.add(listing)
            listings_created.append(listing)

        db.session.commit()
        print(f"   ✓ {len(listings_created)} ta e'lon (40 active, 7 sold, 5 cancelled)")

        # ── 3. To'lovlar (har bir e'lon uchun) ──
        print("\n3. To'lovlar yaratilmoqda...")
        for listing in listings_created:
            payment = Payment(
                user_id=listing.seller_id,
                listing_id=listing.id,
                amount=100000,
                payment_method=random.choice(PAYMENT_METHODS),
                status='completed',
                card_last4=f"{random.randint(1000, 9999)}",
                created_at=listing.created_at,
            )
            db.session.add(payment)
        db.session.commit()
        print(f"   ✓ {len(listings_created)} ta to'lov")

        # ── 4. Takliflar ──
        print("\n4. Takliflar yaratilmoqda...")
        offers_count = 0
        active_listings = [l for l in listings_created if l.status == 'active']
        sold_listings = [l for l in listings_created if l.status == 'sold']

        # Active listinglarga pending takliflar
        for listing in active_listings:
            n_offers = random.randint(0, 4)
            buyers = random.sample(
                [u for u in created_users if u.id != listing.seller_id],
                min(n_offers, len(created_users) - 1)
            )
            for buyer in buyers:
                offer = Offer(
                    listing_id=listing.id,
                    buyer_id=buyer.id,
                    amount=int(listing.price * random.uniform(0.7, 1.0)),
                    message=random.choice([
                        "Kelishamizmi?",
                        "Hali sotilmaganmi?",
                        "Narx yakuniymi?",
                        "Men xarid qilmoqchiman",
                        None, None,
                    ]),
                    status='pending',
                    created_at=listing.created_at + timedelta(days=random.randint(0, 5)),
                )
                db.session.add(offer)
                offers_count += 1

        # Sold listinglarga accepted + rejected takliflar
        for listing in sold_listings:
            # 1 ta accepted
            buyer = random.choice([u for u in created_users if u.id != listing.seller_id])
            offer_accepted = Offer(
                listing_id=listing.id,
                buyer_id=buyer.id,
                amount=listing.price,
                message="Kelishdik, olaman",
                status='accepted',
                created_at=listing.created_at + timedelta(days=1),
                updated_at=listing.sold_at,
            )
            db.session.add(offer_accepted)
            offers_count += 1

            # 2-3 ta rejected
            other_buyers = random.sample(
                [u for u in created_users if u.id != listing.seller_id and u.id != buyer.id],
                random.randint(2, 3)
            )
            for ob in other_buyers:
                offer_rejected = Offer(
                    listing_id=listing.id,
                    buyer_id=ob.id,
                    amount=int(listing.price * random.uniform(0.6, 0.9)),
                    message=random.choice(["Arzonroq bo'lmaydimi?", "Bitta kelishsak?", None]),
                    status='rejected',
                    created_at=listing.created_at + timedelta(days=random.randint(1, 3)),
                    updated_at=listing.sold_at,
                )
                db.session.add(offer_rejected)
                offers_count += 1

        db.session.commit()
        print(f"   ✓ {offers_count} ta taklif (pending, accepted, rejected)")

        # ── 5. Like lar ──
        print("\n5. Like lar yaratilmoqda...")
        likes_count = 0
        for listing in active_listings:
            n_likes = random.randint(0, 15)
            likers = random.sample(
                [u for u in created_users if u.id != listing.seller_id],
                min(n_likes, len(created_users) - 1)
            )
            for liker in likers:
                like = Like(
                    user_id=liker.id,
                    listing_id=listing.id,
                    created_at=listing.created_at + timedelta(hours=random.randint(1, 100)),
                )
                db.session.add(like)
                likes_count += 1

            listing.likes_count = len(likers)
        db.session.commit()
        print(f"   ✓ {likes_count} ta like")

        # ── 6. Ko'rishlar (ListingView) ──
        print("\n6. Ko'rishlar yaratilmoqda...")
        views_count = 0
        for listing in listings_created:
            n_views = min(listing.views_count, 30)  # haqiqiy yozuvlar maksimal 30
            for i in range(n_views):
                view = ListingView(
                    listing_id=listing.id,
                    user_id=random.choice(created_users).id if random.random() > 0.3 else None,
                    ip_address=f"192.168.{random.randint(1,255)}.{random.randint(1,255)}",
                    viewed_at=listing.created_at + timedelta(hours=random.randint(1, 500)),
                )
                db.session.add(view)
                views_count += 1
        db.session.commit()
        print(f"   ✓ {views_count} ta ko'rish yozuvi")

        # ── Xulosa ──
        print("\n" + "═" * 50)
        print("✓ TEST MA'LUMOTLARI MUVAFFAQIYATLI KIRITILDI")
        print("═" * 50)
        print(f"  Foydalanuvchilar:  {len(created_users)}")
        print(f"  E'lonlar:          {len(listings_created)}")
        print(f"    - Aktiv:         {len(active_listings)}")
        print(f"    - Sotilgan:      {len(sold_listings)}")
        print(f"    - Bekor qilingan: 5")
        print(f"  Takliflar:         {offers_count}")
        print(f"  Like lar:          {likes_count}")
        print(f"  Ko'rishlar:        {views_count}")
        print(f"  To'lovlar:         {len(listings_created)} ({len(listings_created) * 100000:,} so'm)")
        print("\n  TEST foydalanuvchi uchun parol: test1234")
        print("  SuperAdmin:  +998901234567 / superadmin_password_change_this")
        print("═" * 50)


if __name__ == '__main__':
    seed_test_data()
