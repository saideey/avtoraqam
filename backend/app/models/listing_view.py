from app.extensions import db
from datetime import datetime, timezone


class ListingView(db.Model):
    __tablename__ = 'listing_views'
    # Har safar ko'rilganda yangi yozuv — unique constraint yo'q

    id = db.Column(db.BigInteger, primary_key=True, autoincrement=True)
    listing_id = db.Column(db.BigInteger, db.ForeignKey('listings.id'), nullable=False, index=True)
    user_id = db.Column(db.BigInteger, db.ForeignKey('users.id'), nullable=True)
    ip_address = db.Column(db.String(45), nullable=False)
    session_id = db.Column(db.String(100), nullable=True)
    viewed_at = db.Column(
        db.DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc)
    )
