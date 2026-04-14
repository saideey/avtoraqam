from flask import Blueprint, request, jsonify
from datetime import datetime, timezone
from app.extensions import db
from app.models.offer import Offer
from app.models.listing import Listing
from app.middleware.auth import login_required
from app.middleware.validators import OfferCreateSchema, validate_input
from app.services.notif_service import (
    notify_new_offer, notify_offer_accepted,
    notify_offer_rejected, notify_listing_sold
)

offers_bp = Blueprint('offers', __name__)


@offers_bp.route('', methods=['POST'])
@login_required
def create_offer(current_user):
    """Yangi taklif yuborish
    ---
    tags:
      - Offers
    security:
      - Bearer: []
    parameters:
      - in: body
        name: body
        required: true
        schema:
          type: object
          required:
            - listing_id
            - amount
          properties:
            listing_id:
              type: integer
              example: 42
            amount:
              type: integer
              example: 4500000
            message:
              type: string
              example: "Salom, narx muhokama qilinadimi?"
    responses:
      201:
        description: Taklif yuborildi
      200:
        description: Mavjud taklif yangilandi
      400:
        description: Validatsiya xatosi yoki o'z e'longa taklif
      404:
        description: E'lon topilmadi
      409:
        description: Bu e'longa avval taklif yuborilgan
    """
    data, errors = validate_input(OfferCreateSchema, request.get_json())
    if errors:
        return jsonify({'errors': errors}), 400

    listing = Listing.query.get(data['listing_id'])
    if not listing:
        return jsonify({'error': 'E\'lon topilmadi'}), 404

    if listing.status != 'active':
        return jsonify({'error': 'Bu e\'lon aktiv emas'}), 400

    if listing.seller_id == current_user.id:
        return jsonify({'error': 'O\'z e\'loningizga taklif yuborib bo\'lmaydi'}), 400

    # Mavjud taklif bor mi?
    existing = Offer.query.filter_by(
        listing_id=listing.id,
        buyer_id=current_user.id
    ).first()

    if existing:
        if existing.status in ('pending',):
            existing.amount = data['amount']
            existing.message = data.get('message')
            existing.updated_at = datetime.now(timezone.utc)
            db.session.commit()
            return jsonify({
                'message': 'Taklif yangilandi',
                'offer': existing.to_dict(),
            }), 200
        elif existing.status in ('accepted', 'rejected'):
            return jsonify({'error': 'Bu e\'longa avval taklif yuborgansiz'}), 409

    offer = Offer(
        listing_id=listing.id,
        buyer_id=current_user.id,
        amount=data['amount'],
        message=data.get('message'),
    )
    db.session.add(offer)
    db.session.commit()

    notify_new_offer(listing, offer)

    return jsonify({
        'message': 'Taklif yuborildi',
        'offer': offer.to_dict(),
    }), 201


@offers_bp.route('/received', methods=['GET'])
@login_required
def received_offers(current_user):
    """Qabul qilingan takliflar (sotuvchi uchun)
    ---
    tags:
      - Offers
    security:
      - Bearer: []
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
    """
    offers = Offer.query.join(Listing).filter(
        Listing.seller_id == current_user.id
    ).order_by(Offer.created_at.desc()).all()

    return jsonify({'offers': [o.to_dict() for o in offers]}), 200


@offers_bp.route('/sent', methods=['GET'])
@login_required
def sent_offers(current_user):
    """Yuborilgan takliflar (xaridor uchun)
    ---
    tags:
      - Offers
    security:
      - Bearer: []
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
    """
    offers = Offer.query.filter_by(
        buyer_id=current_user.id
    ).order_by(Offer.created_at.desc()).all()

    return jsonify({'offers': [o.to_dict() for o in offers]}), 200


@offers_bp.route('/<int:offer_id>/accept', methods=['PUT'])
@login_required
def accept_offer(current_user, offer_id):
    """Taklifni qabul qilish (sotuvchi uchun)
    ---
    tags:
      - Offers
    security:
      - Bearer: []
    parameters:
      - in: path
        name: offer_id
        type: integer
        required: true
    responses:
      200:
        description: Taklif qabul qilindi, e'lon sotilgan deb belgilandi
      400:
        description: Taklif allaqachon ko'rib chiqilgan
      403:
        description: Ruxsat yo'q
      404:
        description: Taklif topilmadi
    """
    offer = Offer.query.get_or_404(offer_id)
    listing = offer.listing

    if listing.seller_id != current_user.id:
        return jsonify({'error': 'Ruxsat yo\'q'}), 403

    if offer.status != 'pending':
        return jsonify({'error': 'Bu taklif allaqachon ko\'rib chiqilgan'}), 400

    # Taklifni qabul qilish
    offer.status = 'accepted'
    offer.updated_at = datetime.now(timezone.utc)

    # E'lonni sotilgan deb belgilash
    listing.status = 'sold'
    listing.sold_at = datetime.now(timezone.utc)

    # Boshqa takliflarni rad etish
    other_offers = Offer.query.filter(
        Offer.listing_id == listing.id,
        Offer.id != offer.id,
        Offer.status == 'pending'
    ).all()
    for o in other_offers:
        o.status = 'rejected'
        o.updated_at = datetime.now(timezone.utc)

    db.session.commit()

    notify_offer_accepted(offer)
    notify_listing_sold(listing, offer)

    return jsonify({'message': 'Taklif qabul qilindi', 'offer': offer.to_dict()}), 200


@offers_bp.route('/<int:offer_id>/reject', methods=['PUT'])
@login_required
def reject_offer(current_user, offer_id):
    """Taklifni rad etish (sotuvchi uchun)
    ---
    tags:
      - Offers
    security:
      - Bearer: []
    parameters:
      - in: path
        name: offer_id
        type: integer
        required: true
    responses:
      200:
        description: Taklif rad etildi
      400:
        description: Taklif allaqachon ko'rib chiqilgan
      403:
        description: Ruxsat yo'q
      404:
        description: Taklif topilmadi
    """
    offer = Offer.query.get_or_404(offer_id)

    if offer.listing.seller_id != current_user.id:
        return jsonify({'error': 'Ruxsat yo\'q'}), 403

    if offer.status != 'pending':
        return jsonify({'error': 'Bu taklif allaqachon ko\'rib chiqilgan'}), 400

    offer.status = 'rejected'
    offer.updated_at = datetime.now(timezone.utc)
    db.session.commit()

    notify_offer_rejected(offer)

    return jsonify({'message': 'Taklif rad etildi', 'offer': offer.to_dict()}), 200


@offers_bp.route('/<int:offer_id>/cancel', methods=['PUT'])
@login_required
def cancel_offer(current_user, offer_id):
    """Taklifni bekor qilish (xaridor uchun)
    ---
    tags:
      - Offers
    security:
      - Bearer: []
    parameters:
      - in: path
        name: offer_id
        type: integer
        required: true
    responses:
      200:
        description: Taklif bekor qilindi
      400:
        description: Faqat kutilayotgan taklifni bekor qilish mumkin
      403:
        description: Ruxsat yo'q
      404:
        description: Taklif topilmadi
    """
    offer = Offer.query.get_or_404(offer_id)

    if offer.buyer_id != current_user.id:
        return jsonify({'error': 'Ruxsat yo\'q'}), 403

    if offer.status != 'pending':
        return jsonify({'error': 'Faqat kutilayotgan taklifni bekor qilish mumkin'}), 400

    offer.status = 'cancelled'
    offer.updated_at = datetime.now(timezone.utc)
    db.session.commit()

    return jsonify({'message': 'Taklif bekor qilindi'}), 200
