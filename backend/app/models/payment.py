from app.extensions import db
from datetime import datetime, timezone


class Payment(db.Model):
    __tablename__ = 'payments'

    id = db.Column(db.BigInteger, primary_key=True, autoincrement=True)
    user_id = db.Column(db.BigInteger, db.ForeignKey('users.id'), nullable=False, index=True)
    listing_id = db.Column(db.BigInteger, db.ForeignKey('listings.id'), nullable=True, index=True)
    amount = db.Column(db.BigInteger, nullable=False)  # so'mda
    payment_method = db.Column(db.String(20), nullable=False)  # click, payme, paynet
    status = db.Column(db.String(20), nullable=False, default='completed')  # completed, failed, pending
    card_last4 = db.Column(db.String(4), nullable=True)
    created_at = db.Column(db.DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

    user = db.relationship('User', backref='payments')
    listing = db.relationship('Listing', backref='payment')

    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'user_name': self.user.full_name if self.user else None,
            'user_phone': self.user.phone_number if self.user else None,
            'listing_id': self.listing_id,
            'plate_number': self.listing.plate_number if self.listing else None,
            'amount': self.amount,
            'payment_method': self.payment_method,
            'status': self.status,
            'card_last4': self.card_last4,
            'created_at': self.created_at.isoformat() if self.created_at else None,
        }
