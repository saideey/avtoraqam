from app.extensions import db
from datetime import datetime, timezone


class User(db.Model):
    __tablename__ = 'users'

    id = db.Column(db.BigInteger, primary_key=True, autoincrement=True)
    phone_number = db.Column(db.String(13), unique=True, nullable=False, index=True)
    full_name = db.Column(db.String(100), nullable=False)
    password_hash = db.Column(db.String(255), nullable=False)
    role = db.Column(
        db.Enum('user', 'admin', 'superadmin', name='user_role'),
        nullable=False, default='user'
    )
    is_verified = db.Column(db.Boolean, default=False)
    is_active = db.Column(db.Boolean, default=True)
    profile_photo = db.Column(db.String(255), nullable=True)
    created_at = db.Column(
        db.DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc)
    )
    last_login = db.Column(db.DateTime(timezone=True), nullable=True)
    last_login_ip = db.Column(db.String(45), nullable=True)

    # Relationships
    listings = db.relationship('Listing', backref='seller', lazy='dynamic')
    offers = db.relationship('Offer', backref='buyer', lazy='dynamic')
    likes = db.relationship('Like', backref='user', lazy='dynamic')
    notifications = db.relationship('Notification', backref='user', lazy='dynamic')

    def to_dict(self, include_private=False):
        data = {
            'id': self.id,
            'phone_number': self.phone_number,
            'full_name': self.full_name,
            'role': self.role,
            'is_verified': self.is_verified,
            'is_active': self.is_active,
            'profile_photo': self.profile_photo,
            'created_at': self.created_at.isoformat() if self.created_at else None,
        }
        if include_private:
            data['last_login'] = self.last_login.isoformat() if self.last_login else None
            data['last_login_ip'] = self.last_login_ip
        return data
