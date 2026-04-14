import re
from flask import Blueprint, request, jsonify
from flask_jwt_extended import (
    create_access_token, create_refresh_token,
    get_jwt_identity, get_jwt, jwt_required
)
from datetime import datetime, timezone
from app.extensions import db, bcrypt, token_blocklist
from app.models.user import User
from app.middleware.validators import (
    RegisterSchema, LoginSchema, ChangePasswordSchema, validate_input
)
from app.middleware.auth import login_required
from app.services.sms_service import send_otp, verify_otp

auth_bp = Blueprint('auth', __name__)


@auth_bp.route('/send-register-otp', methods=['POST'])
def send_register_otp():
    """Ro'yxatdan o'tish uchun OTP kod yuborish (1-bosqich)
    ---
    tags:
      - Auth
    description: |
      Ro'yxatdan o'tish jarayonining 1-bosqichi.
      Telefon raqamga 4 xonali SMS kod yuboradi.

      **TEST REJIMI:** Har qanday telefon uchun kod har doim **`1234`** bo'ladi.
      Real SMS yuborilmaydi, kod server logiga yoziladi.
    parameters:
      - in: body
        name: body
        required: true
        schema:
          type: object
          required:
            - phone_number
          properties:
            phone_number:
              type: string
              description: "+998 bilan boshlanuvchi 13 belgili telefon raqam"
              example: "+998901234567"
    responses:
      200:
        description: Kod muvaffaqiyatli yuborildi
        schema:
          type: object
          properties:
            message:
              type: string
              example: "Tasdiqlash kodi yuborildi"
      400:
        description: Telefon raqam formati noto'g'ri
      409:
        description: Bu telefon raqam allaqachon ro'yxatdan o'tgan
      429:
        description: Juda ko'p urinish
    """
    data = request.get_json() or {}
    phone = (data.get('phone_number') or '').strip()
    if not re.match(r'^\+998\d{9}$', phone):
        return jsonify({'error': "Telefon raqam +998XXXXXXXXX formatida bo'lishi kerak"}), 400
    if User.query.filter_by(phone_number=phone).first():
        return jsonify({'error': "Bu telefon raqam allaqachon ro'yxatdan o'tgan"}), 409
    success, message = send_otp(phone)
    if not success:
        return jsonify({'error': message}), 429
    return jsonify({'message': 'Tasdiqlash kodi yuborildi'}), 200


@auth_bp.route('/verify-register-otp', methods=['POST'])
def verify_register_otp():
    """OTP kodni tasdiqlash (2-bosqich)
    ---
    tags:
      - Auth
    description: |
      Ro'yxatdan o'tish jarayonining 2-bosqichi.
      Foydalanuvchi kiritgan kodni tekshiradi.

      **TEST REJIMI:** To'g'ri kod — **`1234`**.
      Kod muvaffaqiyatli tasdiqlangandan so'ng foydalanuvchi `/api/auth/register` ga o'tishi kerak.
    parameters:
      - in: body
        name: body
        required: true
        schema:
          type: object
          required:
            - phone_number
            - otp
          properties:
            phone_number:
              type: string
              example: "+998901234567"
            otp:
              type: string
              description: "4 xonali tasdiqlash kodi"
              example: "1234"
              minLength: 4
              maxLength: 4
    responses:
      200:
        description: Kod tasdiqlandi
        schema:
          type: object
          properties:
            message:
              type: string
              example: "Tasdiqlandi"
            verified:
              type: boolean
              example: true
      400:
        description: Noto'g'ri yoki muddati tugagan kod
    """
    data = request.get_json() or {}
    phone = (data.get('phone_number') or '').strip()
    otp = (data.get('otp') or '').strip()
    if not phone or not otp:
        return jsonify({'error': 'Telefon va kod kiritilishi kerak'}), 400
    success, message = verify_otp(phone, otp)
    if not success:
        return jsonify({'error': message}), 400
    return jsonify({'message': 'Tasdiqlandi', 'verified': True}), 200


@auth_bp.route('/register', methods=['POST'])
def register():
    """Ro'yxatdan o'tish
    ---
    tags:
      - Auth
    parameters:
      - in: body
        name: body
        required: true
        schema:
          type: object
          required:
            - phone_number
            - full_name
            - password
          properties:
            phone_number:
              type: string
              example: "+998901234567"
            full_name:
              type: string
              example: "Alisher Ibrogimov"
            password:
              type: string
              example: "password123"
    responses:
      201:
        description: Muvaffaqiyatli ro'yxatdan o'tildi
        schema:
          type: object
          properties:
            message:
              type: string
            user:
              type: object
            access_token:
              type: string
            refresh_token:
              type: string
      400:
        description: Validatsiya xatosi
      409:
        description: Telefon raqam allaqachon mavjud
    """
    data, errors = validate_input(RegisterSchema, request.get_json())
    if errors:
        return jsonify({'errors': errors}), 400

    if User.query.filter_by(phone_number=data['phone_number']).first():
        return jsonify({'error': 'Bu telefon raqam allaqachon ro\'yxatdan o\'tgan'}), 409

    password_hash = bcrypt.generate_password_hash(data['password']).decode('utf-8')

    user = User(
        phone_number=data['phone_number'],
        full_name=data['full_name'],
        password_hash=password_hash,
        role='user',
        is_verified=True,  # SMS yo'q hozircha, avtomatik tasdiqlangan
    )
    db.session.add(user)
    db.session.commit()

    access_token = create_access_token(identity=str(user.id))
    refresh_token = create_refresh_token(identity=str(user.id))

    return jsonify({
        'message': 'Ro\'yxatdan o\'tish muvaffaqiyatli',
        'user': user.to_dict(),
        'access_token': access_token,
        'refresh_token': refresh_token,
    }), 201


@auth_bp.route('/login', methods=['POST'])
def login():
    """Tizimga kirish
    ---
    tags:
      - Auth
    parameters:
      - in: body
        name: body
        required: true
        schema:
          type: object
          required:
            - phone_number
            - password
          properties:
            phone_number:
              type: string
              example: "+998901234567"
            password:
              type: string
              example: "password123"
    responses:
      200:
        description: Muvaffaqiyatli kirish
        schema:
          type: object
          properties:
            user:
              type: object
            access_token:
              type: string
            refresh_token:
              type: string
      401:
        description: Telefon raqam yoki parol noto'g'ri
      403:
        description: Akkaunt bloklangan
    """
    data, errors = validate_input(LoginSchema, request.get_json())
    if errors:
        return jsonify({'errors': errors}), 400

    user = User.query.filter_by(phone_number=data['phone_number']).first()

    if not user or not bcrypt.check_password_hash(user.password_hash, data['password']):
        return jsonify({'error': 'Telefon raqam yoki parol noto\'g\'ri'}), 401

    if not user.is_active:
        return jsonify({'error': 'Akkaunt bloklangan'}), 403

    user.last_login = datetime.now(timezone.utc)
    user.last_login_ip = request.headers.get('X-Real-IP', request.remote_addr)
    db.session.commit()

    access_token = create_access_token(identity=str(user.id))
    refresh_token = create_refresh_token(identity=str(user.id))

    return jsonify({
        'user': user.to_dict(),
        'access_token': access_token,
        'refresh_token': refresh_token,
    }), 200


@auth_bp.route('/refresh', methods=['POST'])
@jwt_required(refresh=True)
def refresh():
    """Access token yangilash
    ---
    tags:
      - Auth
    security:
      - Bearer: []
    description: Refresh token yordamida yangi access token olish. Authorization headerda refresh token yuborilishi kerak.
    responses:
      200:
        description: Yangi access token
        schema:
          type: object
          properties:
            access_token:
              type: string
      401:
        description: Refresh token yaroqsiz
    """
    user_id = get_jwt_identity()
    access_token = create_access_token(identity=str(user_id))
    return jsonify({'access_token': access_token}), 200


@auth_bp.route('/logout', methods=['POST'])
@login_required
def logout(current_user):
    """Tizimdan chiqish
    ---
    tags:
      - Auth
    security:
      - Bearer: []
    description: Joriy access token'ni blocklist'ga qo'shadi.
    responses:
      200:
        description: Muvaffaqiyatli chiqish
        schema:
          type: object
          properties:
            message:
              type: string
      401:
        description: Token yaroqsiz
    """
    jti = get_jwt()['jti']
    token_blocklist.add(jti)
    return jsonify({'message': 'Chiqish muvaffaqiyatli'}), 200


@auth_bp.route('/change-password', methods=['POST'])
@login_required
def change_password(current_user):
    """Parolni o'zgartirish
    ---
    tags:
      - Auth
    security:
      - Bearer: []
    parameters:
      - in: body
        name: body
        required: true
        schema:
          type: object
          required:
            - old_password
            - new_password
          properties:
            old_password:
              type: string
              example: "oldpass123"
            new_password:
              type: string
              example: "newpass456"
    responses:
      200:
        description: Parol muvaffaqiyatli o'zgartirildi
      400:
        description: Joriy parol noto'g'ri yoki validatsiya xatosi
      401:
        description: Token yaroqsiz
    """
    data, errors = validate_input(ChangePasswordSchema, request.get_json())
    if errors:
        return jsonify({'errors': errors}), 400

    if not bcrypt.check_password_hash(current_user.password_hash, data['old_password']):
        return jsonify({'error': 'Joriy parol noto\'g\'ri'}), 400

    current_user.password_hash = bcrypt.generate_password_hash(data['new_password']).decode('utf-8')
    db.session.commit()

    return jsonify({'message': 'Parol muvaffaqiyatli o\'zgartirildi'}), 200
