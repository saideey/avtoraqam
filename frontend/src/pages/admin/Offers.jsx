import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { adminAPI } from '../../services/api';
import { formatPrice, formatRelativeDate, formatPhone } from '../../utils/formatters';
import { DollarSign, Phone, MessageSquare, Clock, ChevronLeft, ChevronRight, Inbox } from 'lucide-react';

const STATUS_TABS = [
  { key: '', label: 'Barchasi' },
  { key: 'pending', label: 'Kutilmoqda' },
  { key: 'accepted', label: 'Qabul qilingan' },
  { key: 'rejected', label: 'Rad etilgan' },
];

const STATUS_CONFIG = {
  pending: {
    label: 'Kutilmoqda',
    bg: 'bg-amber-50',
    text: 'text-amber-700',
    ring: 'ring-amber-600/20',
    dot: 'bg-amber-500',
  },
  accepted: {
    label: 'Qabul qilindi',
    bg: 'bg-emerald-50',
    text: 'text-emerald-700',
    ring: 'ring-emerald-600/20',
    dot: 'bg-emerald-500',
  },
  rejected: {
    label: 'Rad etildi',
    bg: 'bg-red-50',
    text: 'text-red-700',
    ring: 'ring-red-600/20',
    dot: 'bg-red-500',
  },
  cancelled: {
    label: 'Bekor qilindi',
    bg: 'bg-gray-50',
    text: 'text-gray-600',
    ring: 'ring-gray-500/20',
    dot: 'bg-gray-400',
  },
};

const Offers = () => {
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('');

  const params = { page, per_page: 20 };
  if (statusFilter) params.status = statusFilter;

  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'offers', params],
    queryFn: () => adminAPI.getOffers(params).then((res) => res.data),
    keepPreviousData: true,
  });

  const offers = data?.offers || data?.items || [];
  const totalPages = data?.pagination?.pages || data?.total_pages || 1;
  const totalCount = data?.pagination?.total || data?.total || offers.length;

  const handleTabChange = (key) => {
    setStatusFilter(key);
    setPage(1);
  };

  const truncate = (str, max = 50) => {
    if (!str) return '-';
    return str.length > max ? str.slice(0, max) + '...' : str;
  };

  const getStatusBadge = (status) => {
    const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.cancelled;
    return (
      <span
        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ring-1 ring-inset ${cfg.bg} ${cfg.text} ${cfg.ring}`}
      >
        <span className={`h-1.5 w-1.5 rounded-full ${cfg.dot}`} />
        {cfg.label}
      </span>
    );
  };

  // Generate page numbers for pagination
  const getPageNumbers = () => {
    const pages = [];
    const maxVisible = 5;
    let start = Math.max(1, page - Math.floor(maxVisible / 2));
    let end = Math.min(totalPages, start + maxVisible - 1);
    if (end - start + 1 < maxVisible) {
      start = Math.max(1, end - maxVisible + 1);
    }
    for (let i = start; i <= end; i++) {
      pages.push(i);
    }
    return pages;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Takliflar boshqaruvi</h1>
          <p className="mt-1 text-sm text-gray-500">
            Barcha takliflarni ko'ring va boshqaring
          </p>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <DollarSign className="h-4 w-4" />
          <span>Jami: <strong className="text-gray-900">{totalCount}</strong> ta taklif</span>
        </div>
      </div>

      {/* Status filter tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex gap-6" aria-label="Tabs">
          {STATUS_TABS.map((tab) => {
            const isActive = statusFilter === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => handleTabChange(tab.key)}
                className={`whitespace-nowrap border-b-2 pb-3 px-1 text-sm font-medium transition-colors ${
                  isActive
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <div className="flex flex-col items-center gap-3">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-blue-600" />
              <span className="text-sm text-gray-500">Yuklanmoqda...</span>
            </div>
          </div>
        ) : offers.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 px-4">
            <div className="rounded-full bg-gray-100 p-4 mb-4">
              <Inbox className="h-8 w-8 text-gray-400" />
            </div>
            <h3 className="text-base font-semibold text-gray-900 mb-1">
              Takliflar topilmadi
            </h3>
            <p className="text-sm text-gray-500 text-center max-w-sm">
              {statusFilter
                ? "Tanlangan filtr bo'yicha takliflar mavjud emas."
                : "Hozircha hech qanday taklif kelib tushmagan."}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead>
                <tr className="bg-gray-50">
                  <th className="px-4 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    #
                  </th>
                  <th className="px-4 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Xaridor
                  </th>
                  <th className="px-4 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Qaysi raqamga
                  </th>
                  <th className="px-4 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Miqdor
                  </th>
                  <th className="px-4 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Izoh
                  </th>
                  <th className="px-4 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Holat
                  </th>
                  <th className="px-4 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Vaqt
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 bg-white">
                {offers.map((offer, idx) => {
                  const buyerName =
                    offer.buyer_name || offer.buyer?.full_name || offer.buyer?.name || '-';
                  const buyerPhone =
                    offer.buyer_phone || offer.buyer?.phone || offer.phone || '';
                  const plateNumber =
                    offer.plate_number || offer.listing?.plate_number || '-';
                  const message = offer.message || offer.comment || offer.note || '';

                  return (
                    <tr
                      key={offer.id || idx}
                      className="hover:bg-gray-50/50 transition-colors"
                    >
                      {/* # */}
                      <td className="px-4 py-3.5 text-sm text-gray-500 whitespace-nowrap">
                        {(page - 1) * 20 + idx + 1}
                      </td>

                      {/* Xaridor */}
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <div className="flex flex-col">
                          <span className="text-sm font-medium text-gray-900">
                            {buyerName}
                          </span>
                          {buyerPhone && (
                            <span className="flex items-center gap-1 text-xs text-gray-500 mt-0.5">
                              <Phone className="h-3 w-3" />
                              {formatPhone(buyerPhone)}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Raqam (plate) */}
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <span className="inline-flex items-center px-2.5 py-1 rounded-md bg-gray-900 text-white font-mono text-sm font-bold tracking-wider">
                          {plateNumber}
                        </span>
                      </td>

                      {/* Miqdor */}
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <span className="text-sm font-bold text-gray-900">
                          {offer.amount != null ? formatPrice(offer.amount) : '-'}
                        </span>
                      </td>

                      {/* Izoh */}
                      <td className="px-4 py-3.5 max-w-[200px]">
                        {message ? (
                          <span
                            className="text-sm text-gray-600 block truncate"
                            title={message}
                          >
                            <MessageSquare className="inline h-3.5 w-3.5 mr-1 text-gray-400 -translate-y-px" />
                            {truncate(message)}
                          </span>
                        ) : (
                          <span className="text-sm text-gray-300">-</span>
                        )}
                      </td>

                      {/* Holat */}
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        {getStatusBadge(offer.status)}
                      </td>

                      {/* Vaqt */}
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <span className="flex items-center gap-1 text-sm text-gray-500">
                          <Clock className="h-3.5 w-3.5" />
                          {offer.created_at ? formatRelativeDate(offer.created_at) : '-'}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && !isLoading && offers.length > 0 && (
          <div className="flex items-center justify-between border-t border-gray-200 bg-gray-50/50 px-4 py-3">
            <p className="text-sm text-gray-600">
              Sahifa <strong>{page}</strong> / <strong>{totalPages}</strong>
            </p>
            <nav className="flex items-center gap-1">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="inline-flex items-center justify-center h-8 w-8 rounded-lg border border-gray-200 bg-white text-gray-500 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              {getPageNumbers().map((p) => (
                <button
                  key={p}
                  onClick={() => setPage(p)}
                  className={`inline-flex items-center justify-center h-8 w-8 rounded-lg text-sm font-medium transition-colors ${
                    p === page
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'border border-gray-200 bg-white text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  {p}
                </button>
              ))}
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="inline-flex items-center justify-center h-8 w-8 rounded-lg border border-gray-200 bg-white text-gray-500 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </nav>
          </div>
        )}
      </div>
    </div>
  );
};

export default Offers;
