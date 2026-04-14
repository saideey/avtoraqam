from flask import Blueprint, request, jsonify
from datetime import datetime, timedelta, timezone
from app.middleware.auth import admin_required
from app.services.stats_service import (
    get_overview_stats, get_daily_stats,
    get_monthly_stats, get_hourly_stats
)

stats_bp = Blueprint('stats', __name__)


@stats_bp.route('/overview', methods=['GET'])
@admin_required
def overview(current_user):
    """Umumiy statistika
    ---
    tags:
      - Admin
    description: Platformaning umumiy statistikasi (foydalanuvchilar, e'lonlar, takliflar va h.k.)
    security:
      - Bearer: []
    responses:
      200:
        description: Umumiy statistika
        schema:
          type: object
      401:
        description: Avtorizatsiya talab qilinadi
      403:
        description: Admin huquqi talab qilinadi
    """
    return jsonify(get_overview_stats()), 200


@stats_bp.route('/daily', methods=['GET'])
@admin_required
def daily(current_user):
    """Kunlik statistika
    ---
    tags:
      - Admin
    description: Belgilangan sana oralig'ida kunlik statistika (default oxirgi 30 kun)
    security:
      - Bearer: []
    parameters:
      - in: query
        name: from
        type: string
        format: date-time
        description: "Boshlanish sanasi (ISO format)"
      - in: query
        name: to
        type: string
        format: date-time
        description: "Tugash sanasi (ISO format)"
    responses:
      200:
        description: Kunlik statistika
        schema:
          type: object
      401:
        description: Avtorizatsiya talab qilinadi
      403:
        description: Admin huquqi talab qilinadi
    """
    from_date = request.args.get('from')
    to_date = request.args.get('to')

    if not from_date or not to_date:
        now = datetime.now(timezone.utc)
        to_date = now
        from_date = now - timedelta(days=30)
    else:
        from_date = datetime.fromisoformat(from_date)
        to_date = datetime.fromisoformat(to_date)

    return jsonify(get_daily_stats(from_date, to_date)), 200


@stats_bp.route('/monthly', methods=['GET'])
@admin_required
def monthly(current_user):
    """Oylik statistika
    ---
    tags:
      - Admin
    description: Oylar kesimida statistika ma'lumotlari
    security:
      - Bearer: []
    responses:
      200:
        description: Oylik statistika
        schema:
          type: object
          properties:
            data:
              type: array
      401:
        description: Avtorizatsiya talab qilinadi
      403:
        description: Admin huquqi talab qilinadi
    """
    return jsonify({'data': get_monthly_stats()}), 200


@stats_bp.route('/hourly', methods=['GET'])
@admin_required
def hourly(current_user):
    """Soatlik statistika
    ---
    tags:
      - Admin
    description: Sutka davomidagi soatlar kesimida faollik statistikasi
    security:
      - Bearer: []
    responses:
      200:
        description: Soatlik statistika
        schema:
          type: object
          properties:
            data:
              type: array
      401:
        description: Avtorizatsiya talab qilinadi
      403:
        description: Admin huquqi talab qilinadi
    """
    return jsonify({'data': get_hourly_stats()}), 200
