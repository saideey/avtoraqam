from app.extensions import db
from datetime import datetime, timezone


class Offer(db.Model):
    __tablename__ = 'offers'
    __table_args__ = (
        db.UniqueConstraint('listing_id', 'buyer_id', name='uq_offer_listing_buyer'),
    )

    id = db.Column(db.BigInteger, primary_key=True, autoincrement=True)
    listing_id = db.Column(db.BigInteger, db.ForeignKey('listings.id'), nullable=False, index=True)
    buyer_id = db.Column(db.BigInteger, db.ForeignKey('users.id'), nullable=False, index=True)
    amount = db.Column(db.BigInteger, nullable=False)
    message = db.Column(db.Text, nullable=True)
    status = db.Column(
        db.Enum('pending', 'accepted', 'rejected', 'cancelled', name='offer_status'),
        nullable=False, default='pending'
    )
    created_at = db.Column(
        db.DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc)
    )
    updated_at = db.Column(db.DateTime(timezone=True), nullable=True)

    def to_dict(self):
        return {
            'id': self.id,
            'listing_id': self.listing_id,
            'buyer_id': self.buyer_id,
            'buyer_name': self.buyer.full_name if self.buyer else None,
            'buyer_phone': self.buyer.phone_number if self.buyer else None,
            'amount': self.amount,
            'message': self.message,
            'status': self.status,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None,
            'plate_number': self.listing.plate_number if self.listing else None,
        }
