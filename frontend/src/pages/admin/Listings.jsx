import { useState, useCallback, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import {
  Search,
  Download,
  Trash2,
  ExternalLink,
  Eye,
  Heart,
  ChevronLeft,
  ChevronRight,
  Tag,
  AlertTriangle,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { adminAPI } from '../../services/api';
import { useAuth } from '../../hooks/useAuth';
import { getRegionName } from '../../utils/plateUtils';
import { formatPrice, formatDate } from '../../utils/formatters';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const PER_PAGE = 20;

const STATUS_TABS = [
  { key: '', label: 'Barchasi' },
  { key: 'active', label: 'Faol' },
  { key: 'sold', label: 'Sotilgan' },
  { key: 'cancelled', label: 'Bekor qilingan' },
];

const STATUS_STYLES = {
  active: 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-600/20',
  sold: 'bg-blue-50 text-blue-700 ring-1 ring-blue-600/20',
  cancelled: 'bg-red-50 text-red-600 ring-1 ring-red-600/20',
};

const STATUS_LABELS = {
  active: 'Faol',
  sold: 'Sotilgan',
  cancelled: 'Bekor qilingan',
};

// ---------------------------------------------------------------------------
// Delete confirmation modal
// ---------------------------------------------------------------------------

function DeleteConfirmModal({ listing, onConfirm, onCancel, isDeleting }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
          <AlertTriangle size={24} className="text-red-600" />
        </div>
        <h3 className="mt-4 text-center text-lg font-semibold text-gray-900">
          E'lonni o'chirish
        </h3>
        <p className="mt-2 text-center text-sm text-gray-500">
          <span className="font-mono font-bold text-gray-900">
            {listing.plate_number}
          </span>{' '}
          raqamli e'lonni o'chirmoqchimisiz? Bu amalni qaytarib bo'lmaydi.
        </p>
        <div className="mt-6 flex gap-3">
          <button
            onClick={onCancel}
            disabled={isDeleting}
            className="flex-1 rounded-xl border border-gray-200 bg-white py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Bekor qilish
          </button>
          <button
            onClick={onConfirm}
            disabled={isDeleting}
            className="flex-1 rounded-xl bg-red-600 py-2.5 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-60 transition-colors"
          >
            {isDeleting ? "O'chirilmoqda..." : "Ha, o'chirish"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Mini plate component
// ---------------------------------------------------------------------------

function MiniPlate({ plateNumber }) {
  if (!plateNumber) return <span className="text-gray-400">-</span>;
  return (
    <span className="inline-flex items-center rounded-md border-2 border-slate-800 bg-white px-2.5 py-1 font-mono text-xs font-bold tracking-wider text-slate-800">
      <span className="mr-1.5 text-[10px] font-bold text-blue-700">UZ</span>
      {plateNumber}
    </span>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

const Listings = () => {
  const queryClient = useQueryClient();
  const { user: currentUser } = useAuth();
  const isSuperAdmin = currentUser?.role === 'superadmin';

  const [page, setPage] = useState(1);
  const [status, setStatus] = useState('');
  const [search, setSearch] = useState('');
  const [deleteTarget, setDeleteTarget] = useState(null);

  // Debounced search
  const searchTimeout = useRef(null);
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const handleSearch = useCallback((value) => {
    setSearch(value);
    clearTimeout(searchTimeout.current);
    searchTimeout.current = setTimeout(() => {
      setDebouncedSearch(value);
      setPage(1);
    }, 400);
  }, []);

  // Query
  const { data, isLoading, isFetching } = useQuery({
    queryKey: ['admin', 'listings', { page, status, search: debouncedSearch }],
    queryFn: () =>
      adminAPI
        .getListings({
          page,
          status: status || undefined,
          search: debouncedSearch || undefined,
          per_page: PER_PAGE,
        })
        .then((r) => r.data),
    keepPreviousData: true,
  });

  const listings = data?.items || data?.listings || [];
  const totalPages = data?.total_pages || 1;
  const totalCount = data?.total || listings.length;

  // Status counts (may come from API)
  const counts = {
    '': totalCount,
    active: data?.active_count ?? null,
    sold: data?.sold_count ?? null,
    cancelled: data?.cancelled_count ?? null,
  };

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: (id) => adminAPI.deleteListing(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['admin', 'listings']);
      toast.success("E'lon o'chirildi");
      setDeleteTarget(null);
    },
    onError: () => {
      toast.error('Xatolik yuz berdi');
      setDeleteTarget(null);
    },
  });

  // Export
  const handleExport = async () => {
    try {
      const response = await adminAPI.exportListings();
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'listings.csv');
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      toast.success('Eksport tayyor!');
    } catch {
      toast.error('Eksport amalga oshmadi');
    }
  };

  // Pagination helpers
  const pageNumbers = [];
  const maxVisible = 5;
  let startPage = Math.max(1, page - Math.floor(maxVisible / 2));
  let endPage = Math.min(totalPages, startPage + maxVisible - 1);
  if (endPage - startPage < maxVisible - 1) {
    startPage = Math.max(1, endPage - maxVisible + 1);
  }
  for (let i = startPage; i <= endPage; i++) pageNumbers.push(i);

  return (
    <div className="space-y-6">
      {/* ---------- Header ---------- */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
            <Tag size={20} />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">
              E'lonlar boshqaruvi
            </h1>
            <p className="text-sm text-gray-500">
              Jami{' '}
              <span className="inline-flex items-center rounded-full bg-amber-50 px-2 py-0.5 text-xs font-semibold text-amber-700">
                {totalCount}
              </span>{' '}
              e'lon
            </p>
          </div>
        </div>

        {isSuperAdmin && (
          <button
            onClick={handleExport}
            className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-emerald-700 transition-colors"
          >
            <Download size={16} />
            CSV eksport
          </button>
        )}
      </div>

      {/* ---------- Status tabs + Search ---------- */}
      <div className="flex flex-col gap-4 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-gray-100 lg:flex-row lg:items-center lg:justify-between">
        {/* Tabs */}
        <div className="flex gap-1 rounded-xl bg-gray-100 p-1">
          {STATUS_TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => { setStatus(tab.key); setPage(1); }}
              className={`relative rounded-lg px-4 py-2 text-sm font-medium transition-all ${
                status === tab.key
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab.label}
              {counts[tab.key] != null && (
                <span
                  className={`ml-1.5 text-xs ${
                    status === tab.key ? 'text-blue-600' : 'text-gray-400'
                  }`}
                >
                  {counts[tab.key]}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative w-full lg:w-72">
          <Search
            size={18}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
          />
          <input
            type="text"
            value={search}
            onChange={(e) => handleSearch(e.target.value)}
            placeholder="Raqam bo'yicha qidirish..."
            className="w-full rounded-xl border border-gray-200 bg-gray-50 py-2.5 pl-10 pr-4 text-sm placeholder-gray-400 transition focus:border-blue-300 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          />
          {isFetching && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
            </div>
          )}
        </div>
      </div>

      {/* ---------- Table ---------- */}
      <div className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-gray-100">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/80">
                {[
                  '#',
                  'Raqam',
                  'Viloyat',
                  'Sotuvchi',
                  'Narx',
                  'Holat',
                  "Ko'rishlar / Like",
                  'Sana',
                  'Amallar',
                ].map((h) => (
                  <th
                    key={h}
                    className="whitespace-nowrap px-4 py-3 text-xs font-semibold uppercase tracking-wider text-gray-500"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {isLoading ? (
                <tr>
                  <td colSpan={9} className="py-20 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <div className="h-8 w-8 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
                      <span className="text-sm text-gray-400">Yuklanmoqda...</span>
                    </div>
                  </td>
                </tr>
              ) : listings.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-20 text-center">
                    <div className="flex flex-col items-center gap-2">
                      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gray-100">
                        <Tag size={28} className="text-gray-300" />
                      </div>
                      <p className="text-base font-medium text-gray-400">
                        E'lonlar topilmadi
                      </p>
                      <p className="text-sm text-gray-400">
                        Qidiruv yoki filter parametrlarini o'zgartiring
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                listings.map((item, idx) => {
                  const rowNum = (page - 1) * PER_PAGE + idx + 1;
                  const regionCode = item.region || (item.plate_number ? item.plate_number.slice(0, 2) : null);

                  return (
                    <tr
                      key={item.id}
                      className="group transition-colors hover:bg-gray-50/70"
                    >
                      {/* # */}
                      <td className="whitespace-nowrap px-4 py-3 text-gray-400 font-mono text-xs">
                        {rowNum}
                      </td>

                      {/* Raqam */}
                      <td className="whitespace-nowrap px-4 py-3">
                        <MiniPlate plateNumber={item.plate_number} />
                      </td>

                      {/* Viloyat */}
                      <td className="whitespace-nowrap px-4 py-3 text-gray-600 text-xs">
                        {regionCode ? getRegionName(regionCode) : '-'}
                      </td>

                      {/* Sotuvchi */}
                      <td className="whitespace-nowrap px-4 py-3 text-gray-700">
                        {item.user_name || item.seller_name || item.user?.full_name || item.user?.name || '-'}
                      </td>

                      {/* Narx */}
                      <td className="whitespace-nowrap px-4 py-3 font-semibold text-gray-900">
                        {item.price != null ? formatPrice(item.price) : '-'}
                      </td>

                      {/* Holat */}
                      <td className="whitespace-nowrap px-4 py-3">
                        <span
                          className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                            STATUS_STYLES[item.status] || 'bg-gray-100 text-gray-600'
                          }`}
                        >
                          {STATUS_LABELS[item.status] || item.status}
                        </span>
                      </td>

                      {/* Ko'rishlar / Like */}
                      <td className="whitespace-nowrap px-4 py-3">
                        <div className="flex items-center gap-3 text-xs text-gray-500">
                          <span className="inline-flex items-center gap-1">
                            <Eye size={14} className="text-gray-400" />
                            {item.views_count ?? 0}
                          </span>
                          <span className="inline-flex items-center gap-1">
                            <Heart size={14} className="text-rose-400" />
                            {item.likes_count ?? 0}
                          </span>
                        </div>
                      </td>

                      {/* Sana */}
                      <td className="whitespace-nowrap px-4 py-3 text-gray-500 text-xs">
                        {formatDate(item.created_at)}
                      </td>

                      {/* Amallar */}
                      <td className="whitespace-nowrap px-4 py-3">
                        <div className="flex items-center gap-1">
                          <Link
                            to={`/listings/${item.id}`}
                            className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 hover:bg-blue-50 hover:text-blue-600 transition-colors"
                            title="Ko'rish"
                          >
                            <ExternalLink size={15} />
                          </Link>
                          <button
                            onClick={() => setDeleteTarget(item)}
                            className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 hover:bg-red-50 hover:text-red-600 transition-colors"
                            title="O'chirish"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* ---------- Pagination ---------- */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-gray-100 px-4 py-3">
            <p className="text-xs text-gray-500">
              {(page - 1) * PER_PAGE + 1}&ndash;
              {Math.min(page * PER_PAGE, totalCount)} / {totalCount}
            </p>

            <div className="flex items-center gap-1">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-gray-500 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft size={16} />
              </button>

              {startPage > 1 && (
                <>
                  <button
                    onClick={() => setPage(1)}
                    className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-sm text-gray-600 hover:bg-gray-100 transition-colors"
                  >
                    1
                  </button>
                  {startPage > 2 && (
                    <span className="px-1 text-gray-400 text-xs">...</span>
                  )}
                </>
              )}

              {pageNumbers.map((n) => (
                <button
                  key={n}
                  onClick={() => setPage(n)}
                  className={`inline-flex h-8 w-8 items-center justify-center rounded-lg text-sm font-medium transition-colors ${
                    n === page
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  {n}
                </button>
              ))}

              {endPage < totalPages && (
                <>
                  {endPage < totalPages - 1 && (
                    <span className="px-1 text-gray-400 text-xs">...</span>
                  )}
                  <button
                    onClick={() => setPage(totalPages)}
                    className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-sm text-gray-600 hover:bg-gray-100 transition-colors"
                  >
                    {totalPages}
                  </button>
                </>
              )}

              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-gray-500 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ---------- Delete confirmation modal ---------- */}
      {deleteTarget && (
        <DeleteConfirmModal
          listing={deleteTarget}
          isDeleting={deleteMutation.isLoading}
          onConfirm={() => deleteMutation.mutate(deleteTarget.id)}
          onCancel={() => setDeleteTarget(null)}
        />
      )}
    </div>
  );
};

export default Listings;
