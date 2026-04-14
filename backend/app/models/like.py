from app.extensions import db
from datetime import datetime, timezone


class Like(db.Model):
    __tablename__ = 'likes'
    __table_args__ = (
        db.UniqueConstraint('user_id', 'listing_id', name='uq_like_user_listing'),
    )

    id = db.Column(db.BigInteger, primary_key=True, autoincrement=True)
    user_id = db.Column(db.BigInteger, db.ForeignKey('users.id'), nullable=False, index=True)
    listing_id = db.Column(db.BigInteger, db.ForeignKey('listings.id'), nullable=False, index=True)
    created_at = db.Column(
        db.DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc)
    )
