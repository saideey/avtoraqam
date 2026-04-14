from datetime import datetime, timedelta, timezone
from sqlalchemy import func, extract
from app.extensions import db
from app.models.user import User
from app.models.listing import Listing
from app.models.offer import Offer
from app.models.like import Like
from app.models.listing_view import ListingView


def get_overview_stats():
    now = datetime.now(timezone.utc)
    today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)

    total_users = User.query.count()
    today_users = User.query.filter(User.created_at >= today_start).count()
    active_listings = Listing.query.filter_by(status='active').count()
    sold_listings = Listing.query.filter_by(status='sold').count()
    today_sold = Listing.query.filter(
        Listing.status == 'sold', Listing.sold_at >= today_start
    ).count()
    total_offers = Offer.query.count()
    accepted_offers = Offer.query.filter_by(status='accepted').count()
    total_likes = Like.query.count()
    total_views = db.session.query(func.sum(Listing.views_count)).scalar() or 0
    avg_price = db.session.query(func.avg(Listing.price)).filter(
        Listing.status == 'active'
    ).scalar() or 0

    from app.models.plate_region import PlateRegion
    region_rows = db.session.query(
        Listing.region_code,
        func.count(Listing.id).label('count')
    ).filter(
        Listing.status == 'active'
    ).group_by(Listing.region_code).all()

    regions = []
    for row in region_rows:
        region = PlateRegion.query.get(row.region_code)
        regions.append({
            'code': row.region_code,
            'name': region.name_uz if region else row.region_code,
            'count': row.count,
        })
    regions.sort(key=lambda r: r['code'])

    # Price range distribution
    price_ranges_def = [
        ('0 - 1M', 0, 1_000_000),
        ('1M - 5M', 1_000_000, 5_000_000),
        ('5M - 10M', 5_000_000, 10_000_000),
        ('10M - 50M', 10_000_000, 50_000_000),
        ('50M+', 50_000_000, 999_999_999_999),
    ]
    price_ranges = []
    for label, low, high in price_ranges_def:
        cnt = Listing.query.filter(
            Listing.status == 'active',
            Listing.price >= low,
            Listing.price < high
        ).count()
        price_ranges.append({'range': label, 'count': cnt})

    # Top region
    top_region_name = regions[0]['name'] if regions and regions[0]['count'] > 0 else None
    if regions:
        sorted_regions = sorted(regions, key=lambda r: r['count'], reverse=True)
        if sorted_regions[0]['count'] > 0:
            top_region_name = sorted_regions[0]['name']

    # Most expensive plate
    most_expensive_listing = Listing.query.filter_by(status='active').order_by(
        Listing.price.desc()
    ).first()

    return {
        'total_users': total_users,
        'today_users': today_users,
        'active_listings': active_listings,
        'sold_listings': sold_listings,
        'today_sold': today_sold,
        'total_offers': total_offers,
        'accepted_offers': accepted_offers,
        'acceptance_rate': round(accepted_offers / total_offers * 100, 1) if total_offers > 0 else 0,
        'total_likes': total_likes,
        'total_views': total_views,
        'avg_price': round(float(avg_price)),
        'regions': regions,
        'price_ranges': price_ranges,
        'total_sold': sold_listings,
        'conversion_rate': round(sold_listings / active_listings * 100, 1) if active_listings > 0 else 0,
        'top_region': top_region_name,
        'most_expensive': {
            'plate_number': most_expensive_listing.plate_number,
            'price': most_expensive_listing.price,
        } if most_expensive_listing else None,
        # Takliflar statistikasi
        'rejected_offers': Offer.query.filter_by(status='rejected').count(),
        'pending_offers': Offer.query.filter_by(status='pending').count(),
        'cancelled_offers': Offer.query.filter_by(status='cancelled').count(),
    }


def get_daily_stats(from_date, to_date):
    listings_daily = db.session.query(
        func.date(Listing.created_at).label('date'),
        func.count(Listing.id).label('count')
    ).filter(
        Listing.created_at.between(from_date, to_date)
    ).group_by(func.date(Listing.created_at)).all()

    offers_daily = db.session.query(
        func.date(Offer.created_at).label('date'),
        func.count(Offer.id).label('count')
    ).filter(
        Offer.created_at.between(from_date, to_date)
    ).group_by(func.date(Offer.created_at)).all()

    listings_map = {str(r.date): r.count for r in listings_daily}
    offers_map = {str(r.date): r.count for r in offers_daily}

    all_dates = sorted(set(listings_map.keys()) | set(offers_map.keys()))

    return [
        {
            'date': d,
            'listings': listings_map.get(d, 0),
            'offers': offers_map.get(d, 0),
        }
        for d in all_dates
    ]


def get_monthly_stats():
    now = datetime.now(timezone.utc)
    year_ago = now - timedelta(days=365)

    monthly = db.session.query(
        extract('year', Listing.created_at).label('year'),
        extract('month', Listing.created_at).label('month'),
        func.count(Listing.id).label('count')
    ).filter(
        Listing.created_at >= year_ago
    ).group_by('year', 'month').order_by('year', 'month').all()

    return [{'year': int(r.year), 'month': int(r.month), 'count': r.count} for r in monthly]


def get_hourly_stats():
    now = datetime.now(timezone.utc)
    week_ago = now - timedelta(days=7)

    hourly = db.session.query(
        extract('dow', ListingView.viewed_at).label('day_of_week'),
        extract('hour', ListingView.viewed_at).label('hour'),
        func.count(ListingView.id).label('count')
    ).filter(
        ListingView.viewed_at >= week_ago
    ).group_by('day_of_week', 'hour').all()

    return [{'day': int(r.day_of_week), 'hour': int(r.hour), 'count': r.count} for r in hourly]
