import { useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Plus, Edit3, Trash2, Eye, Heart, AlertTriangle, X } from 'lucide-react';
import { useMyListings, useDeleteListing } from '../hooks/useListings';
import { formatPrice } from '../utils/formatters';
import PlateDisplay from '../components/listing/PlateDisplay';
import LoadingSpinner from '../components/common/LoadingSpinner';

export default function MyListings() {
  const { data, isLoading, isError } = useMyListings();
  const deleteListing = useDeleteListing();
  const [deleteId, setDeleteId] = useState(null);

  const listings = data?.listings || data?.data || data || [];

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await deleteListing.mutateAsync(deleteId);
      toast.success("E'lon o'chirildi");
    } catch (err) {
      toast.error(err.response?.data?.detail || "O'chirishda xatolik yuz berdi");
    } finally {
      setDeleteId(null);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <img src="/icons/icons8-bookmark-50.svg" alt="" className="w-7 h-7" />
          <h1 className="text-2xl sm:text-3xl font-bold text-white/95">
            Mening e'lonlarim
          </h1>
          {!isLoading && listings.length > 0 && (
            <span className="bg-[#0A84FF]/15 text-[#0A84FF] border border-[#0A84FF]/25 rounded-full px-2.5 py-0.5 text-xs font-medium">
              {listings.length}
            </span>
          )}
        </div>
        <Link
          to="/create-listing"
          className="inline-flex items-center gap-2 bg-[#0A84FF] hover:bg-[#0A84FF]/90 text-white px-5 py-2.5 rounded-full font-semibold shadow-[0_0_20px_rgba(10,132,255,0.3)] hover:shadow-[0_0_30px_rgba(10,132,255,0.45)] transition-all duration-200"
        >
          <Plus size={20} />
          <span className="hidden sm:inline">Yangi e'lon</span>
        </Link>
      </div>

      {/* Loading */}
      {isLoading && <LoadingSpinner size="lg" />}

      {/* Error */}
      {isError && (
        <div
          className="rounded-[20px] p-6 text-center border border-[#FF453A]/20"
          style={{
            background: 'rgba(255,69,58,0.08)',
            backdropFilter: 'blur(24px) saturate(180%)',
          }}
        >
          <p className="text-[#FF453A]">Ma'lumotlarni yuklashda xatolik yuz berdi.</p>
        </div>
      )}

      {/* Empty state */}
      {!isLoading && !isError && listings.length === 0 && (
        <div
          className="relative rounded-[20px] p-12 text-center border border-white/12"
          style={{
            background: 'rgba(255,255,255,0.06)',
            backdropFilter: 'blur(24px) saturate(180%)',
            boxShadow: '0 4px 6px rgba(0,0,0,0.07), 0 10px 15px rgba(0,0,0,0.1), 0 20px 25px rgba(0,0,0,0.15), inset 0 0 0 1px rgba(255,255,255,0.05)',
          }}
        >
          {/* Top highlight */}
          <div className="absolute top-0 left-[10%] w-[80%] h-px bg-gradient-to-r from-transparent via-white/40 to-transparent" />
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-white/[0.06] border border-white/12 flex items-center justify-center">
            <Plus size={28} className="text-white/30" />
          </div>
          <p className="text-white/55 text-lg mb-6">Sizda hali e'lonlar yo'q.</p>
          <Link
            to="/create-listing"
            className="inline-flex items-center gap-2 bg-[#0A84FF] hover:bg-[#0A84FF]/90 text-white px-6 py-3 rounded-full font-semibold shadow-[0_0_20px_rgba(10,132,255,0.3)] hover:shadow-[0_0_30px_rgba(10,132,255,0.45)] transition-all duration-200"
          >
            <Plus size={20} />
            Birinchi e'lonni yarating
          </Link>
        </div>
      )}

      {/* Listings grid */}
      {!isLoading && !isError && listings.length > 0 && (
        <div className="grid gap-4">
          {listings.map((listing) => {
            const listingId = listing._id || listing.id;
            return (
              <div
                key={listingId}
                className="group relative rounded-[20px] p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center gap-4 border border-white/12 transition-all duration-[280ms]"
                style={{
                  background: 'rgba(255,255,255,0.06)',
                  backdropFilter: 'blur(24px) saturate(180%)',
                  boxShadow: '0 4px 6px rgba(0,0,0,0.07), 0 10px 15px rgba(0,0,0,0.1), 0 20px 25px rgba(0,0,0,0.15), inset 0 0 0 1px rgba(255,255,255,0.05)',
                  transitionTimingFunction: 'cubic-bezier(0.34,1.56,0.64,1)',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-4px) scale(1.01)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0) scale(1)';
                }}
              >
                {/* Top highlight */}
                <div className="absolute top-0 left-[10%] w-[80%] h-px bg-gradient-to-r from-transparent via-white/40 to-transparent" />

                {/* Plate display */}
                <Link to={`/listings/${listingId}`} className="shrink-0">
                  <PlateDisplay plateNumber={listing.plate_number} size="sm" />
                </Link>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="text-lg font-bold text-[#30D158]">
                    {formatPrice(listing.price)}
                  </p>
                  {listing.description && (
                    <p className="text-white/30 text-sm truncate mt-1">
                      {listing.description}
                    </p>
                  )}
                  <div className="flex items-center gap-4 mt-2">
                    <span className="flex items-center gap-1 text-sm text-white/30">
                      <Eye size={14} /> {listing.views || 0}
                    </span>
                    <span className="flex items-center gap-1 text-sm text-white/30">
                      <Heart size={14} /> {listing.likes_count || 0}
                    </span>
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-xs font-medium border ${
                        listing.status === 'active'
                          ? 'bg-[#30D158]/10 text-[#30D158] border-[#30D158]/25'
                          : listing.status === 'sold'
                          ? 'bg-white/[0.06] text-white/55 border-white/12'
                          : 'bg-[#FF9F0A]/10 text-[#FF9F0A] border-[#FF9F0A]/25'
                      }`}
                    >
                      {listing.status === 'active'
                        ? 'Faol'
                        : listing.status === 'sold'
                        ? 'Sotilgan'
                        : listing.status}
                    </span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 shrink-0">
                  <Link
                    to={`/edit-listing/${listingId}`}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full text-sm font-medium border border-white/20 text-white/95 transition-all duration-200 hover:bg-white/[0.08]"
                    style={{ background: 'rgba(255,255,255,0.06)' }}
                    title="Tahrirlash"
                  >
                    <Edit3 size={16} />
                    <span className="hidden sm:inline">Tahrirlash</span>
                  </Link>
                  <button
                    onClick={() => setDeleteId(listingId)}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full text-sm font-medium bg-[#FF453A]/10 border border-[#FF453A]/20 text-[#FF453A] hover:bg-[#FF453A]/20 transition-all duration-200"
                    title="O'chirish"
                  >
                    <img src="/icons/icons8-trash-50.svg" alt="" className="w-4 h-4" />
                    <span className="hidden sm:inline">O'chirish</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Delete confirmation modal */}
      {deleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-md"
            onClick={() => setDeleteId(null)}
          />
          {/* Modal */}
          <div
            className="relative rounded-[20px] p-6 sm:p-8 max-w-sm w-full border border-white/12"
            style={{
              background: 'rgba(255,255,255,0.08)',
              backdropFilter: 'blur(40px) saturate(180%)',
              boxShadow: '0 4px 6px rgba(0,0,0,0.07), 0 10px 15px rgba(0,0,0,0.1), 0 20px 25px rgba(0,0,0,0.15), inset 0 0 0 1px rgba(255,255,255,0.05)',
            }}
          >
            {/* Top highlight */}
            <div className="absolute top-0 left-[10%] w-[80%] h-px bg-gradient-to-r from-transparent via-white/40 to-transparent" />
            <button
              onClick={() => setDeleteId(null)}
              className="absolute top-4 right-4 text-white/30 hover:text-white/55 transition-all duration-200"
            >
              <X size={20} />
            </button>
            <div className="flex flex-col items-center text-center">
              <div className="w-14 h-14 rounded-full bg-[#FF453A]/15 border border-[#FF453A]/25 flex items-center justify-center mb-4">
                <AlertTriangle size={28} className="text-[#FF453A]" />
              </div>
              <h3 className="text-lg font-semibold text-white/95 mb-2">
                E'lonni o'chirish
              </h3>
              <p className="text-white/55 text-sm mb-6">
                Rostdan ham bu e'lonni o'chirmoqchimisiz? Bu amalni qaytarib bo'lmaydi.
              </p>
              <div className="flex gap-3 w-full">
                <button
                  onClick={() => setDeleteId(null)}
                  className="flex-1 rounded-full py-2.5 font-medium border border-white/20 text-white/95 transition-all duration-200 hover:bg-white/[0.08]"
                  style={{ background: 'rgba(255,255,255,0.06)' }}
                >
                  Bekor qilish
                </button>
                <button
                  onClick={handleDelete}
                  disabled={deleteListing.isPending}
                  className="flex-1 bg-[#FF453A] hover:bg-[#FF453A]/90 text-white rounded-full py-2.5 font-semibold transition-all duration-200 disabled:opacity-50"
                >
                  {deleteListing.isPending ? "O'chirilmoqda..." : "O'chirish"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
