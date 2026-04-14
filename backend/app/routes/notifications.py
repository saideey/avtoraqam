from flask import Blueprint, jsonify
from app.extensions import db
from app.models.notification import Notification
from app.middleware.auth import login_required

notifications_bp = Blueprint('notifications', __name__)


@notifications_bp.route('', methods=['GET'])
@login_required
def get_notifications(current_user):
    """Bildirishnomalar ro'yxati (so'nggi 50 ta)
    ---
    tags:
      - Notifications
    security:
      - Bearer: []
    responses:
      200:
        description: Bildirishnomalar
        schema:
          type: object
          properties:
            notifications:
              type: array
              items:
                type: object
            unread_count:
              type: integer
    """
    notifications = Notification.query.filter_by(
        user_id=current_user.id
    ).order_by(Notification.created_at.desc()).limit(50).all()

    unread_count = Notification.query.filter_by(
        user_id=current_user.id, is_read=False
    ).count()

    return jsonify({
        'notifications': [n.to_dict() for n in notifications],
        'unread_count': unread_count,
    }), 200


@notifications_bp.route('/read-all', methods=['PUT'])
@login_required
def mark_all_read(current_user):
    """Barcha bildirishnomalarni o'qilgan deb belgilash
    ---
    tags:
      - Notifications
    security:
      - Bearer: []
    responses:
      200:
        description: Barcha bildirishnomalar o'qildi
    """
    Notification.query.filter_by(
        user_id=current_user.id, is_read=False
    ).update({'is_read': True})
    db.session.commit()

    return jsonify({'message': 'Barcha bildirishnomalar o\'qildi'}), 200


@notifications_bp.route('/<int:notif_id>/read', methods=['PUT'])
@login_required
def mark_read(current_user, notif_id):
    """Bildirishnomani o'qilgan deb belgilash
    ---
    tags:
      - Notifications
    security:
      - Bearer: []
    parameters:
      - in: path
        name: notif_id
        type: integer
        required: true
    responses:
      200:
        description: Bildirishnoma o'qildi
      403:
        description: Ruxsat yo'q
      404:
        description: Bildirishnoma topilmadi
    """
    notification = Notification.query.get_or_404(notif_id)

    if notification.user_id != current_user.id:
        return jsonify({'error': 'Ruxsat yo\'q'}), 403

    notification.is_read = True
    db.session.commit()

    return jsonify({'message': 'Bildirishnoma o\'qildi'}), 200
