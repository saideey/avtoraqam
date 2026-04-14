import { useState, useMemo, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  DollarSign,
  TrendingUp,
  Hash,
  Calculator,
  Calendar,
  X,
  Phone,
  User,
  Shield,
  CreditCard,
  ChevronLeft,
  ChevronRight,
  ArrowUpRight,
} from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { adminAPI } from '../../services/api';
import { formatPrice, formatPhone, formatDate, formatRelativeDate } from '../../utils/formatters';
import LoadingSpinner from '../../components/common/LoadingSpinner';

/* ------------------------------------------------------------------ */
/*  Constants                                                          */
/* ------------------------------------------------------------------ */

const PRESETS = [
  { key: 'today', label: 'Bugun' },
  { key: 'week', label: 'Hafta' },
  { key: 'month', label: 'Oy' },
  { key: 'year', label: 'Yil' },
  { key: 'all', label: 'Barchasi' },
];

const METHOD_TABS = [
  { key: '', label: 'Barchasi' },
  { key: 'click', label: 'Click' },
  { key: 'payme', label: 'Payme' },
  { key: 'paynet', label: 'Paynet' },
];

const METHOD_LOGOS = {
  click: '/click.png',
  payme: '/payme.png',
  paynet: '/paynet.png',
};

const METHOD_COLORS = {
  click: '#00B4E6',
  payme: '#33CCCC',
  paynet: '#00C853',
};

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

const getPresetDates = (key) => {
  const now = new Date();
  const to = now.toISOString().split('T')[0];
  let from;
  switch (key) {
    case 'today':
      from = to;
      break;
    case 'week': {
      const d = new Date(now);
      d.setDate(d.getDate() - 7);
      from = d.toISOString().split('T')[0];
      break;
    }
    case 'month': {
      const d = new Date(now);
      d.setMonth(d.getMonth() - 1);
      from = d.toISOString().split('T')[0];
      break;
    }
    case 'year': {
      const d = new Date(now);
      d.setFullYear(d.getFullYear() - 1);
      from = d.toISOString().split('T')[0];
      break;
    }
    case 'all':
    default:
      from = '';
      break;
  }
  return { from, to };
};

/* ------------------------------------------------------------------ */
/*  Glassmorphism style helpers                                        */
/* ------------------------------------------------------------------ */

const glassCard = {
  background: 'linear-gradient(145deg, rgba(18,20,38,0.75), rgba(10,12,24,0.65))',
  backdropFilter: 'blur(40px)',
  WebkitBackdropFilter: 'blur(40px)',
  border: '1px solid rgba(255,255,255,0.08)',
  borderRadius: '20px',
};

const glassCardLight = {
  background: 'linear-gradient(145deg, rgba(25,28,50,0.6), rgba(15,17,32,0.5))',
  backdropFilter: 'blur(30px)',
  WebkitBackdropFilter: 'blur(30px)',
  border: '1px solid rgba(255,255,255,0.06)',
  borderRadius: '16px',
};

const glassInner = {
  background: 'linear-gradient(145deg, rgba(30,33,58,0.5), rgba(18,20,38,0.4))',
  border: '1px solid rgba(255,255,255,0.05)',
  borderRadius: '14px',
};

const pageBackground = {
  background: 'linear-gradient(135deg, #0a0b14 0%, #0d0f1a 30%, #111327 60%, #0a0b14 100%)',
  minHeight: '100vh',
};

/* ------------------------------------------------------------------ */
/*  Sub-components                                                     */
/* ------------------------------------------------------------------ */

const GlassStatCard = ({ icon: Icon, label, value, subtitle, color = '#30D158' }) => (
  <div style={glassCard} className="p-5 hover:scale-[1.02] transition-transform duration-300">
    <div className="flex items-center gap-3 mb-3">
      <div
        className="w-11 h-11 rounded-2xl flex items-center justify-center"
        style={{ background: `${color}15`, border: `1px solid ${color}30` }}
      >
        <Icon size={20} style={{ color }} />
      </div>
      <p className="text-sm font-medium text-gray-400">{label}</p>
    </div>
    <p className="text-2xl font-bold" style={{ color }}>{value}</p>
    {subtitle && (
      <p className="text-xs text-gray-500 mt-1.5">{subtitle}</p>
    )}
  </div>
);

const MethodCard = ({ method, count, total, isActive, onClick }) => {
  const color = METHOD_COLORS[method] || '#0A84FF';
  return (
    <button
      onClick={onClick}
      style={{
        ...glassCardLight,
        border: isActive
          ? `1.5px solid ${color}80`
          : '1px solid rgba(255,255,255,0.06)',
        boxShadow: isActive ? `0 0 30px ${color}15` : 'none',
      }}
      className="p-5 text-left w-full hover:scale-[1.02] transition-all duration-300"
    >
      <div className="flex items-center gap-3 mb-3">
        <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center overflow-hidden">
          <img
            src={METHOD_LOGOS[method]}
            alt={method}
            className="w-7 h-7 object-contain"
            onError={(e) => { e.target.style.display = 'none'; }}
          />
        </div>
        <span className="text-sm font-semibold text-white capitalize">{method}</span>
      </div>
      <p className="text-lg font-bold text-white">{(count || 0).toLocaleString()} <span className="text-xs font-normal text-gray-400">ta</span></p>
      <p className="text-sm font-semibold mt-0.5" style={{ color: '#30D158' }}>
        {formatPrice(total || 0)}
      </p>
    </button>
  );
};

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload || payload.length === 0) return null;
  return (
    <div
      style={{
        background: 'rgba(18,20,38,0.95)',
        backdropFilter: 'blur(20px)',
        border: '1px solid rgba(255,255,255,0.1)',
        borderRadius: '12px',
        padding: '12px 16px',
        boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
      }}
    >
      <p className="text-xs text-gray-400 mb-2">{label}</p>
      {payload.map((entry, i) => (
        <p key={i} className="text-sm font-semibold" style={{ color: entry.color }}>
          {entry.name}: {entry.name === 'Daromad' ? formatPrice(entry.value) : entry.value}
        </p>
      ))}
    </div>
  );
};

const UserModal = ({ userId, onClose }) => {
  const { data: userData, isLoading: userLoading } = useQuery({
    queryKey: ['admin', 'user', userId],
    queryFn: () => adminAPI.getUser(userId).then((r) => r.data),
    enabled: !!userId,
  });

  const { data: userPayments, isLoading: paymentsLoading } = useQuery({
    queryKey: ['admin', 'payments', 'user', userId],
    queryFn: () => adminAPI.getPayments({ user_id: userId, per_page: 50 }).then((r) => r.data),
    enabled: !!userId,
  });

  const user = userData?.user || userData;
  const payments = userPayments?.payments || [];

  const totalPaid = payments.reduce((s, p) => s + (p.amount || 0), 0);

  if (!userId) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)' }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          ...glassCard,
          borderRadius: '24px',
          maxWidth: '640px',
          width: '100%',
          maxHeight: '85vh',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* Modal header */}
        <div className="flex items-center justify-between p-6 pb-4" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <div className="flex items-center gap-3">
            <div
              className="w-12 h-12 rounded-2xl flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg, #0A84FF, #5E5CE6)' }}
            >
              <User size={22} className="text-white" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">
                {userLoading ? '...' : (user?.name || user?.full_name || 'Foydalanuvchi')}
              </h3>
              <p className="text-sm text-gray-400">
                {userLoading ? '...' : formatPhone(user?.phone || '')}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-xl flex items-center justify-center text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5" style={{ scrollbarWidth: 'thin', scrollbarColor: 'rgba(255,255,255,0.1) transparent' }}>
          {userLoading ? (
            <LoadingSpinner />
          ) : (
            <>
              {/* User info cards */}
              <div className="grid grid-cols-2 gap-3">
                <div style={glassInner} className="p-4">
                  <div className="flex items-center gap-2 mb-1.5">
                    <Shield size={14} className="text-gray-500" />
                    <span className="text-xs text-gray-500">Roli</span>
                  </div>
                  <p className="text-sm font-semibold text-white capitalize">{user?.role || 'user'}</p>
                </div>
                <div style={glassInner} className="p-4">
                  <div className="flex items-center gap-2 mb-1.5">
                    <Calendar size={14} className="text-gray-500" />
                    <span className="text-xs text-gray-500">Ro'yxatdan o'tgan</span>
                  </div>
                  <p className="text-sm font-semibold text-white">{formatDate(user?.created_at)}</p>
                </div>
                <div style={glassInner} className="p-4">
                  <div className="flex items-center gap-2 mb-1.5">
                    <CreditCard size={14} className="text-gray-500" />
                    <span className="text-xs text-gray-500">To'lovlar soni</span>
                  </div>
                  <p className="text-sm font-semibold text-white">{payments.length}</p>
                </div>
                <div style={glassInner} className="p-4">
                  <div className="flex items-center gap-2 mb-1.5">
                    <DollarSign size={14} className="text-gray-500" />
                    <span className="text-xs text-gray-500">Jami to'langan</span>
                  </div>
                  <p className="text-sm font-semibold" style={{ color: '#30D158' }}>{formatPrice(totalPaid)}</p>
                </div>
              </div>

              {/* User payments list */}
              <div>
                <h4 className="text-sm font-semibold text-white mb-3">To'lovlar tarixi</h4>
                {paymentsLoading ? (
                  <LoadingSpinner size="sm" />
                ) : payments.length === 0 ? (
                  <p className="text-sm text-gray-500 text-center py-6">To'lovlar topilmadi</p>
                ) : (
                  <div className="space-y-2">
                    {payments.map((p) => (
                      <div
                        key={p.id}
                        style={glassInner}
                        className="p-3.5 flex items-center gap-3"
                      >
                        <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center shrink-0">
                          <img
                            src={METHOD_LOGOS[p.payment_method]}
                            alt={p.payment_method}
                            className="w-5 h-5 object-contain"
                            onError={(e) => { e.target.style.display = 'none'; }}
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            {p.plate_number && (
                              <span
                                className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-mono font-bold"
                                style={{ background: 'rgba(255,255,255,0.08)', color: '#fff', border: '1px solid rgba(255,255,255,0.1)' }}
                              >
                                {p.plate_number}
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-gray-500 mt-0.5">{formatDate(p.created_at)}</p>
                        </div>
                        <p className="text-sm font-bold shrink-0" style={{ color: '#30D158' }}>
                          {formatPrice(p.amount)}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

/* ------------------------------------------------------------------ */
/*  Main Component                                                     */
/* ------------------------------------------------------------------ */

const Payments = () => {
  const [activePreset, setActivePreset] = useState('month');
  const [dateFrom, setDateFrom] = useState(() => getPresetDates('month').from);
  const [dateTo, setDateTo] = useState(() => getPresetDates('month').to);
  const [methodFilter, setMethodFilter] = useState('');
  const [page, setPage] = useState(1);
  const [selectedUserId, setSelectedUserId] = useState(null);
  const perPage = 15;

  const handlePreset = useCallback((key) => {
    setActivePreset(key);
    const { from, to } = getPresetDates(key);
    setDateFrom(from);
    setDateTo(to);
    setPage(1);
  }, []);

  const dateParams = useMemo(() => {
    const p = {};
    if (dateFrom) p.from = dateFrom;
    if (dateTo) p.to = dateTo;
    return p;
  }, [dateFrom, dateTo]);

  /* --- Queries --- */
  const { data: statsData, isLoading: statsLoading } = useQuery({
    queryKey: ['admin', 'payment-stats', dateParams],
    queryFn: () => adminAPI.getPaymentStats(dateParams).then((r) => r.data),
  });

  const { data: paymentsData, isLoading: paymentsLoading } = useQuery({
    queryKey: ['admin', 'payments', dateParams, methodFilter, page],
    queryFn: () =>
      adminAPI
        .getPayments({
          ...dateParams,
          ...(methodFilter && { method: methodFilter }),
          page,
          per_page: perPage,
        })
        .then((r) => r.data),
  });

  const stats = statsData || {};
  const payments = paymentsData?.payments || [];
  const pagination = paymentsData?.pagination || {};
  const totalPages = pagination.total_pages || Math.ceil((pagination.total || 0) / perPage) || 1;

  const avgPayment = stats.total_count > 0 ? Math.round(stats.total_revenue / stats.total_count) : 0;

  const byMethodMap = useMemo(() => {
    const map = {};
    (stats.by_method || []).forEach((m) => { map[m.method] = m; });
    return map;
  }, [stats.by_method]);

  const dailyData = useMemo(() => {
    return (stats.daily || []).map((d) => ({
      ...d,
      date: d.date,
      label: (() => {
        const dt = new Date(d.date);
        return `${dt.getDate()}/${dt.getMonth() + 1}`;
      })(),
    }));
  }, [stats.daily]);

  /* --- Render --- */
  return (
    <div style={pageBackground} className="p-4 md:p-6 lg:p-8 space-y-6 -m-6 md:-m-8">
      {/* ============ HEADER ============ */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div
            className="w-12 h-12 rounded-2xl flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg, #30D158, #0cce6b)', boxShadow: '0 4px 20px rgba(48,209,88,0.3)' }}
          >
            <DollarSign size={24} className="text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">To'lovlar hisoboti</h1>
            <p className="text-sm text-gray-500 mt-0.5">Barcha to'lovlar va statistika</p>
          </div>
        </div>
      </div>

      {/* ============ DATE RANGE FILTER ============ */}
      <div style={glassCard} className="p-4">
        <div className="flex flex-wrap items-center gap-4">
          {/* Preset pills */}
          <div
            className="flex items-center gap-1 p-1 rounded-2xl"
            style={{ background: 'rgba(255,255,255,0.05)' }}
          >
            {PRESETS.map((p) => (
              <button
                key={p.key}
                onClick={() => handlePreset(p.key)}
                className="px-4 py-2 text-sm font-medium rounded-xl transition-all duration-300"
                style={
                  activePreset === p.key
                    ? {
                        background: 'linear-gradient(135deg, #0A84FF, #5E5CE6)',
                        color: '#fff',
                        boxShadow: '0 4px 15px rgba(10,132,255,0.3)',
                      }
                    : { color: '#8E8E93' }
                }
              >
                {p.label}
              </button>
            ))}
          </div>

          {/* Custom date inputs */}
          <div className="flex items-center gap-2 ml-auto">
            <Calendar size={16} className="text-gray-500" />
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => {
                setDateFrom(e.target.value);
                setActivePreset('');
                setPage(1);
              }}
              className="px-3 py-2 rounded-xl text-sm font-medium text-white focus:outline-none focus:ring-2 focus:ring-[#0A84FF]"
              style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)' }}
            />
            <span className="text-gray-600">&mdash;</span>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => {
                setDateTo(e.target.value);
                setActivePreset('');
                setPage(1);
              }}
              className="px-3 py-2 rounded-xl text-sm font-medium text-white focus:outline-none focus:ring-2 focus:ring-[#0A84FF]"
              style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)' }}
            />
          </div>
        </div>
      </div>

      {/* ============ STATS CARDS ============ */}
      {statsLoading ? (
        <div className="flex items-center justify-center py-16">
          <LoadingSpinner size="lg" />
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
            <GlassStatCard
              icon={DollarSign}
              label="Jami daromad"
              value={formatPrice(stats.total_revenue || 0)}
              subtitle={`${(stats.total_count || 0).toLocaleString()} ta to'lovdan`}
              color="#30D158"
            />
            <GlassStatCard
              icon={TrendingUp}
              label="Bugungi daromad"
              value={formatPrice(stats.today_revenue || 0)}
              subtitle={`Bugun ${stats.today_count || 0} ta to'lov`}
              color="#0A84FF"
            />
            <GlassStatCard
              icon={Hash}
              label="Jami to'lovlar soni"
              value={(stats.total_count || 0).toLocaleString()}
              subtitle="Barcha vaqt uchun"
              color="#5E5CE6"
            />
            <GlassStatCard
              icon={Calculator}
              label="O'rtacha to'lov"
              value={formatPrice(avgPayment)}
              subtitle="Har bir to'lov uchun"
              color="#FF9F0A"
            />
          </div>

          {/* ============ PAYMENT METHODS BREAKDOWN ============ */}
          <div>
            <h2 className="text-lg font-semibold text-white mb-4">To'lov usullari</h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {['click', 'payme', 'paynet'].map((method) => {
                const data = byMethodMap[method] || {};
                return (
                  <MethodCard
                    key={method}
                    method={method}
                    count={data.count || 0}
                    total={data.total || 0}
                    isActive={methodFilter === method}
                    onClick={() => {
                      setMethodFilter(methodFilter === method ? '' : method);
                      setPage(1);
                    }}
                  />
                );
              })}
            </div>
          </div>

          {/* ============ REVENUE CHART ============ */}
          <div style={glassCard} className="p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-lg font-semibold text-white">Kunlik daromad</h2>
                <p className="text-sm text-gray-500 mt-0.5">Oxirgi 30 kun</p>
              </div>
              <div className="flex items-center gap-5 text-xs">
                <span className="flex items-center gap-1.5 text-gray-400">
                  <span className="w-3 h-3 rounded-full" style={{ background: '#30D158' }} />
                  Daromad
                </span>
                <span className="flex items-center gap-1.5 text-gray-400">
                  <span className="w-3 h-3 rounded-full" style={{ background: '#0A84FF' }} />
                  Soni
                </span>
              </div>
            </div>
            {dailyData.length > 0 ? (
              <ResponsiveContainer width="100%" height={320}>
                <LineChart data={dailyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
                  <XAxis
                    dataKey="label"
                    tick={{ fontSize: 11, fill: '#636366' }}
                    tickLine={false}
                    axisLine={{ stroke: 'rgba(255,255,255,0.06)' }}
                  />
                  <YAxis
                    yAxisId="revenue"
                    tick={{ fontSize: 11, fill: '#636366' }}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(val) => {
                      if (val >= 1_000_000) return `${(val / 1_000_000).toFixed(1)}M`;
                      if (val >= 1_000) return `${(val / 1_000).toFixed(0)}K`;
                      return val;
                    }}
                  />
                  <YAxis
                    yAxisId="count"
                    orientation="right"
                    tick={{ fontSize: 11, fill: '#636366' }}
                    tickLine={false}
                    axisLine={false}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Line
                    yAxisId="revenue"
                    type="monotone"
                    dataKey="total"
                    name="Daromad"
                    stroke="#30D158"
                    strokeWidth={2.5}
                    dot={false}
                    activeDot={{ r: 5, fill: '#30D158', stroke: '#0a0b14', strokeWidth: 3 }}
                  />
                  <Line
                    yAxisId="count"
                    type="monotone"
                    dataKey="count"
                    name="Soni"
                    stroke="#0A84FF"
                    strokeWidth={2}
                    dot={false}
                    strokeDasharray="5 5"
                    activeDot={{ r: 4, fill: '#0A84FF', stroke: '#0a0b14', strokeWidth: 3 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[320px] text-gray-600 text-sm">
                Ma'lumot topilmadi
              </div>
            )}
          </div>

          {/* ============ TOP USERS TABLE ============ */}
          {(stats.top_users || []).length > 0 && (
            <div style={glassCard} className="overflow-hidden">
              <div className="px-6 py-5" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                <h2 className="text-lg font-semibold text-white">Top foydalanuvchilar</h2>
                <p className="text-sm text-gray-500 mt-0.5">Eng ko'p to'lov qilganlar</p>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr style={{ background: 'rgba(255,255,255,0.03)' }}>
                      <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">#</th>
                      <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Foydalanuvchi</th>
                      <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Telefon</th>
                      <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">To'lovlar</th>
                      <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Jami</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(stats.top_users || []).map((u, i) => (
                      <tr
                        key={u.user_id}
                        className="hover:bg-white/[0.03] transition-colors cursor-pointer"
                        style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}
                        onClick={() => setSelectedUserId(u.user_id)}
                      >
                        <td className="px-6 py-4">
                          <span
                            className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold"
                            style={
                              i === 0
                                ? { background: 'linear-gradient(135deg, #FFD700, #FFA500)', color: '#000' }
                                : i === 1
                                ? { background: 'linear-gradient(135deg, #C0C0C0, #A0A0A0)', color: '#000' }
                                : i === 2
                                ? { background: 'linear-gradient(135deg, #CD7F32, #B87333)', color: '#fff' }
                                : { background: 'rgba(255,255,255,0.06)', color: '#8E8E93' }
                            }
                          >
                            {i + 1}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-white">{u.user_name}</span>
                            <ArrowUpRight size={12} className="text-gray-600" />
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-400">{formatPhone(u.user_phone)}</td>
                        <td className="px-6 py-4 text-sm text-white font-medium">{u.count}</td>
                        <td className="px-6 py-4 text-sm font-bold" style={{ color: '#30D158' }}>
                          {formatPrice(u.total)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ============ ALL PAYMENTS TABLE ============ */}
          <div style={glassCard} className="overflow-hidden">
            <div className="px-6 py-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
              <div>
                <h2 className="text-lg font-semibold text-white">Barcha to'lovlar</h2>
                <p className="text-sm text-gray-500 mt-0.5">
                  {pagination.total ? `Jami ${pagination.total} ta` : ''}
                </p>
              </div>

              {/* Method filter tabs */}
              <div
                className="flex items-center gap-1 p-1 rounded-2xl self-start"
                style={{ background: 'rgba(255,255,255,0.05)' }}
              >
                {METHOD_TABS.map((tab) => (
                  <button
                    key={tab.key}
                    onClick={() => {
                      setMethodFilter(tab.key);
                      setPage(1);
                    }}
                    className="px-3.5 py-1.5 text-xs font-medium rounded-xl transition-all duration-300"
                    style={
                      methodFilter === tab.key
                        ? {
                            background: 'linear-gradient(135deg, #0A84FF, #5E5CE6)',
                            color: '#fff',
                            boxShadow: '0 2px 10px rgba(10,132,255,0.25)',
                          }
                        : { color: '#8E8E93' }
                    }
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            {paymentsLoading ? (
              <div className="py-12">
                <LoadingSpinner />
              </div>
            ) : payments.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-gray-600">
                <CreditCard size={40} className="mb-3 opacity-30" />
                <p className="text-sm">To'lovlar topilmadi</p>
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr style={{ background: 'rgba(255,255,255,0.03)' }}>
                        <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">#</th>
                        <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Foydalanuvchi</th>
                        <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Raqam</th>
                        <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Miqdor</th>
                        <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Usul</th>
                        <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Karta</th>
                        <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Sana</th>
                      </tr>
                    </thead>
                    <tbody>
                      {payments.map((p, i) => (
                        <tr
                          key={p.id}
                          className="hover:bg-white/[0.03] transition-colors"
                          style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}
                        >
                          <td className="px-6 py-4 text-xs text-gray-500 font-medium">
                            {(page - 1) * perPage + i + 1}
                          </td>
                          <td className="px-6 py-4">
                            <button
                              onClick={() => setSelectedUserId(p.user_id)}
                              className="text-left hover:opacity-80 transition-opacity"
                            >
                              <p className="text-sm font-medium text-white">{p.user_name}</p>
                              <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                                <Phone size={10} />
                                {formatPhone(p.user_phone)}
                              </p>
                            </button>
                          </td>
                          <td className="px-6 py-4">
                            {p.plate_number ? (
                              <span
                                className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-mono font-bold"
                                style={{
                                  background: 'rgba(255,255,255,0.08)',
                                  color: '#fff',
                                  border: '1px solid rgba(255,255,255,0.12)',
                                  letterSpacing: '0.5px',
                                }}
                              >
                                {p.plate_number}
                              </span>
                            ) : (
                              <span className="text-xs text-gray-600">-</span>
                            )}
                          </td>
                          <td className="px-6 py-4 text-sm font-bold" style={{ color: '#30D158' }}>
                            {formatPrice(p.amount)}
                          </td>
                          <td className="px-6 py-4">
                            <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center">
                              <img
                                src={METHOD_LOGOS[p.payment_method]}
                                alt={p.payment_method}
                                className="w-5 h-5 object-contain"
                                onError={(e) => {
                                  e.target.style.display = 'none';
                                  e.target.parentElement.innerHTML = `<span style="font-size:10px;font-weight:600;color:#333;text-transform:capitalize">${p.payment_method || '?'}</span>`;
                                }}
                              />
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            {p.card_last4 ? (
                              <span className="text-sm text-gray-400 font-mono">
                                •••• {p.card_last4}
                              </span>
                            ) : (
                              <span className="text-xs text-gray-600">-</span>
                            )}
                          </td>
                          <td className="px-6 py-4">
                            <p className="text-sm text-gray-300">{formatDate(p.created_at)}</p>
                            <p className="text-xs text-gray-600 mt-0.5">{formatRelativeDate(p.created_at)}</p>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div
                    className="flex items-center justify-between px-6 py-4"
                    style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}
                  >
                    <p className="text-xs text-gray-500">
                      Sahifa {page} / {totalPages}
                    </p>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setPage(Math.max(1, page - 1))}
                        disabled={page <= 1}
                        className="w-9 h-9 rounded-xl flex items-center justify-center transition-all disabled:opacity-30"
                        style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)' }}
                      >
                        <ChevronLeft size={16} className="text-white" />
                      </button>
                      {/* Page numbers */}
                      {Array.from({ length: Math.min(5, totalPages) }, (_, idx) => {
                        let pageNum;
                        if (totalPages <= 5) {
                          pageNum = idx + 1;
                        } else if (page <= 3) {
                          pageNum = idx + 1;
                        } else if (page >= totalPages - 2) {
                          pageNum = totalPages - 4 + idx;
                        } else {
                          pageNum = page - 2 + idx;
                        }
                        return (
                          <button
                            key={pageNum}
                            onClick={() => setPage(pageNum)}
                            className="w-9 h-9 rounded-xl flex items-center justify-center text-sm font-medium transition-all"
                            style={
                              page === pageNum
                                ? {
                                    background: 'linear-gradient(135deg, #0A84FF, #5E5CE6)',
                                    color: '#fff',
                                    boxShadow: '0 2px 10px rgba(10,132,255,0.3)',
                                  }
                                : {
                                    background: 'rgba(255,255,255,0.04)',
                                    color: '#8E8E93',
                                    border: '1px solid rgba(255,255,255,0.06)',
                                  }
                            }
                          >
                            {pageNum}
                          </button>
                        );
                      })}
                      <button
                        onClick={() => setPage(Math.min(totalPages, page + 1))}
                        disabled={page >= totalPages}
                        className="w-9 h-9 rounded-xl flex items-center justify-center transition-all disabled:opacity-30"
                        style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)' }}
                      >
                        <ChevronRight size={16} className="text-white" />
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </>
      )}

      {/* ============ USER MODAL ============ */}
      {selectedUserId && (
        <UserModal
          userId={selectedUserId}
          onClose={() => setSelectedUserId(null)}
        />
      )}
    </div>
  );
};

export default Payments;
