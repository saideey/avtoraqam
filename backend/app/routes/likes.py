from flask import Blueprint, jsonify
from app.extensions import db
from app.models.like import Like
from app.models.listing import Listing
from app.middleware.auth import login_required

likes_bp = Blueprint('likes', __name__)


@likes_bp.route('/<int:listing_id>', methods=['POST'])
@login_required
def toggle_like(current_user, listing_id):
    """E'lonni yoqtirish/bekor qilish (toggle)
    ---
    tags:
      - Likes
    security:
      - Bearer: []
    parameters:
      - in: path
        name: listing_id
        type: integer
        required: true
    responses:
      200:
        description: Yoqtirish holati o'zgartirildi
        schema:
          type: object
          properties:
            liked:
              type: boolean
            likes_count:
              type: integer
      404:
        description: E'lon topilmadi
    """
    listing = Listing.query.get_or_404(listing_id)

    existing = Like.query.filter_by(
        user_id=current_user.id,
        listing_id=listing_id
    ).first()

    if existing:
        db.session.delete(existing)
        listing.likes_count = max(0, listing.likes_count - 1)
        db.session.commit()
        return jsonify({'liked': False, 'likes_count': listing.likes_count}), 200
    else:
        like = Like(user_id=current_user.id, listing_id=listing_id)
        db.session.add(like)
        listing.likes_count += 1
        db.session.commit()
        return jsonify({'liked': True, 'likes_count': listing.likes_count}), 200


@likes_bp.route('/my', methods=['GET'])
@login_required
def my_likes(current_user):
    """Yoqtirgan e'lonlarim
    ---
    tags:
      - Likes
    security:
      - Bearer: []
    responses:
      200:
        description: Yoqtirilgan e'lonlar ro'yxati
        schema:
          type: object
          properties:
            listings:
              type: array
              items:
                type: object
    """
    likes = Like.query.filter_by(user_id=current_user.id).order_by(Like.created_at.desc()).all()
    listings = []
    for like in likes:
        listing = Listing.query.get(like.listing_id)
        if listing:
            listings.append(listing.to_dict(current_user_id=current_user.id))

    return jsonify({'listings': listings}), 200
