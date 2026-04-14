import csv
import io
from flask import Blueprint, request, jsonify, Response
from app.extensions import db
from app.models.user import User
from app.models.listing import Listing
from app.models.offer import Offer
from app.models.admin_log import AdminLog
from app.models.plate_region import PlateRegion
from app.models.payment import Payment
from app.middleware.auth import admin_required, superadmin_required
from app.utils.pagination import paginate_query
from app.utils.helpers import get_client_ip

admin_bp = Blueprint('admin', __name__)


def log_admin_action(admin, action, target_type=None, target_id=None, details=None):
    log = AdminLog(
        admin_id=admin.id,
        action=action,
        target_type=target_type,
        target_id=target_id,
        details=details,
        ip_address=get_client_ip(),
    )
    db.session.add(log)
    db.session.commit()


@admin_bp.route('/users', methods=['GET'])
@admin_required
def get_users(current_user):
    """Foydalanuvchilar ro'yxati
    ---
    tags:
      - Admin
    description: Filtrlash va paginatsiya bilan foydalanuvchilar ro'yxatini olish
    security:
      - Bearer: []
    parameters:
      - in: query
        name: search
        type: string
        description: Ism yoki telefon bo'yicha qidiruv
      - in: query
        name: role
        type: string
        enum: [user, admin, superadmin]
        description: Rol bo'yicha filtr
      - in: query
        name: is_active
        type: string
        enum: ["true", "false"]
        description: Faollik holati bo'yicha filtr
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
        description: Foydalanuvchilar ro'yxati
        schema:
          type: object
          properties:
            users:
              type: array
              items:
                type: object
            pagination:
              type: object
      401:
        description: Avtorizatsiya talab qilinadi
      403:
        description: Admin huquqi talab qilinadi
    """
    query = User.query

    search = request.args.get('search', '').strip()
    if search:
        query = query.filter(
            db.or_(
                User.full_name.ilike(f'%{search}%'),
                User.phone_number.ilike(f'%{search}%')
            )
        )

    role = request.args.get('role')
    if role in ('user', 'admin', 'superadmin'):
        query = query.filter(User.role == role)

    is_active = request.args.get('is_active')
    if is_active is not None:
        query = query.filter(User.is_active == (is_active == 'true'))

    query = query.order_by(User.created_at.desc())
    result = paginate_query(query)

    return jsonify({
        'users': [u.to_dict(include_private=True) for u in result['items']],
        'pagination': result['pagination'],
    }), 200


@admin_bp.route('/users/<int:user_id>', methods=['GET'])
@admin_required
def get_user(current_user, user_id):
    """Foydalanuvchi ma'lumotlari
    ---
    tags:
      - Admin
    description: Foydalanuvchi haqida batafsil ma'lumot (e'lonlar, takliflar, like'lar soni bilan)
    security:
      - Bearer: []
    parameters:
      - in: path
        name: user_id
        type: integer
        required: true
    responses:
      200:
        description: Foydalanuvchi ma'lumotlari
        schema:
          type: object
          properties:
            user:
              type: object
      401:
        description: Avtorizatsiya talab qilinadi
      403:
        description: Admin huquqi talab qilinadi
      404:
        description: Foydalanuvchi topilmadi
    """
    user = User.query.get_or_404(user_id)

    listings_count = Listing.query.filter_by(seller_id=user_id).count()
    offers_count = Offer.query.filter_by(buyer_id=user_id).count()
    from app.models.like import Like
    likes_count = Like.query.filter_by(user_id=user_id).count()

    data = user.to_dict(include_private=True)
    data['listings_count'] = listings_count
    data['offers_count'] = offers_count
    data['likes_count'] = likes_count

    return jsonify({'user': data}), 200


@admin_bp.route('/users/<int:user_id>/ban', methods=['PUT'])
@admin_required
def ban_user(current_user, user_id):
    """Foydalanuvchini bloklash
    ---
    tags:
      - Admin
    description: Foydalanuvchini bloklash. Admin/SuperAdmin ni faqat SuperAdmin bloklay oladi.
    security:
      - Bearer: []
    parameters:
      - in: path
        name: user_id
        type: integer
        required: true
    responses:
      200:
        description: Foydalanuvchi bloklandi
      401:
        description: Avtorizatsiya talab qilinadi
      403:
        description: Huquq yetarli emas
      404:
        description: Foydalanuvchi topilmadi
    """
    user = User.query.get_or_404(user_id)

    if user.role in ('admin', 'superadmin') and current_user.role != 'superadmin':
        return jsonify({'error': 'Admin/SuperAdmin ni faqat SuperAdmin bloklashi mumkin'}), 403

    user.is_active = False
    db.session.commit()

    log_admin_action(current_user, 'user_ban', 'user', user_id)

    return jsonify({'message': 'Foydalanuvchi bloklandi'}), 200


@admin_bp.route('/users/<int:user_id>/unban', methods=['PUT'])
@admin_required
def unban_user(current_user, user_id):
    """Foydalanuvchini blokdan chiqarish
    ---
    tags:
      - Admin
    description: Bloklangan foydalanuvchini qayta faollashtirish
    security:
      - Bearer: []
    parameters:
      - in: path
        name: user_id
        type: integer
        required: true
    responses:
      200:
        description: Foydalanuvchi blokdan chiqarildi
      401:
        description: Avtorizatsiya talab qilinadi
      403:
        description: Admin huquqi talab qilinadi
      404:
        description: Foydalanuvchi topilmadi
    """
    user = User.query.get_or_404(user_id)
    user.is_active = True
    db.session.commit()

    log_admin_action(current_user, 'user_unban', 'user', user_id)

    return jsonify({'message': 'Foydalanuvchi blokdan chiqarildi'}), 200


@admin_bp.route('/users/<int:user_id>/role', methods=['PUT'])
@superadmin_required
def change_role(current_user, user_id):
    """Foydalanuvchi rolini o'zgartirish
    ---
    tags:
      - Admin
    description: Faqat SuperAdmin uchun. Foydalanuvchi rolini user yoki admin ga o'zgartiradi.
    security:
      - Bearer: []
    parameters:
      - in: path
        name: user_id
        type: integer
        required: true
      - in: body
        name: body
        required: true
        schema:
          type: object
          required: [role]
          properties:
            role:
              type: string
              enum: [user, admin]
    responses:
      200:
        description: Rol o'zgartirildi
      400:
        description: Noto'g'ri rol
      401:
        description: Avtorizatsiya talab qilinadi
      403:
        description: SuperAdmin huquqi talab qilinadi
      404:
        description: Foydalanuvchi topilmadi
    """
    user = User.query.get_or_404(user_id)
    data = request.get_json()
    new_role = data.get('role')

    if new_role not in ('user', 'admin'):
        return jsonify({'error': 'Ruxsat etilgan rollar: user, admin'}), 400

    old_role = user.role
    user.role = new_role
    db.session.commit()

    log_admin_action(
        current_user, 'role_change', 'user', user_id,
        {'old_role': old_role, 'new_role': new_role}
    )

    return jsonify({'message': f'Rol o\'zgartirildi: {new_role}'}), 200


@admin_bp.route('/listings', methods=['GET'])
@admin_required
def admin_listings(current_user):
    """E'lonlar ro'yxati (admin)
    ---
    tags:
      - Admin
    description: Status bo'yicha filtrlab e'lonlarni ko'rish
    security:
      - Bearer: []
    parameters:
      - in: query
        name: status
        type: string
        enum: [active, sold, cancelled]
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
      401:
        description: Avtorizatsiya talab qilinadi
      403:
        description: Admin huquqi talab qilinadi
    """
    query = Listing.query

    status = request.args.get('status')
    if status in ('active', 'sold', 'cancelled'):
        query = query.filter(Listing.status == status)

    query = query.order_by(Listing.created_at.desc())
    result = paginate_query(query)

    return jsonify({
        'listings': [l.to_dict() for l in result['items']],
        'pagination': result['pagination'],
    }), 200


@admin_bp.route('/listings/<int:listing_id>', methods=['DELETE'])
@admin_required
def admin_delete_listing(current_user, listing_id):
    """E'lonni o'chirish (admin)
    ---
    tags:
      - Admin
    description: E'lon statusini cancelled ga o'zgartiradi
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
      401:
        description: Avtorizatsiya talab qilinadi
      403:
        description: Admin huquqi talab qilinadi
      404:
        description: E'lon topilmadi
    """
    listing = Listing.query.get_or_404(listing_id)
    listing.status = 'cancelled'
    db.session.commit()

    log_admin_action(current_user, 'listing_delete', 'listing', listing_id)

    return jsonify({'message': 'E\'lon o\'chirildi'}), 200


@admin_bp.route('/offers', methods=['GET'])
@admin_required
def admin_offers(current_user):
    """Takliflar ro'yxati (admin)
    ---
    tags:
      - Admin
    description: Status bo'yicha filtrlab takliflarni ko'rish
    security:
      - Bearer: []
    parameters:
      - in: query
        name: status
        type: string
        enum: [pending, accepted, rejected, cancelled]
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
        description: Takliflar ro'yxati
        schema:
          type: object
          properties:
            offers:
              type: array
              items:
                type: object
            pagination:
              type: object
      401:
        description: Avtorizatsiya talab qilinadi
      403:
        description: Admin huquqi talab qilinadi
    """
    query = Offer.query

    status = request.args.get('status')
    if status in ('pending', 'accepted', 'rejected', 'cancelled'):
        query = query.filter(Offer.status == status)

    query = query.order_by(Offer.created_at.desc())
    result = paginate_query(query)

    return jsonify({
        'offers': [o.to_dict() for o in result['items']],
        'pagination': result['pagination'],
    }), 200


@admin_bp.route('/export/users', methods=['GET'])
@superadmin_required
def export_users(current_user):
    """Foydalanuvchilarni CSV ga eksport qilish
    ---
    tags:
      - Admin
    description: Faqat SuperAdmin uchun. Barcha foydalanuvchilarni CSV formatda yuklab olish.
    security:
      - Bearer: []
    produces:
      - text/csv
    responses:
      200:
        description: CSV fayl
        schema:
          type: file
      401:
        description: Avtorizatsiya talab qilinadi
      403:
        description: SuperAdmin huquqi talab qilinadi
    """
    users = User.query.all()

    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(['ID', 'Ism', 'Telefon', 'Rol', 'Tasdiqlangan', 'Faol', 'Yaratilgan'])

    for u in users:
        writer.writerow([
            u.id, u.full_name, u.phone_number, u.role,
            u.is_verified, u.is_active,
            u.created_at.isoformat() if u.created_at else ''
        ])

    log_admin_action(current_user, 'export_users')

    return Response(
        output.getvalue(),
        mimetype='text/csv',
        headers={'Content-Disposition': 'attachment; filename=users.csv'}
    )


@admin_bp.route('/export/listings', methods=['GET'])
@superadmin_required
def export_listings(current_user):
    """E'lonlarni CSV ga eksport qilish
    ---
    tags:
      - Admin
    description: Faqat SuperAdmin uchun. Barcha e'lonlarni CSV formatda yuklab olish.
    security:
      - Bearer: []
    produces:
      - text/csv
    responses:
      200:
        description: CSV fayl
        schema:
          type: file
      401:
        description: Avtorizatsiya talab qilinadi
      403:
        description: SuperAdmin huquqi talab qilinadi
    """
    listings = Listing.query.all()

    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(['ID', 'Raqam', 'Viloyat', 'Narx', 'Holat', 'Ko\'rishlar', 'Like', 'Yaratilgan'])

    for l in listings:
        writer.writerow([
            l.id, l.plate_number, l.region_code, l.price,
            l.status, l.views_count, l.likes_count,
            l.created_at.isoformat() if l.created_at else ''
        ])

    log_admin_action(current_user, 'export_listings')

    return Response(
        output.getvalue(),
        mimetype='text/csv',
        headers={'Content-Disposition': 'attachment; filename=listings.csv'}
    )


@admin_bp.route('/regions', methods=['GET'])
@admin_required
def get_regions(current_user):
    """Viloyatlar ro'yxati
    ---
    tags:
      - Admin
    description: Har bir viloyat bo'yicha aktiv e'lonlar soni bilan
    security:
      - Bearer: []
    responses:
      200:
        description: Viloyatlar ro'yxati
        schema:
          type: object
          properties:
            regions:
              type: array
              items:
                type: object
                properties:
                  code:
                    type: string
                  name:
                    type: string
                  listings_count:
                    type: integer
      401:
        description: Avtorizatsiya talab qilinadi
      403:
        description: Admin huquqi talab qilinadi
    """
    regions = PlateRegion.query.order_by(PlateRegion.code).all()

    result = []
    for region in regions:
        listings_count = Listing.query.filter_by(
            region_code=region.code, status='active'
        ).count()
        data = region.to_dict()
        data['listings_count'] = listings_count
        result.append(data)

    return jsonify({'regions': result}), 200


@admin_bp.route('/logs', methods=['GET'])
@superadmin_required
def get_logs(current_user):
    """Audit jurnali
    ---
    tags:
      - Admin
    description: Faqat SuperAdmin uchun. Admin harakatlari jurnalini ko'rish.
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
        description: Audit jurnali
        schema:
          type: object
          properties:
            logs:
              type: array
              items:
                type: object
            pagination:
              type: object
      401:
        description: Avtorizatsiya talab qilinadi
      403:
        description: SuperAdmin huquqi talab qilinadi
    """
    query = AdminLog.query.order_by(AdminLog.created_at.desc())
    result = paginate_query(query)

    return jsonify({
        'logs': [l.to_dict() for l in result['items']],
        'pagination': result['pagination'],
    }), 200


# ══════════════ TO'LOVLAR HISOBOTI ══════════════

@admin_bp.route('/payments', methods=['GET'])
@superadmin_required
def get_payments(current_user):
    """To'lovlar ro'yxati
    ---
    tags:
      - Admin
    description: Faqat SuperAdmin uchun. Filtrlash va paginatsiya bilan to'lovlar.
    security:
      - Bearer: []
    parameters:
      - in: query
        name: from
        type: string
        format: date
        description: "Boshlanish sanasi (YYYY-MM-DD)"
      - in: query
        name: to
        type: string
        format: date
        description: "Tugash sanasi"
      - in: query
        name: method
        type: string
        enum: [click, payme, paynet]
      - in: query
        name: user_id
        type: integer
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
        description: To'lovlar ro'yxati
        schema:
          type: object
          properties:
            payments:
              type: array
              items:
                type: object
            pagination:
              type: object
      401:
        description: Avtorizatsiya talab qilinadi
      403:
        description: SuperAdmin huquqi talab qilinadi
    """
    from sqlalchemy import func
    from datetime import datetime, timezone

    query = Payment.query

    # Sana oralig'i filtri
    date_from = request.args.get('from')
    date_to = request.args.get('to')
    if date_from:
        query = query.filter(Payment.created_at >= datetime.fromisoformat(date_from))
    if date_to:
        query = query.filter(Payment.created_at <= datetime.fromisoformat(date_to) if 'T' in date_to
                              else Payment.created_at < datetime.fromisoformat(date_to + 'T23:59:59'))

    # To'lov usuli filtri
    method = request.args.get('method')
    if method and method in ('click', 'payme', 'paynet'):
        query = query.filter(Payment.payment_method == method)

    # User filtri
    user_id = request.args.get('user_id', type=int)
    if user_id:
        query = query.filter(Payment.user_id == user_id)

    query = query.order_by(Payment.created_at.desc())
    result = paginate_query(query)

    return jsonify({
        'payments': [p.to_dict() for p in result['items']],
        'pagination': result['pagination'],
    }), 200


@admin_bp.route('/payments/stats', methods=['GET'])
@superadmin_required
def payment_stats(current_user):
    """To'lov statistikasi
    ---
    tags:
      - Admin
    description: Faqat SuperAdmin uchun. Umumiy, kunlik, soatlik to'lov statistikasi va top to'lovchilar.
    security:
      - Bearer: []
    parameters:
      - in: query
        name: from
        type: string
        format: date
        description: "Boshlanish sanasi (YYYY-MM-DD)"
      - in: query
        name: to
        type: string
        format: date
        description: "Tugash sanasi"
    responses:
      200:
        description: To'lov statistikasi
        schema:
          type: object
          properties:
            total_revenue:
              type: integer
              example: 500000
            total_count:
              type: integer
            today_revenue:
              type: integer
            today_count:
              type: integer
            by_method:
              type: array
              items:
                type: object
                properties:
                  method:
                    type: string
                  count:
                    type: integer
                  total:
                    type: integer
            daily:
              type: array
            hourly:
              type: array
            top_users:
              type: array
      401:
        description: Avtorizatsiya talab qilinadi
      403:
        description: SuperAdmin huquqi talab qilinadi
    """
    from sqlalchemy import func
    from datetime import datetime, timedelta, timezone

    now = datetime.now(timezone.utc)
    today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)

    # Sana oralig'i
    date_from = request.args.get('from')
    date_to = request.args.get('to')

    base_q = Payment.query.filter(Payment.status == 'completed')
    if date_from:
        base_q = base_q.filter(Payment.created_at >= datetime.fromisoformat(date_from))
    if date_to:
        base_q = base_q.filter(Payment.created_at <= datetime.fromisoformat(date_to) if 'T' in date_to
                                else Payment.created_at < datetime.fromisoformat(date_to + 'T23:59:59'))

    # Umumiy
    total_revenue = base_q.with_entities(func.sum(Payment.amount)).scalar() or 0
    total_count = base_q.count()
    today_revenue = Payment.query.filter(
        Payment.status == 'completed', Payment.created_at >= today_start
    ).with_entities(func.sum(Payment.amount)).scalar() or 0
    today_count = Payment.query.filter(
        Payment.status == 'completed', Payment.created_at >= today_start
    ).count()

    # To'lov usuli bo'yicha
    by_method = db.session.query(
        Payment.payment_method,
        func.count(Payment.id).label('count'),
        func.sum(Payment.amount).label('total')
    ).filter(Payment.status == 'completed')
    if date_from:
        by_method = by_method.filter(Payment.created_at >= datetime.fromisoformat(date_from))
    if date_to:
        by_method = by_method.filter(Payment.created_at <= datetime.fromisoformat(date_to) if 'T' in date_to
                                      else Payment.created_at < datetime.fromisoformat(date_to + 'T23:59:59'))
    by_method = by_method.group_by(Payment.payment_method).all()

    methods = [{'method': r.payment_method, 'count': r.count, 'total': int(r.total or 0)} for r in by_method]

    # Kunlik daromad (oxirgi 30 kun)
    daily = db.session.query(
        func.date(Payment.created_at).label('date'),
        func.count(Payment.id).label('count'),
        func.sum(Payment.amount).label('total')
    ).filter(
        Payment.status == 'completed',
        Payment.created_at >= now - timedelta(days=30)
    ).group_by(func.date(Payment.created_at)).order_by('date').all()

    daily_data = [{'date': str(r.date), 'count': r.count, 'total': int(r.total or 0)} for r in daily]

    # Soatlik taqsimot (bugun)
    hourly = db.session.query(
        func.extract('hour', Payment.created_at).label('hour'),
        func.count(Payment.id).label('count')
    ).filter(
        Payment.status == 'completed',
        Payment.created_at >= today_start
    ).group_by('hour').all()

    hourly_data = [{'hour': int(r.hour), 'count': r.count} for r in hourly]

    # Top to'lovchilar
    top_users = db.session.query(
        Payment.user_id,
        func.count(Payment.id).label('count'),
        func.sum(Payment.amount).label('total')
    ).filter(Payment.status == 'completed')
    if date_from:
        top_users = top_users.filter(Payment.created_at >= datetime.fromisoformat(date_from))
    if date_to:
        top_users = top_users.filter(Payment.created_at <= datetime.fromisoformat(date_to) if 'T' in date_to
                                      else Payment.created_at < datetime.fromisoformat(date_to + 'T23:59:59'))
    top_users = top_users.group_by(Payment.user_id).order_by(func.sum(Payment.amount).desc()).limit(10).all()

    top_users_data = []
    for r in top_users:
        user = User.query.get(r.user_id)
        top_users_data.append({
            'user_id': r.user_id,
            'user_name': user.full_name if user else None,
            'user_phone': user.phone_number if user else None,
            'count': r.count,
            'total': int(r.total or 0),
        })

    return jsonify({
        'total_revenue': int(total_revenue),
        'total_count': total_count,
        'today_revenue': int(today_revenue),
        'today_count': today_count,
        'by_method': methods,
        'daily': daily_data,
        'hourly': hourly_data,
        'top_users': top_users_data,
    }), 200
