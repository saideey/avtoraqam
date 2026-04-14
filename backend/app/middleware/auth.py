from functools import wraps
from flask import jsonify
from flask_jwt_extended import get_jwt_identity, verify_jwt_in_request
from app.models.user import User


def _get_current_user():
    user_id = get_jwt_identity()
    if user_id is None:
        return None
    return User.query.get(int(user_id))


def login_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        verify_jwt_in_request()
        user = _get_current_user()
        if not user or not user.is_active:
            return jsonify({'error': 'Foydalanuvchi topilmadi yoki bloklangan'}), 403
        return f(user, *args, **kwargs)
    return decorated


def admin_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        verify_jwt_in_request()
        user = _get_current_user()
        if not user or not user.is_active:
            return jsonify({'error': 'Foydalanuvchi topilmadi yoki bloklangan'}), 403
        if user.role not in ('admin', 'superadmin'):
            return jsonify({'error': 'Admin huquqi talab qilinadi'}), 403
        return f(user, *args, **kwargs)
    return decorated


def superadmin_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        verify_jwt_in_request()
        user = _get_current_user()
        if not user or not user.is_active:
            return jsonify({'error': 'Foydalanuvchi topilmadi yoki bloklangan'}), 403
        if user.role != 'superadmin':
            return jsonify({'error': 'SuperAdmin huquqi talab qilinadi'}), 403
        return f(user, *args, **kwargs)
    return decorated


def optional_auth(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        try:
            verify_jwt_in_request(optional=True)
            user = _get_current_user()
        except Exception:
            user = None
        return f(user, *args, **kwargs)
    return decorated
