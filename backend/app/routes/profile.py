from flask import Blueprint, request, jsonify, current_app
from app.extensions import db
from app.middleware.auth import login_required
from app.middleware.validators import ProfileUpdateSchema, validate_input
from app.utils.helpers import save_upload

profile_bp = Blueprint('profile', __name__)


@profile_bp.route('', methods=['GET'])
@login_required
def get_profile(current_user):
    """Joriy foydalanuvchi profili
    ---
    tags:
      - Profile
    security:
      - Bearer: []
    responses:
      200:
        description: Profil ma'lumotlari
        schema:
          type: object
          properties:
            user:
              type: object
    """
    return jsonify({'user': current_user.to_dict(include_private=True)}), 200


@profile_bp.route('', methods=['PUT'])
@login_required
def update_profile(current_user):
    """Profilni yangilash
    ---
    tags:
      - Profile
    security:
      - Bearer: []
    parameters:
      - in: body
        name: body
        required: true
        schema:
          type: object
          properties:
            full_name:
              type: string
              example: "Alisher Ibrogimov"
    responses:
      200:
        description: Profil yangilandi
      400:
        description: Validatsiya xatosi
    """
    data, errors = validate_input(ProfileUpdateSchema, request.get_json())
    if errors:
        return jsonify({'errors': errors}), 400

    if 'full_name' in data:
        current_user.full_name = data['full_name']

    db.session.commit()

    return jsonify({
        'message': 'Profil yangilandi',
        'user': current_user.to_dict(include_private=True),
    }), 200


@profile_bp.route('/photo', methods=['POST'])
@login_required
def upload_photo(current_user):
    """Profil rasmini yuklash
    ---
    tags:
      - Profile
    security:
      - Bearer: []
    consumes:
      - multipart/form-data
    parameters:
      - in: formData
        name: photo
        type: file
        required: true
        description: JPEG yoki PNG fayl
    responses:
      200:
        description: Rasm yuklandi
        schema:
          type: object
          properties:
            message:
              type: string
            photo_url:
              type: string
      400:
        description: Rasm yuklanmagan yoki format noto'g'ri
    """
    if 'photo' not in request.files:
        return jsonify({'error': 'Rasm yuklanmagan'}), 400

    file = request.files['photo']
    upload_folder = current_app.config['UPLOAD_FOLDER']
    filename = save_upload(file, upload_folder)

    if not filename:
        return jsonify({'error': 'Faqat JPEG/PNG formatdagi rasmlar ruxsat etiladi'}), 400

    current_user.profile_photo = f"/uploads/{filename}"
    db.session.commit()

    return jsonify({
        'message': 'Profil rasmi yuklandi',
        'photo_url': current_user.profile_photo,
    }), 200
