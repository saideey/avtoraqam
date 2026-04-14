from app.extensions import db
from datetime import datetime, timezone


class Listing(db.Model):
    __tablename__ = 'listings'

    id = db.Column(db.BigInteger, primary_key=True, autoincrement=True)
    seller_id = db.Column(db.BigInteger, db.ForeignKey('users.id'), nullable=False, index=True)
    plate_number = db.Column(db.String(20), nullable=False, index=True)
    region_code = db.Column(db.String(5), nullable=False)
    price = db.Column(db.BigInteger, nullable=False)
    description = db.Column(db.Text, nullable=True)
    status = db.Column(
        db.Enum('active', 'sold', 'cancelled', name='listing_status'),
        nullable=False, default='active'
    )
    views_count = db.Column(db.Integer, default=0)
    likes_count = db.Column(db.Integer, default=0)
    created_at = db.Column(
        db.DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc)
    )
    updated_at = db.Column(db.DateTime(timezone=True), nullable=True)
    sold_at = db.Column(db.DateTime(timezone=True), nullable=True)

    # Relationships
    offers = db.relationship('Offer', backref='listing', lazy='dynamic')
    likes = db.relationship('Like', backref='listing', lazy='dynamic')
    views = db.relationship('ListingView', backref='listing', lazy='dynamic')

    def to_dict(self, current_user_id=None):
        data = {
            'id': self.id,
            'seller_id': self.seller_id,
            'seller_name': self.seller.full_name if self.seller else None,
            'plate_number': self.plate_number,
            'region_code': self.region_code,
            'price': self.price,
            'description': self.description,
            'status': self.status,
            'views_count': self.views_count,
            'likes_count': self.likes_count,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None,
            'sold_at': self.sold_at.isoformat() if self.sold_at else None,
        }
        if current_user_id:
            from .like import Like
            data['is_liked'] = Like.query.filter_by(
                user_id=current_user_id, listing_id=self.id
            ).first() is not None
        return data
