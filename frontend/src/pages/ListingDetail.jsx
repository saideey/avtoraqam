import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import {
  Heart, Eye, User, Calendar, ArrowLeft, Check,
  X as XIcon, Send, Phone, MessageSquare, Shield,
} from 'lucide-react';
import { useListing } from '../hooks/useListings';
import { useCreateOffer, useAcceptOffer, useRejectOffer } from '../hooks/useOffers';
import { useAuth } from '../hooks/useAuth';
import { likesAPI, listingsAPI } from '../services/api';
import { formatPrice, formatDate, formatPhone, formatRelativeDate } from '../utils/formatters';
import { getRegionName } from '../utils/plateUtils';
import LoadingSpinner from '../components/common/LoadingSpinner';
import PlateDisplay from '../components/listing/PlateDisplay';

/* ─── Design tokens ─── */
const glassSurface = {
  background: 'rgba(255,255,255,0.06)',
  backdropFilter: 'blur(24px) saturate(180%)',
  WebkitBackdropFilter: 'blur(24px) saturate(180%)',
  border: '1px solid rgba(255,255,255,0.12)',
  borderRadius: '20px',
  boxShadow:
    '0 4px 6px rgba(0,0,0,0.07), 0 10px 15px rgba(0,0,0,0.1), 0 20px 25px rgba(0,0,0,0.15)',
};

const glassInputStyle = (hasError) => ({
  background: 'rgba(255,255,255,0.06)',
  border: hasError
    ? '1px solid rgba(255,69,58,0.6)'
    : '1px solid rgba(255,255,255,0.10)',
  boxShadow: 'none',
});
const glassInputFocus = (e, hasError) => {
  if (!hasError) {
    e.target.style.boxShadow = '0 0 0 3px rgba(10,132,255,0.35)';
    e.target.style.borderColor = 'rgba(10,132,255,0.5)';
  }
};
const glassInputBlur = (e, hasError) => {
  e.target.style.boxShadow = 'none';
  e.target.style.borderColor = hasError
    ? 'rgba(255,69,58,0.6)'
    : 'rgba(255,255,255,0.10)';
};

/* ─── Offer modal ─── */
function OfferModal({ listingId, onClose }) {
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm();
  const createOffer = useCreateOffer();

  const onSubmit = async (data) => {
    try {
      await createOffer.mutateAsync({
        listing_id: listingId,
        amount: Number(data.amount),
        message: data.message || '',
      });
      toast.success("Taklif muvaffaqiyatli yuborildi!");
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.error || "Xatolik yuz berdi");
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center px-4"
      style={{ background: 'rgba(0,0,0,0.60)', backdropFilter: 'blur(12px)' }}
    >
      <div
        className="w-full max-w-md p-6 relative overflow-hidden"
        style={{
          ...glassSurface,
          background: 'rgba(255,255,255,0.08)',
        }}
      >
        {/* Top highlight */}
        <div
          className="absolute top-0 left-[10%] right-[10%] h-px"
          style={{ background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.20), transparent)' }}
        />

        <div className="flex items-center justify-between mb-5">
          <h3 className="text-xl font-bold text-white/95">Taklif yuborish</h3>
          <button onClick={onClose} className="text-white/40 hover:text-white/70 transition-colors">
            <XIcon size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="text-white/55 text-sm font-medium mb-1.5 block">
              Narx taklifi (so&apos;m)
            </label>
            <input
              type="number"
              placeholder="Narxni kiriting"
              {...register('amount', {
                required: 'Narx kiritilishi shart',
                min: { value: 1000, message: "Kamida 1,000 so'm" },
              })}
              className="w-full px-4 py-3 rounded-xl text-lg text-white/95 placeholder:text-white/30 outline-none transition-all"
              style={glassInputStyle(errors.amount)}
              onFocus={(e) => glassInputFocus(e, errors.amount)}
              onBlur={(e) => glassInputBlur(e, errors.amount)}
            />
            {errors.amount && (
              <p className="text-[#FF453A] text-sm mt-1">{errors.amount.message}</p>
            )}
          </div>

          <div>
            <label className="text-white/55 text-sm font-medium mb-1.5 block">
              Xabar (ixtiyoriy)
            </label>
            <textarea
              rows={3}
              placeholder="Qo'shimcha xabar..."
              {...register('message', {
                maxLength: { value: 300, message: "300 ta belgidan oshmasin" },
              })}
              className="w-full px-4 py-3 rounded-xl text-white/95 placeholder:text-white/30 outline-none resize-none transition-all"
              style={glassInputStyle(errors.message)}
              onFocus={(e) => glassInputFocus(e, errors.message)}
              onBlur={(e) => glassInputBlur(e, errors.message)}
            />
            {errors.message && (
              <p className="text-[#FF453A] text-sm mt-1">{errors.message.message}</p>
            )}
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-3 rounded-full font-medium text-white/70 transition-all"
              style={{
                background: 'rgba(255,255,255,0.08)',
                border: '1px solid rgba(255,255,255,0.12)',
              }}
            >
              Bekor qilish
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 px-6 py-3 rounded-full font-semibold text-white transition-all disabled:opacity-50"
              style={{
                background: '#0A84FF',
                boxShadow: '0 0 20px rgba(10,132,255,0.25)',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.filter = 'brightness(1.1)';
                e.currentTarget.style.boxShadow = '0 0 30px rgba(10,132,255,0.4)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.filter = 'brightness(1)';
                e.currentTarget.style.boxShadow = '0 0 20px rgba(10,132,255,0.25)';
              }}
            >
              {isSubmitting ? 'Yuborilmoqda...' : 'Yuborish'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ─── Single offer card ─── */
function OfferCard({ offer, onAccept, onReject }) {
  const offerId = offer._id || offer.id;
  const buyerName = offer.buyer_name || offer.buyer?.full_name || 'Xaridor';
  const buyerPhone = offer.buyer_phone || offer.buyer?.phone_number;
  const statusColors = {
    pending: 'bg-amber-500/15 text-amber-400 border border-amber-400/20',
    accepted: 'bg-[#30D158]/15 text-[#30D158] border border-[#30D158]/20',
    rejected: 'bg-[#FF453A]/15 text-[#FF453A] border border-[#FF453A]/20',
    cancelled: 'bg-white/10 text-white/40 border border-white/10',
  };
  const statusLabels = {
    pending: 'Kutilmoqda',
    accepted: 'Qabul qilingan',
    rejected: 'Rad etilgan',
    cancelled: 'Bekor qilingan',
  };

  return (
    <div
      className="p-5 transition-all"
      style={{
        background: 'rgba(255,255,255,0.04)',
        borderRadius: '16px',
        border: '1px solid rgba(255,255,255,0.08)',
      }}
    >
      {/* Header: buyer info + status */}
      <div className="flex items-start justify-between gap-3 mb-4">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 bg-[#0A84FF]/20 rounded-full flex items-center justify-center shrink-0">
            <User size={18} className="text-[#0A84FF]" />
          </div>
          <div>
            <p className="font-semibold text-white/95">{buyerName}</p>
            {buyerPhone && (
              <a
                href={`tel:${buyerPhone}`}
                className="flex items-center gap-1 text-sm text-[#0A84FF] hover:text-[#0A84FF]/80 mt-0.5 transition-colors"
              >
                <Phone size={12} />
                {formatPhone(buyerPhone)}
              </a>
            )}
          </div>
        </div>
        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${statusColors[offer.status] || statusColors.pending}`}>
          {statusLabels[offer.status] || offer.status}
        </span>
      </div>

      {/* Offer amount */}
      <div
        className="rounded-xl px-4 py-3 mb-3"
        style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}
      >
        <p className="text-2xl font-bold text-[#30D158]">
          {formatPrice(offer.amount)}
        </p>
      </div>

      {/* Message */}
      {offer.message && (
        <div
          className="flex items-start gap-2 rounded-xl p-3 mb-3"
          style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)' }}
        >
          <MessageSquare size={16} className="text-white/30 mt-0.5 shrink-0" />
          <p className="text-sm text-white/55 leading-relaxed">{offer.message}</p>
        </div>
      )}

      {/* Footer: time + actions */}
      <div className="flex items-center justify-between mt-3">
        <p className="text-xs text-white/30">
          {formatRelativeDate(offer.created_at)}
        </p>

        {offer.status === 'pending' && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => onAccept(offerId)}
              className="flex items-center gap-1.5 px-4 py-2 rounded-full transition-all text-sm font-semibold text-white"
              style={{
                background: '#30D158',
                boxShadow: '0 0 15px rgba(48,209,88,0.2)',
              }}
            >
              <Check size={15} />
              Qabul qilish
            </button>
            <button
              onClick={() => onReject(offerId)}
              className="flex items-center gap-1.5 px-4 py-2 rounded-full transition-all text-sm font-medium text-white/70"
              style={{
                background: 'rgba(255,255,255,0.08)',
                border: '1px solid rgba(255,255,255,0.12)',
              }}
            >
              <XIcon size={15} />
              Rad etish
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

/* ─── Main page ─── */
export default function ListingDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const { data, isLoading, isError } = useListing(id);
  const acceptOffer = useAcceptOffer();
  const rejectOffer = useRejectOffer();

  const [liked, setLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(0);
  const [showOfferModal, setShowOfferModal] = useState(false);
  const [offers, setOffers] = useState([]);
  const [offersLoading, setOffersLoading] = useState(false);

  // Destructure nested listing data
  const listing = data?.listing;

  // Sync likes from listing data
  useEffect(() => {
    if (listing) {
      setLiked(listing.is_liked || false);
      setLikesCount(listing.likes_count || 0);
    }
  }, [listing]);

  const isOwner = user && listing && (
    user._id === listing.seller_id ||
    user.id === listing.seller_id
  );

  // Fetch offers only when user is the owner
  useEffect(() => {
    if (!isOwner || !id) return;

    setOffersLoading(true);
    listingsAPI.getOffers(id)
      .then(({ data }) => setOffers(data.offers || data.data || data || []))
      .catch(() => toast.error("Takliflarni yuklashda xatolik"))
      .finally(() => setOffersLoading(false));
  }, [isOwner, id]);

  const handleLikeToggle = async () => {
    if (!user) {
      toast.error("Yoqtirish uchun tizimga kiring");
      return;
    }
    try {
      await likesAPI.toggle(id);
      setLiked((prev) => !prev);
      setLikesCount((prev) => (liked ? prev - 1 : prev + 1));
    } catch {
      toast.error("Xatolik yuz berdi");
    }
  };

  const handleAcceptOffer = async (offerId) => {
    try {
      await acceptOffer.mutateAsync(offerId);
      setOffers((prev) =>
        prev.map((o) =>
          (o._id || o.id) === offerId
            ? { ...o, status: 'accepted' }
            : { ...o, status: o.status === 'pending' ? 'rejected' : o.status }
        )
      );
      toast.success("Taklif qabul qilindi!");
    } catch (err) {
      toast.error(err.response?.data?.error || "Xatolik yuz berdi");
    }
  };

  const handleRejectOffer = async (offerId) => {
    try {
      await rejectOffer.mutateAsync(offerId);
      setOffers((prev) =>
        prev.map((o) =>
          (o._id || o.id) === offerId ? { ...o, status: 'rejected' } : o
        )
      );
      toast.success("Taklif rad etildi");
    } catch (err) {
      toast.error(err.response?.data?.error || "Xatolik yuz berdi");
    }
  };

  if (isLoading) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{
          background: 'radial-gradient(ellipse at top left, #0a0a1a 0%, #050510 60%, #0d0d20 100%)',
        }}
      >
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (isError || !listing) {
    return (
      <div
        className="min-h-screen"
        style={{
          background: 'radial-gradient(ellipse at top left, #0a0a1a 0%, #050510 60%, #0d0d20 100%)',
        }}
      >
        <div className="max-w-4xl mx-auto px-4 py-16 text-center">
          <div className="p-10" style={glassSurface}>
            <p className="text-[#FF453A] text-lg font-medium mb-4">E&apos;lon topilmadi yoki xatolik yuz berdi.</p>
            <Link to="/" className="text-[#0A84FF] hover:text-[#0A84FF]/80 font-medium transition-colors">
              Bosh sahifaga qaytish
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const canOffer = user && !isOwner && listing.status === 'active';
  const regionCode = listing.plate_number?.match(/^(\d{2})/)?.[1];

  return (
    <div
      className="min-h-screen relative overflow-hidden"
      style={{
        background: 'radial-gradient(ellipse at top left, #0a0a1a 0%, #050510 60%, #0d0d20 100%)',
      }}
    >
      {/* Subtle orbs */}
      <div
        className="absolute top-[-5%] left-[-5%] w-[400px] h-[400px] rounded-full pointer-events-none"
        style={{
          background: 'radial-gradient(circle, rgba(10,132,255,0.07) 0%, transparent 70%)',
          filter: 'blur(120px)',
        }}
      />
      <div
        className="absolute bottom-[-10%] right-[-5%] w-[350px] h-[350px] rounded-full pointer-events-none"
        style={{
          background: 'radial-gradient(circle, rgba(191,90,242,0.05) 0%, transparent 70%)',
          filter: 'blur(120px)',
        }}
      />

      <div className="max-w-5xl mx-auto px-4 py-6 sm:py-10 relative z-10">
        {/* Back link */}
        <Link
          to="/"
          className="inline-flex items-center gap-1.5 text-white/40 hover:text-white/70 mb-6 transition-colors text-sm font-medium"
        >
          <ArrowLeft size={18} />
          <span>Bosh sahifa</span>
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* ─── Main content ─── */}
          <div className="lg:col-span-2 space-y-6">
            {/* Plate display card */}
            <div className="p-6 sm:p-8 relative overflow-hidden" style={glassSurface}>
              {/* Highlight */}
              <div
                className="absolute top-0 left-[10%] right-[10%] h-px"
                style={{ background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.15), transparent)' }}
              />

              <div className="flex flex-col items-center">
                <PlateDisplay plateNumber={listing.plate_number} size="lg" />

                {regionCode && (
                  <p className="mt-4 text-white/40 text-sm font-medium">
                    {getRegionName(regionCode)}
                  </p>
                )}

                {/* Price */}
                <p className="mt-5 text-2xl sm:text-3xl font-bold text-[#30D158]">
                  {formatPrice(listing.price)}
                </p>

                {/* Meta row */}
                <div className="flex flex-wrap items-center justify-center gap-4 mt-5">
                  {/* Status badge */}
                  <span
                    className="px-4 py-1.5 rounded-full text-sm font-semibold"
                    style={
                      listing.status === 'active'
                        ? {
                            background: 'rgba(48,209,88,0.12)',
                            color: '#30D158',
                            border: '1px solid rgba(48,209,88,0.25)',
                            boxShadow: '0 0 12px rgba(48,209,88,0.15)',
                          }
                        : listing.status === 'sold'
                        ? {
                            background: 'rgba(255,255,255,0.06)',
                            color: 'rgba(255,255,255,0.40)',
                            border: '1px solid rgba(255,255,255,0.10)',
                          }
                        : {
                            background: 'rgba(255,214,10,0.12)',
                            color: '#FFD60A',
                            border: '1px solid rgba(255,214,10,0.25)',
                          }
                    }
                  >
                    {listing.status === 'active' ? 'Faol' : listing.status === 'sold' ? 'Sotilgan' : listing.status}
                  </span>

                  {/* Views */}
                  <span className="flex items-center gap-1.5 text-white/40 text-sm">
                    <Eye size={16} />
                    {listing.views_count || 0} ko&apos;rish
                  </span>

                  {/* Likes */}
                  <button
                    onClick={handleLikeToggle}
                    className={`flex items-center gap-1.5 text-sm transition-colors ${
                      liked ? 'text-[#FF453A]' : 'text-white/40 hover:text-[#FF453A]'
                    }`}
                  >
                    <Heart size={16} fill={liked ? 'currentColor' : 'none'} />
                    {likesCount} yoqtirish
                  </button>

                  <button className="flex items-center gap-1.5 text-white/30 hover:text-white/60 transition-colors text-sm">
                    <img src="/icons/icons8-bookmark-50.svg" alt="" className="w-4 h-4 opacity-60" />
                    Saqlash
                  </button>
                </div>
              </div>
            </div>

            {/* Description */}
            {listing.description && (
              <div className="p-6" style={glassSurface}>
                <h2 className="text-lg font-semibold text-white/95 mb-3">Tavsif</h2>
                <p className="text-white/55 leading-relaxed whitespace-pre-wrap">{listing.description}</p>
              </div>
            )}

            {/* ─── Offers section (owner only) ─── */}
            {isOwner && (
              <div className="p-6" style={glassSurface}>
                <div className="flex items-center justify-between mb-5">
                  <h2 className="text-lg font-semibold text-white/95">
                    Kelgan takliflar
                    {offers.length > 0 && (
                      <span className="ml-2 inline-flex items-center justify-center w-6 h-6 bg-[#0A84FF]/20 text-[#0A84FF] text-xs font-bold rounded-full border border-[#0A84FF]/30">
                        {offers.length}
                      </span>
                    )}
                  </h2>
                </div>

                {offersLoading ? (
                  <div className="flex justify-center py-8">
                    <LoadingSpinner size="sm" />
                  </div>
                ) : offers.length === 0 ? (
                  <div className="text-center py-10">
                    <div
                      className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-3"
                      style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.10)' }}
                    >
                      <MessageSquare size={24} className="text-white/30" />
                    </div>
                    <p className="text-white/30 text-sm">Hali takliflar yo&apos;q</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {offers.map((offer) => (
                      <OfferCard
                        key={offer._id || offer.id}
                        offer={offer}
                        onAccept={handleAcceptOffer}
                        onReject={handleRejectOffer}
                      />
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* ─── Sidebar ─── */}
          <div className="space-y-4">
            {/* Action card */}
            <div className="p-6 space-y-4" style={glassSurface}>
              {/* Offer button */}
              {canOffer && (
                <button
                  onClick={() => setShowOfferModal(true)}
                  className="w-full text-white py-3.5 rounded-full font-semibold transition-all flex items-center justify-center gap-2 text-base"
                  style={{
                    background: '#0A84FF',
                    boxShadow: '0 0 20px rgba(10,132,255,0.25)',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.filter = 'brightness(1.1)';
                    e.currentTarget.style.boxShadow = '0 0 30px rgba(10,132,255,0.4)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.filter = 'brightness(1)';
                    e.currentTarget.style.boxShadow = '0 0 20px rgba(10,132,255,0.25)';
                  }}
                >
                  <Send size={18} />
                  Taklif yuborish
                </button>
              )}

              {!user && (
                <Link
                  to="/login"
                  className="w-full block text-center text-white py-3.5 rounded-full font-semibold transition-all"
                  style={{
                    background: '#0A84FF',
                    boxShadow: '0 0 20px rgba(10,132,255,0.25)',
                  }}
                >
                  Taklif yuborish uchun kiring
                </Link>
              )}

              {isOwner && (
                <Link
                  to={`/edit-listing/${id}`}
                  className="w-full block text-center text-white/70 py-3.5 rounded-full font-semibold transition-colors"
                  style={{
                    background: 'rgba(255,255,255,0.08)',
                    border: '1px solid rgba(255,255,255,0.12)',
                  }}
                >
                  Tahrirlash
                </Link>
              )}
            </div>

            {/* Seller card */}
            {listing.seller_name && (
              <div className="p-6" style={glassSurface}>
                <h3 className="text-sm font-semibold text-white/30 uppercase tracking-wider mb-4">Sotuvchi</h3>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-[#0A84FF]/20 rounded-full flex items-center justify-center">
                    <User size={22} className="text-[#0A84FF]" />
                  </div>
                  <div>
                    <p className="font-semibold text-white/95">
                      {listing.seller_name}
                    </p>
                    {listing.seller_phone && (
                      <a
                        href={`tel:${listing.seller_phone}`}
                        className="flex items-center gap-1 text-sm text-[#0A84FF] hover:text-[#0A84FF]/80 mt-0.5 transition-colors"
                      >
                        <Phone size={13} />
                        {formatPhone(listing.seller_phone)}
                      </a>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Info card */}
            <div className="p-6 space-y-3" style={glassSurface}>
              <div className="flex items-center gap-2.5 text-sm text-white/40">
                <Calendar size={16} />
                <span>Joylangan: {formatDate(listing.created_at)}</span>
              </div>
              <div className="flex items-center gap-2.5 text-sm text-white/40">
                <Shield size={16} />
                <span>E&apos;lon raqami: #{listing._id || listing.id}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Offer Modal */}
        {showOfferModal && (
          <OfferModal
            listingId={id}
            onClose={() => setShowOfferModal(false)}
          />
        )}
      </div>
    </div>
  );
}
