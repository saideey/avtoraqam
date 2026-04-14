import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Check, X as XIcon, Send, Inbox, User, Phone, MessageSquare, ArrowLeft, Eye, Heart, Calendar } from 'lucide-react';
import { useSentOffers, useReceivedOffers, useAcceptOffer, useRejectOffer } from '../hooks/useOffers';
import { offersAPI, listingsAPI } from '../services/api';
import { formatPrice, formatRelativeDate, formatPhone, formatDate } from '../utils/formatters';
import { getRegionName } from '../utils/plateUtils';
import PlateDisplay from '../components/listing/PlateDisplay';
import LoadingSpinner from '../components/common/LoadingSpinner';

const statusStyles = {
  pending: 'bg-[#FF9F0A]/10 text-[#FF9F0A] border-[#FF9F0A]/20',
  accepted: 'bg-[#30D158]/10 text-[#30D158] border-[#30D158]/20',
  rejected: 'bg-[#FF453A]/10 text-[#FF453A] border-[#FF453A]/20',
  cancelled: 'bg-white/[0.04] text-white/40 border-white/[0.08]',
};
const statusLabel = {
  pending: 'Kutilmoqda',
  accepted: 'Qabul qilingan',
  rejected: 'Rad etilgan',
  cancelled: 'Bekor qilingan',
};

/* ── Taklif kartasi (ro'yxatda) ── */
function OfferCard({ offer, type, onAccept, onReject, onCancel, onViewDetail }) {
  const offerId = offer.id;

  return (
    <div
      className="rounded-2xl p-4 sm:p-5 border border-white/[0.06] cursor-pointer transition-all duration-200 hover:border-white/[0.10]"
      style={{ background: 'rgba(12,15,28,0.60)' }}
      onClick={() => type === 'received' && onViewDetail && onViewDetail(offer)}
    >
      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
        {/* Plate */}
        <div className="shrink-0" onClick={(e) => e.stopPropagation()}>
          <Link to={`/listings/${offer.listing_id}`}>
            <PlateDisplay plateNumber={offer.plate_number} size="sm" />
          </Link>
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <p className="text-lg font-bold text-[#30D158]">{formatPrice(offer.amount)}</p>
          {type === 'received' && (
            <p className="text-white/50 text-sm mt-0.5">
              {offer.buyer_name || 'Xaridor'}
              {offer.buyer_phone && <span className="text-white/30 ml-2">{formatPhone(offer.buyer_phone)}</span>}
            </p>
          )}
          {offer.message && (
            <p className="text-white/30 text-sm mt-1 truncate">{offer.message}</p>
          )}
          <span className="text-white/20 text-xs mt-1 block">{formatRelativeDate(offer.created_at)}</span>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 shrink-0" onClick={(e) => e.stopPropagation()}>
          {offer.status === 'pending' && type === 'received' && (
            <>
              <button
                onClick={() => onAccept(offerId)}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-[#30D158] text-white rounded-full text-sm font-medium transition-all"
              >
                <Check size={15} /> Qabul
              </button>
              <button
                onClick={() => onReject(offerId)}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full text-sm font-medium border border-white/[0.10] text-white/80 hover:bg-white/[0.05] transition-all"
              >
                <XIcon size={15} /> Rad
              </button>
            </>
          )}
          {offer.status === 'pending' && type === 'sent' && (
            <button
              onClick={() => onCancel(offerId)}
              className="px-4 py-2 rounded-full text-sm font-medium border border-white/[0.10] text-white/70 hover:bg-white/[0.05] transition-all"
            >
              Bekor qilish
            </button>
          )}
          {offer.status !== 'pending' && (
            <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium border ${statusStyles[offer.status]}`}>
              {statusLabel[offer.status]}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

/* ── Batafsil ko'rinish — e'lon + barcha takliflar ── */
function OfferDetailView({ offer, allOffers, onBack, onAccept, onReject }) {
  const [listing, setListing] = useState(null);
  const [listingOffers, setListingOffers] = useState([]);
  const [loading, setLoading] = useState(true);

  // E'lon va uning barcha takliflarini yuklash
  useEffect(() => {
    if (!offer.listing_id) { setLoading(false); return; }

    Promise.all([
      listingsAPI.getOne(offer.listing_id).then(r => r.data?.listing).catch(() => null),
      listingsAPI.getOffers(offer.listing_id).then(r => r.data?.offers || []).catch(() => []),
    ]).then(([listingData, offersData]) => {
      setListing(listingData);
      setListingOffers(offersData);
    }).finally(() => setLoading(false));
  }, [offer.listing_id]);

  if (loading) return <LoadingSpinner size="lg" />;

  return (
    <div className="animate-fadeIn">
      {/* Back */}
      <button onClick={onBack} className="flex items-center gap-1.5 text-white/40 hover:text-white/70 text-sm mb-6 transition-colors">
        <ArrowLeft size={16} /> Orqaga
      </button>

      {/* Plate + Info */}
      <div className="glass-card p-6 sm:p-8 mb-6">
        <div className="flex flex-col items-center mb-6">
          <PlateDisplay plateNumber={offer.plate_number || listing?.plate_number} size="lg" />
          {listing && (
            <p className="text-white/40 text-sm mt-3">{getRegionName(listing.region_code)}</p>
          )}
        </div>

        {listing && (
          <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-white/40">
            <span className="text-2xl font-bold text-[#30D158]">{formatPrice(listing.price)}</span>
            <span className="flex items-center gap-1"><Eye size={14} /> {listing.views_count || 0}</span>
            <span className="flex items-center gap-1"><Heart size={14} /> {listing.likes_count || 0}</span>
          </div>
        )}

        {listing?.description && (
          <p className="text-white/40 text-sm mt-4 text-center">{listing.description}</p>
        )}
      </div>

      {/* Barcha takliflar */}
      <div className="glass-card p-5 sm:p-6">
        <h3 className="text-base font-bold text-white/85 mb-4">
          Kelgan takliflar
          {listingOffers.length > 0 && (
            <span className="ml-2 text-xs bg-[#0A84FF]/15 text-[#0A84FF] rounded-full px-2 py-0.5">
              {listingOffers.length}
            </span>
          )}
        </h3>

        {listingOffers.length === 0 ? (
          <p className="text-white/30 text-sm text-center py-6">Takliflar yo'q</p>
        ) : (
          <div className="space-y-3">
            {listingOffers.map((o) => {
              const isThisOffer = o.id === offer.id;
              return (
                <div
                  key={o.id}
                  className={`rounded-xl p-4 border transition-all ${
                    isThisOffer
                      ? 'border-[#0A84FF]/30 bg-[#0A84FF]/[0.05]'
                      : 'border-white/[0.06] bg-white/[0.02]'
                  }`}
                >
                  {/* Buyer info */}
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 bg-[#0A84FF]/15 rounded-full flex items-center justify-center shrink-0">
                        <User size={15} className="text-[#0A84FF]" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-white/85">{o.buyer_name || 'Xaridor'}</p>
                        {o.buyer_phone && (
                          <a href={`tel:${o.buyer_phone}`} className="flex items-center gap-1 text-xs text-[#0A84FF] mt-0.5">
                            <Phone size={10} /> {formatPhone(o.buyer_phone)}
                          </a>
                        )}
                      </div>
                    </div>
                    <span className={`rounded-full px-2 py-0.5 text-[11px] font-medium border ${statusStyles[o.status]}`}>
                      {statusLabel[o.status]}
                    </span>
                  </div>

                  {/* Amount */}
                  <p className="text-xl font-bold text-[#30D158] mb-2">{formatPrice(o.amount)}</p>

                  {/* Message */}
                  {o.message && (
                    <div className="flex items-start gap-2 rounded-lg p-2.5 mb-2" style={{ background: 'rgba(255,255,255,0.03)' }}>
                      <MessageSquare size={13} className="text-white/20 mt-0.5 shrink-0" />
                      <p className="text-sm text-white/45">{o.message}</p>
                    </div>
                  )}

                  {/* Time + Actions */}
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-[11px] text-white/20">{formatRelativeDate(o.created_at)}</span>
                    {o.status === 'pending' && (
                      <div className="flex gap-2">
                        <button
                          onClick={() => onAccept(o.id)}
                          className="px-3 py-1.5 bg-[#30D158] text-white rounded-full text-xs font-medium"
                        >
                          Qabul
                        </button>
                        <button
                          onClick={() => onReject(o.id)}
                          className="px-3 py-1.5 rounded-full text-xs font-medium border border-white/[0.10] text-white/70"
                        >
                          Rad
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

/* ── Asosiy sahifa ── */
export default function MyOffers() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('sent');
  const [selectedOffer, setSelectedOffer] = useState(null);

  const { data: sentData, isLoading: sentLoading, refetch: refetchSent } = useSentOffers();
  const { data: receivedData, isLoading: receivedLoading, refetch: refetchReceived } = useReceivedOffers();
  const acceptOffer = useAcceptOffer();
  const rejectOffer = useRejectOffer();

  const sentOffers = sentData?.offers || [];
  const receivedOffers = receivedData?.offers || [];

  const handleAccept = async (id) => {
    try {
      await acceptOffer.mutateAsync(id);
      toast.success('Taklif qabul qilindi!');
      refetchReceived();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Xatolik yuz berdi');
    }
  };

  const handleReject = async (id) => {
    try {
      await rejectOffer.mutateAsync(id);
      toast.success('Taklif rad etildi');
      refetchReceived();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Xatolik yuz berdi');
    }
  };

  const handleCancel = async (id) => {
    try {
      await offersAPI.cancel(id);
      toast.success('Taklif bekor qilindi');
      refetchSent();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Xatolik yuz berdi');
    }
  };

  // Batafsil ko'rinish
  if (selectedOffer) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <OfferDetailView
          offer={selectedOffer}
          onBack={() => setSelectedOffer(null)}
          onAccept={handleAccept}
          onReject={handleReject}
        />
      </div>
    );
  }

  const isLoading = activeTab === 'sent' ? sentLoading : receivedLoading;
  const offers = activeTab === 'sent' ? sentOffers : receivedOffers;

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <h1 className="text-2xl sm:text-3xl font-bold text-white/90 mb-8">Takliflarim</h1>

      {/* Tabs */}
      <div className="flex gap-2 mb-8">
        {[
          { key: 'sent', label: 'Yuborgan', icon: Send, count: sentOffers.length },
          { key: 'received', label: 'Kelgan', icon: Inbox, count: receivedOffers.length },
        ].map((tab) => {
          const Icon = tab.icon;
          const active = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-medium transition-all border ${
                active
                  ? 'bg-[#0A84FF] text-white border-transparent'
                  : 'text-white/50 border-white/[0.08] hover:bg-white/[0.04]'
              }`}
            >
              <Icon size={16} />
              {tab.label}
              {tab.count > 0 && (
                <span className={`rounded-full px-1.5 py-0.5 text-[11px] font-medium ${
                  active ? 'bg-white/20' : 'bg-[#0A84FF]/15 text-[#0A84FF]'
                }`}>
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Content */}
      {isLoading && <LoadingSpinner size="lg" />}

      {!isLoading && offers.length === 0 && (
        <div className="glass-card p-12 text-center">
          <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-white/[0.04] flex items-center justify-center">
            {activeTab === 'sent' ? <Send size={24} className="text-white/20" /> : <Inbox size={24} className="text-white/20" />}
          </div>
          <p className="text-white/45 mb-4">
            {activeTab === 'sent' ? 'Siz hali taklif yubormadingiz.' : 'Sizga hali takliflar kelmadi.'}
          </p>
          {activeTab === 'sent' && (
            <Link to="/" className="inline-flex items-center gap-2 bg-[#0A84FF] text-white px-5 py-2.5 rounded-full text-sm font-medium">
              E'lonlarni ko'rish
            </Link>
          )}
        </div>
      )}

      {!isLoading && offers.length > 0 && (
        <div className="space-y-3">
          {offers.map((offer) => (
            <OfferCard
              key={offer.id}
              offer={offer}
              type={activeTab}
              onAccept={handleAccept}
              onReject={handleReject}
              onCancel={handleCancel}
              onViewDetail={activeTab === 'received' ? setSelectedOffer : undefined}
            />
          ))}
        </div>
      )}
    </div>
  );
}
