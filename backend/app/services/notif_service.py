from app.extensions import db, socketio
from app.models.notification import Notification


def create_notification(user_id, notif_type, title, message, data=None):
    notification = Notification(
        user_id=user_id,
        type=notif_type,
        title=title,
        message=message,
        data=data
    )
    db.session.add(notification)
    db.session.commit()

    # Real-time yuborish
    socketio.emit('new_notification', notification.to_dict(), room=f"user_{user_id}")

    return notification


def notify_new_offer(listing, offer):
    create_notification(
        user_id=listing.seller_id,
        notif_type='new_offer',
        title='Yangi taklif!',
        message=f"{offer.buyer.full_name} sizning {listing.plate_number} raqamingizga {offer.amount:,} so'm taklif qildi",
        data={'listing_id': listing.id, 'offer_id': offer.id}
    )


def notify_offer_accepted(offer):
    create_notification(
        user_id=offer.buyer_id,
        notif_type='offer_accepted',
        title='Taklifingiz qabul qilindi!',
        message=f"{offer.listing.plate_number} raqami uchun {offer.amount:,} so'mlik taklifingiz qabul qilindi",
        data={'listing_id': offer.listing_id, 'offer_id': offer.id}
    )


def notify_offer_rejected(offer):
    create_notification(
        user_id=offer.buyer_id,
        notif_type='offer_rejected',
        title='Taklifingiz rad etildi',
        message=f"{offer.listing.plate_number} raqami uchun taklifingiz rad etildi",
        data={'listing_id': offer.listing_id, 'offer_id': offer.id}
    )


def notify_listing_sold(listing, accepted_offer):
    # Boshqa taklif berganlarga xabar
    from app.models.offer import Offer
    other_offers = Offer.query.filter(
        Offer.listing_id == listing.id,
        Offer.id != accepted_offer.id,
        Offer.status == 'pending'
    ).all()

    for offer in other_offers:
        create_notification(
            user_id=offer.buyer_id,
            notif_type='listing_sold',
            title='E\'lon sotildi',
            message=f"{listing.plate_number} raqami boshqa xaridorga sotildi",
            data={'listing_id': listing.id}
        )
