from flask import Blueprint, request, jsonify
from datetime import datetime, timezone
from app.extensions import db
from app.models.listing import Listing
from app.models.listing_view import ListingView
from app.middleware.auth import login_required, optional_auth
from app.middleware.validators import ListingCreateSchema, validate_input
from app.utils.plate_validator import validate_plate_number, get_region_code
from app.utils.pagination import paginate_query
from app.utils.helpers import get_client_ip

listings_bp = Blueprint('listings', __name__)


@listings_bp.route('', methods=['GET'])
@optional_auth
def get_listings(current_user):
    """E'lonlar ro'yxati (filtrlash va saralash bilan)
    ---
    tags:
      - Listings
    parameters:
      - in: query
        name: search
        type: string
        description: Raqam bo'yicha umumiy qidiruv
      - in: query
        name: s_region
        type: string
        description: Region kodi (2 belgi, masalan "01")
      - in: query
        name: s_letter
        type: string
        description: Harf (1 belgi)
      - in: query
        name: s_d1
        type: string
        description: Birinchi raqam
      - in: query
        name: s_d2
        type: string
        description: Ikkinchi raqam
      - in: query
        name: s_d3
        type: string
        description: Uchinchi raqam
      - in: query
        name: s_suffix
        type: string
        description: Suffiks (2 harf)
      - in: query
        name: status
        type: string
        enum: [active, sold, cancelled]
        default: active
      - in: query
        name: region
        type: string
      - in: query
        name: min_price
        type: integer
      - in: query
        name: max_price
        type: integer
      - in: query
        name: sort
        type: string
        enum: [newest, oldest, cheapest, expensive, most_liked, most_viewed]
        default: newest
      - in: query
        name: page
        type: integer
        default: 1
      - in: query
        name: per_page
        type: integer
        default: 20
    responses:
      200:
        description: E'lonlar ro'yxati
        schema:
          type: object
          properties:
            listings:
              type: array
              items:
                type: object
            pagination:
              type: object
    """
    query = Listing.query

    # Raqam bo'yicha qidiruv — umumiy yoki alohida maydonlar
    search = request.args.get('search', '').strip()
    if search:
        clean = search.upper().replace(' ', '')
        query = query.filter(
            db.func.replace(Listing.plate_number, ' ', '').ilike(f'%{clean}%')
        )

    # Alohida belgi bo'yicha qidiruv
    # Plate format: "RR L DDD SS" — har bir belgi alohida qidiriladi
    s_region = request.args.get('s_region', '').strip()
    s_letter = request.args.get('s_letter', '').strip().upper()
    s_d1 = request.args.get('s_d1', '').strip()  # birinchi raqam
    s_d2 = request.args.get('s_d2', '').strip()  # ikkinchi raqam
    s_d3 = request.args.get('s_d3', '').strip()  # uchinchi raqam
    s_suffix = request.args.get('s_suffix', '').strip().upper()

    has_field = s_region or s_letter or s_d1 or s_d2 or s_d3 or s_suffix

    if has_field:
        # Region: 2 belgi
        r1 = s_region[0] if len(s_region) > 0 and s_region[0].isdigit() else '_'
        r2 = s_region[1] if len(s_region) > 1 and s_region[1].isdigit() else '_'

        # Letter: 1 belgi
        l = s_letter[0] if s_letter and s_letter[0].isalpha() else '_'

        # Digits: har biri alohida
        d1 = s_d1[0] if s_d1 and s_d1[0].isdigit() else '_'
        d2 = s_d2[0] if s_d2 and s_d2[0].isdigit() else '_'
        d3 = s_d3[0] if s_d3 and s_d3[0].isdigit() else '_'

        # Suffix: 2 belgi
        x1 = s_suffix[0] if len(s_suffix) > 0 and s_suffix[0].isalpha() else '_'
        x2 = s_suffix[1] if len(s_suffix) > 1 and s_suffix[1].isalpha() else '_'

        pattern = f'{r1}{r2} {l} {d1}{d2}{d3} {x1}{x2}'
        query = query.filter(Listing.plate_number.like(pattern))

    # Filtrlash
    status = request.args.get('status', 'active')
    if status in ('active', 'sold', 'cancelled'):
        query = query.filter(Listing.status == status)

    region = request.args.get('region')
    if region:
        query = query.filter(Listing.region_code == region)

    min_price = request.args.get('min_price', type=int)
    if min_price:
        query = query.filter(Listing.price >= min_price)

    max_price = request.args.get('max_price', type=int)
    if max_price:
        query = query.filter(Listing.price <= max_price)

    # Saralash
    sort = request.args.get('sort', 'newest')
    sort_map = {
        'newest': Listing.created_at.desc(),
        'oldest': Listing.created_at.asc(),
        'cheapest': Listing.price.asc(),
        'expensive': Listing.price.desc(),
        'most_liked': Listing.likes_count.desc(),
        'most_viewed': Listing.views_count.desc(),
    }
    query = query.order_by(sort_map.get(sort, Listing.created_at.desc()))

    result = paginate_query(query)
    user_id = current_user.id if current_user else None

    return jsonify({
        'listings': [item.to_dict(current_user_id=user_id) for item in result['items']],
        'pagination': result['pagination'],
    }), 200


@listings_bp.route('/search', methods=['GET'])
@optional_auth
def search_listings(current_user):
    q = request.args.get('q', '').strip().upper()
    if not q:
        return jsonify({'error': 'Qidiruv so\'zi kiritilmagan'}), 400

    query = Listing.query.filter(
        Listing.status == 'active',
        Listing.plate_number.ilike(f'%{q}%')
    ).order_by(Listing.created_at.desc())

    result = paginate_query(query)
    user_id = current_user.id if current_user else None

    return jsonify({
        'listings': [item.to_dict(current_user_id=user_id) for item in result['items']],
        'pagination': result['pagination'],
    }), 200


@listings_bp.route('', methods=['POST'])
@login_required
def create_listing(current_user):
    """Yangi e'lon yaratish (to'lov bilan)
    ---
    tags:
      - Listings
    description: |
      Yangi e'lon joylashtirish uchun 100,000 so'm to'lov talab qilinadi.

      **MOBIL APP UCHUN TO'LOV JARAYONI (TEST REJIMI):**

      1. Foydalanuvchi to'lov usulini tanlaydi: **click**, **payme**, yoki **paynet**
      2. Karta raqami kiritadi (istalgan 16 xonali raqam, test uchun: `8600 1234 5678 9012`)
      3. Amal qilish muddati (istalgan MM/YY, masalan `12/28`)
      4. SMS tasdiqlash kodi — **test uchun har doim `1234`**
      5. Tasdiqlangach, bu API chaqiriladi — `payment_method` va `card_last4` yuboriladi
      6. Server Payment yozuvini yaratadi va e'lonni active qiladi

      **E'lon formati:** `XX L NNN LL` (masalan `01 A 123 AB`)
      Mavjud viloyat kodlari: 01, 10, 20, 25, 30, 40, 50, 60, 70, 75, 80, 85, 90, 95
    security:
      - Bearer: []
    parameters:
      - in: body
        name: body
        required: true
        schema:
          type: object
          required:
            - plate_number
            - price
            - payment_method
          properties:
            plate_number:
              type: string
              description: "O'zbekiston raqam formati: XX L NNN LL"
              example: "01 A 123 AB"
            price:
              type: integer
              description: "Narx so'mda (minimal 1000)"
              example: 5000000
            description:
              type: string
              description: "Ixtiyoriy tavsif (500 belgigacha)"
              example: "Chiroyli raqam sotiladi"
            payment_method:
              type: string
              description: "To'lov usuli"
              enum: [click, payme, paynet]
              example: "click"
            card_last4:
              type: string
              description: "Karta raqamining oxirgi 4 xonasi"
              example: "9012"
              minLength: 4
              maxLength: 4
    responses:
      201:
        description: E'lon va to'lov muvaffaqiyatli yaratildi
        schema:
          type: object
          properties:
            message:
              type: string
              example: "E'lon muvaffaqiyatli yaratildi"
            listing:
              type: object
      400:
        description: Validatsiya xatosi yoki noto'g'ri raqam formati
      409:
        description: Bu raqam allaqachon aktiv e'londa mavjud
      401:
        description: Token yaroqsiz
    """
    data, errors = validate_input(ListingCreateSchema, request.get_json())
    if errors:
        return jsonify({'errors': errors}), 400

    plate_formatted, error = validate_plate_number(data['plate_number'])
    if error:
        return jsonify({'error': error}), 400

    # Dublikat tekshiruvi
    existing = Listing.query.filter_by(
        plate_number=plate_formatted, status='active'
    ).first()
    if existing:
        return jsonify({'error': 'Bu raqam allaqachon aktiv e\'londa mavjud'}), 409

    region_code = get_region_code(plate_formatted)

    listing = Listing(
        seller_id=current_user.id,
        plate_number=plate_formatted,
        region_code=region_code,
        price=data['price'],
        description=data.get('description'),
    )
    db.session.add(listing)
    db.session.flush()  # listing.id ni olish uchun

    # To'lov yozuvini yaratish
    payment_method = data.get('payment_method', 'click')
    card_last4 = data.get('card_last4', '')
    from app.models.payment import Payment
    payment = Payment(
        user_id=current_user.id,
        listing_id=listing.id,
        amount=100000,  # E'lon joylashtirish narxi
        payment_method=payment_method,
        status='completed',
        card_last4=card_last4[-4:] if card_last4 else '',
    )
    db.session.add(payment)
    db.session.commit()

    return jsonify({
        'message': 'E\'lon muvaffaqiyatli yaratildi',
        'listing': listing.to_dict(),
    }), 201


@listings_bp.route('/<int:listing_id>', methods=['GET'])
@optional_auth
def get_listing(current_user, listing_id):
    """E'lon tafsilotlari
    ---
    tags:
      - Listings
    parameters:
      - in: path
        name: listing_id
        type: integer
        required: true
    responses:
      200:
        description: E'lon ma'lumotlari
        schema:
          type: object
          properties:
            listing:
              type: object
      404:
        description: E'lon topilmadi
    """
    listing = Listing.query.get_or_404(listing_id)

    # Ko'rishlar sonini har safar oshirish
    ip = get_client_ip()
    try:
        view = ListingView(
            listing_id=listing_id,
            user_id=current_user.id if current_user else None,
            ip_address=ip,
        )
        db.session.add(view)
        listing.views_count += 1
        db.session.commit()
    except Exception:
        db.session.rollback()
        # Unique constraint bo'lsa — faqat counter ni oshiramiz
        listing.views_count += 1
        db.session.commit()

    user_id = current_user.id if current_user else None
    return jsonify({'listing': listing.to_dict(current_user_id=user_id)}), 200


@listings_bp.route('/<int:listing_id>', methods=['PUT'])
@login_required
def update_listing(current_user, listing_id):
    """E'lonni yangilash
    ---
    tags:
      - Listings
    security:
      - Bearer: []
    parameters:
      - in: path
        name: listing_id
        type: integer
        required: true
      - in: body
        name: body
        schema:
          type: object
          properties:
            plate_number:
              type: string
            price:
              type: integer
            description:
              type: string
    responses:
      200:
        description: E'lon yangilandi
      400:
        description: Validatsiya xatosi
      403:
        description: Ruxsat yo'q
      404:
        description: E'lon topilmadi
      409:
        description: Raqam dublikati
    """
    listing = Listing.query.get_or_404(listing_id)

    if listing.seller_id != current_user.id and current_user.role not in ('admin', 'superadmin'):
        return jsonify({'error': 'Ruxsat yo\'q'}), 403

    data = request.get_json()

    if 'plate_number' in data:
        plate_formatted, error = validate_plate_number(data['plate_number'])
        if error:
            return jsonify({'error': error}), 400
        existing = Listing.query.filter(
            Listing.plate_number == plate_formatted,
            Listing.status == 'active',
            Listing.id != listing_id
        ).first()
        if existing:
            return jsonify({'error': 'Bu raqam allaqachon aktiv e\'londa mavjud'}), 409
        listing.plate_number = plate_formatted
        listing.region_code = get_region_code(plate_formatted)

    if 'price' in data:
        if data['price'] < 1000:
            return jsonify({'error': 'Narx kamida 1000 so\'m bo\'lishi kerak'}), 400
        listing.price = data['price']

    if 'description' in data:
        if len(data['description']) > 500:
            return jsonify({'error': 'Tavsif 500 belgidan oshmasligi kerak'}), 400
        listing.description = data['description']

    listing.updated_at = datetime.now(timezone.utc)
    db.session.commit()

    return jsonify({
        'message': 'E\'lon yangilandi',
        'listing': listing.to_dict(),
    }), 200


@listings_bp.route('/<int:listing_id>', methods=['DELETE'])
@login_required
def delete_listing(current_user, listing_id):
    """E'lonni o'chirish (bekor qilish)
    ---
    tags:
      - Listings
    security:
      - Bearer: []
    parameters:
      - in: path
        name: listing_id
        type: integer
        required: true
    responses:
      200:
        description: E'lon o'chirildi
      403:
        description: Ruxsat yo'q
      404:
        description: E'lon topilmadi
    """
    listing = Listing.query.get_or_404(listing_id)

    if listing.seller_id != current_user.id and current_user.role not in ('admin', 'superadmin'):
        return jsonify({'error': 'Ruxsat yo\'q'}), 403

    listing.status = 'cancelled'
    listing.updated_at = datetime.now(timezone.utc)
    db.session.commit()

    return jsonify({'message': 'E\'lon o\'chirildi'}), 200


@listings_bp.route('/my', methods=['GET'])
@login_required
def my_listings(current_user):
    """Mening e'lonlarim
    ---
    tags:
      - Listings
    security:
      - Bearer: []
    parameters:
      - in: query
        name: page
        type: integer
        default: 1
      - in: query
        name: per_page
        type: integer
        default: 20
    responses:
      200:
        description: Foydalanuvchining e'lonlari
        schema:
          type: object
          properties:
            listings:
              type: array
              items:
                type: object
            pagination:
              type: object
    """
    query = Listing.query.filter_by(seller_id=current_user.id).order_by(Listing.created_at.desc())
    result = paginate_query(query)

    return jsonify({
        'listings': [item.to_dict(current_user_id=current_user.id) for item in result['items']],
        'pagination': result['pagination'],
    }), 200


@listings_bp.route('/<int:listing_id>/offers', methods=['GET'])
@login_required
def listing_offers(current_user, listing_id):
    """E'longa yuborilgan takliflar (faqat sotuvchi uchun)
    ---
    tags:
      - Listings
    security:
      - Bearer: []
    parameters:
      - in: path
        name: listing_id
        type: integer
        required: true
    responses:
      200:
        description: Takliflar ro'yxati
        schema:
          type: object
          properties:
            offers:
              type: array
              items:
                type: object
      403:
        description: Ruxsat yo'q
      404:
        description: E'lon topilmadi
    """
    listing = Listing.query.get_or_404(listing_id)

    if listing.seller_id != current_user.id and current_user.role not in ('admin', 'superadmin'):
        return jsonify({'error': 'Ruxsat yo\'q'}), 403

    offers = listing.offers.order_by(db.text('created_at DESC')).all()
    return jsonify({
        'offers': [o.to_dict() for o in offers],
    }), 200
