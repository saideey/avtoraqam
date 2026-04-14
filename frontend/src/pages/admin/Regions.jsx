import { useQuery } from '@tanstack/react-query';
import { adminAPI } from '../../services/api';
import { MapPin } from 'lucide-react';

const Regions = () => {
  const { data, isLoading, error } = useQuery({
    queryKey: ['admin', 'regions'],
    queryFn: () => adminAPI.getRegions().then((r) => r.data),
  });

  const regions = Array.isArray(data) ? data : data?.regions || [];

  // Sort by listing count descending
  const sorted = [...regions].sort(
    (a, b) => (b.count || b.listings_count || 0) - (a.count || a.listings_count || 0)
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Viloyatlar</h1>
        <p className="mt-1 text-sm text-gray-500">
          Barcha viloyatlar va ularning faol e'lonlari soni
        </p>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div
              key={i}
              className="h-32 bg-white rounded-xl border border-gray-200 animate-pulse"
            />
          ))}
        </div>
      ) : error ? (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-12 text-center">
          <p className="text-sm text-red-500">
            Ma'lumotlarni yuklashda xatolik yuz berdi.
          </p>
        </div>
      ) : sorted.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-12 text-center">
          <MapPin className="h-10 w-10 text-gray-300 mx-auto mb-3" />
          <p className="text-sm text-gray-500">Viloyatlar topilmadi</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {sorted.map((region, idx) => {
            const code = region.code || region.region_code || '';
            const name = region.name || region.region_name || '';
            const count = region.count || region.listings_count || 0;

            return (
              <div
                key={code || idx}
                className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 hover:shadow-md transition-shadow flex flex-col items-center text-center"
              >
                <div className="rounded-full bg-blue-50 p-3 mb-3">
                  <MapPin className="h-5 w-5 text-blue-600" />
                </div>
                <span className="text-3xl font-bold text-gray-900 font-mono tracking-wider">
                  {code}
                </span>
                <span className="mt-1 text-sm font-medium text-gray-600">
                  {name}
                </span>
                <span className="mt-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700">
                  {count} ta faol e'lon
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Regions;
