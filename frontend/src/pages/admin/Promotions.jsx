import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { Megaphone, Plus, Star, Tag, Eye, Trash2, X } from 'lucide-react';
import { adminAPI, listingsAPI } from '../../services/api';
import { formatPrice } from '../../utils/formatters';
import { getRegionName } from '../../utils/plateUtils';

const Promotions = () => {
  const queryClient = useQueryClient();
  const [showFeaturedModal, setShowFeaturedModal] = useState(false);

  // Barcha aktiv e'lonlar
  const { data: listingsData, isLoading } = useQuery({
    queryKey: ['admin', 'listings', { status: 'active' }],
    queryFn: () => adminAPI.getListings({ status: 'active', per_page: 100 }).then(r => r.data),
  });

  const listings = listingsData?.listings || [];

  // Eng ko'p ko'rilganlar (top 5)
  const topViewed = [...listings].sort((a, b) => (b.views_count || 0) - (a.views_count || 0)).slice(0, 5);
  // Eng ko'p yoqtirilganlar (top 5)
  const topLiked = [...listings].sort((a, b) => (b.likes_count || 0) - (a.likes_count || 0)).slice(0, 5);
  // Eng qimmatlar (top 5)
  const topPriced = [...listings].sort((a, b) => (b.price || 0) - (a.price || 0)).slice(0, 5);

  const PlateTag = ({ number }) => (
    <span className="inline-flex items-center px-2.5 py-1 bg-white border-2 border-[#1a2a5e] rounded font-mono text-sm font-bold text-[#1a2a5e]">
      {number}
    </span>
  );

  const ListingRow = ({ listing, index, icon: Icon, iconColor }) => (
    <div className="flex items-center gap-3 py-3 px-4 hover:bg-gray-50 rounded-lg transition-colors">
      <span className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center text-xs font-bold text-gray-500">
        {index + 1}
      </span>
      <PlateTag number={listing.plate_number} />
      <span className="text-sm text-gray-500 hidden sm:inline">{getRegionName(listing.region_code)}</span>
      <div className="ml-auto flex items-center gap-2">
        <Icon className={`h-4 w-4 ${iconColor}`} />
        <span className="text-sm font-semibold text-gray-700">
          {Icon === Eye ? listing.views_count :
           Icon === Star ? listing.likes_count :
           formatPrice(listing.price)}
        </span>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-amber-50 rounded-lg">
            <Megaphone className="h-6 w-6 text-amber-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Reklama va Aksiyalar</h1>
            <p className="text-sm text-gray-500">Top e'lonlar va featured raqamlar</p>
          </div>
        </div>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl p-5 text-white">
          <div className="flex items-center gap-2 mb-2">
            <Tag className="h-5 w-5 opacity-80" />
            <span className="text-sm opacity-90">Jami aktiv e'lonlar</span>
          </div>
          <p className="text-3xl font-bold">{listings.length}</p>
        </div>
        <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-2xl p-5 text-white">
          <div className="flex items-center gap-2 mb-2">
            <Eye className="h-5 w-5 opacity-80" />
            <span className="text-sm opacity-90">Jami ko'rishlar</span>
          </div>
          <p className="text-3xl font-bold">
            {listings.reduce((sum, l) => sum + (l.views_count || 0), 0).toLocaleString()}
          </p>
        </div>
        <div className="bg-gradient-to-br from-rose-500 to-rose-600 rounded-2xl p-5 text-white">
          <div className="flex items-center gap-2 mb-2">
            <Star className="h-5 w-5 opacity-80" />
            <span className="text-sm opacity-90">Jami like</span>
          </div>
          <p className="text-3xl font-bold">
            {listings.reduce((sum, l) => sum + (l.likes_count || 0), 0).toLocaleString()}
          </p>
        </div>
      </div>

      {/* Top listings grids */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Top viewed */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2">
            <Eye className="h-4 w-4 text-blue-500" />
            <h3 className="font-semibold text-gray-800">Eng ko'p ko'rilgan</h3>
          </div>
          <div className="p-2">
            {isLoading ? (
              <div className="p-8 text-center">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto" />
              </div>
            ) : topViewed.length === 0 ? (
              <p className="text-center text-gray-400 py-8 text-sm">E'lonlar yo'q</p>
            ) : (
              topViewed.map((l, i) => (
                <ListingRow key={l.id} listing={l} index={i} icon={Eye} iconColor="text-blue-500" />
              ))
            )}
          </div>
        </div>

        {/* Top liked */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2">
            <Star className="h-4 w-4 text-amber-500" />
            <h3 className="font-semibold text-gray-800">Eng ko'p yoqtirilgan</h3>
          </div>
          <div className="p-2">
            {isLoading ? (
              <div className="p-8 text-center">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto" />
              </div>
            ) : topLiked.length === 0 ? (
              <p className="text-center text-gray-400 py-8 text-sm">E'lonlar yo'q</p>
            ) : (
              topLiked.map((l, i) => (
                <ListingRow key={l.id} listing={l} index={i} icon={Star} iconColor="text-amber-500" />
              ))
            )}
          </div>
        </div>

        {/* Most expensive */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2">
            <Tag className="h-4 w-4 text-emerald-500" />
            <h3 className="font-semibold text-gray-800">Eng qimmat raqamlar</h3>
          </div>
          <div className="p-2">
            {isLoading ? (
              <div className="p-8 text-center">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto" />
              </div>
            ) : topPriced.length === 0 ? (
              <p className="text-center text-gray-400 py-8 text-sm">E'lonlar yo'q</p>
            ) : (
              topPriced.map((l, i) => (
                <ListingRow key={l.id} listing={l} index={i} icon={Tag} iconColor="text-emerald-500" />
              ))
            )}
          </div>
        </div>
      </div>

      {/* Info box */}
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-5">
        <div className="flex items-start gap-3">
          <Megaphone className="h-5 w-5 text-amber-600 mt-0.5 shrink-0" />
          <div>
            <h4 className="font-semibold text-amber-800">Reklama va aksiyalar haqida</h4>
            <p className="text-sm text-amber-700 mt-1">
              Premium e'lonlar, featured raqamlar va chegirma aksiyalari tizimi keyingi versiyada qo'shiladi.
              Hozircha yuqoridagi statistika orqali eng mashhur raqamlarni kuzatishingiz mumkin.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Promotions;
