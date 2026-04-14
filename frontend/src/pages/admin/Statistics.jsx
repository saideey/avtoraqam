import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell,
} from 'recharts';
import { adminAPI } from '../../services/api';
import { formatPrice } from '../../utils/formatters';
import {
  TrendingUp,
  ArrowRightLeft,
  ShoppingCart,
  Heart,
  MapPin,
  Crown,
  Calendar,
  BarChart3,
  Activity,
  PieChart as PieChartIcon,
} from 'lucide-react';

/* ------------------------------------------------------------------ */
/*  Constants                                                          */
/* ------------------------------------------------------------------ */

const BAR_COLORS = ['#3b82f6', '#6366f1', '#8b5cf6', '#a855f7', '#d946ef'];

const REGION_COLORS = [
  '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6',
  '#ec4899', '#06b6d4', '#84cc16', '#f97316', '#6366f1',
  '#14b8a6', '#e11d48', '#a855f7',
];

const PRESETS = [
  { key: 'today', label: 'Bugun' },
  { key: 'week', label: 'Hafta' },
  { key: 'month', label: 'Oy' },
  { key: 'year', label: 'Yil' },
  { key: 'all', label: 'Barchasi' },
];

const DAY_LABELS = ['Du', 'Se', 'Cho', 'Pa', 'Ju', 'Sha', 'Ya'];

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

const shortNumber = (n) => {
  if (n == null) return '-';
  if (n >= 1_000_000_000) return (n / 1_000_000_000).toFixed(1) + ' mlrd';
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + ' mln';
  if (n >= 1_000) return (n / 1_000).toFixed(1) + ' ming';
  return String(n);
};

/* ------------------------------------------------------------------ */
/*  Sub-components                                                     */
/* ------------------------------------------------------------------ */

const StatCard = ({ icon: Icon, label, value, sub, color = 'blue' }) => {
  const colorMap = {
    blue: 'bg-blue-50 text-blue-600',
    emerald: 'bg-emerald-50 text-emerald-600',
    violet: 'bg-violet-50 text-violet-600',
    rose: 'bg-rose-50 text-rose-600',
    amber: 'bg-amber-50 text-amber-600',
    cyan: 'bg-cyan-50 text-cyan-600',
  };
  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 flex items-start gap-4 hover:shadow-md transition-shadow">
      <div className={`rounded-lg p-2.5 ${colorMap[color] || colorMap.blue}`}>
        <Icon className="h-5 w-5" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm text-gray-500 truncate">{label}</p>
        <p className="mt-1 text-xl font-bold text-gray-900 truncate">{value}</p>
        {sub && <p className="mt-0.5 text-xs text-gray-400 truncate">{sub}</p>}
      </div>
    </div>
  );
};

const ChartCard = ({ title, icon: Icon, children, className = '' }) => (
  <div className={`bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden ${className}`}>
    <div className="flex items-center gap-2 px-6 py-4 border-b border-gray-100">
      {Icon && <Icon className="h-4.5 w-4.5 text-gray-400" />}
      <h3 className="text-base font-semibold text-gray-800">{title}</h3>
    </div>
    <div className="p-6">{children}</div>
  </div>
);

const LoadingSkeleton = ({ height = 320 }) => (
  <div
    className="animate-pulse bg-gray-100 rounded-lg"
    style={{ height }}
  />
);

const EmptyState = ({ text = "Ma'lumot topilmadi" }) => (
  <div className="flex flex-col items-center justify-center py-16 text-gray-400">
    <BarChart3 className="h-10 w-10 mb-2 opacity-40" />
    <p className="text-sm">{text}</p>
  </div>
);

/* ------------------------------------------------------------------ */
/*  Main Component                                                     */
/* ------------------------------------------------------------------ */

const Statistics = () => {
  const [activePreset, setActivePreset] = useState('month');
  const [dateFrom, setDateFrom] = useState(() => getPresetDates('month').from);
  const [dateTo, setDateTo] = useState(() => getPresetDates('month').to);

  const handlePreset = (key) => {
    setActivePreset(key);
    const { from, to } = getPresetDates(key);
    setDateFrom(from);
    setDateTo(to);
  };

  const dateParams = useMemo(() => {
    const p = {};
    if (dateFrom) p.from = dateFrom;
    if (dateTo) p.to = dateTo;
    return p;
  }, [dateFrom, dateTo]);

  /* --- Queries --- */
  const { data: overview, isLoading: overviewLoading } = useQuery({
    queryKey: ['admin', 'stats', 'overview'],
    queryFn: () => adminAPI.statsOverview().then((r) => r.data),
  });

  const { data: dailyRaw, isLoading: dailyLoading } = useQuery({
    queryKey: ['admin', 'stats', 'daily', dateParams],
    queryFn: () => adminAPI.statsDaily(dateParams).then((r) => r.data),
  });

  const dailyData = Array.isArray(dailyRaw) ? dailyRaw : dailyRaw?.data || [];

  const { data: monthlyRaw, isLoading: monthlyLoading } = useQuery({
    queryKey: ['admin', 'stats', 'monthly'],
    queryFn: () => adminAPI.statsMonthly().then((r) => r.data),
  });

  const monthlyData = monthlyRaw?.data || (Array.isArray(monthlyRaw) ? monthlyRaw : []);

  const { data: hourlyRaw, isLoading: hourlyLoading } = useQuery({
    queryKey: ['admin', 'stats', 'hourly'],
    queryFn: () => adminAPI.statsHourly().then((r) => r.data),
  });

  const hourlyData = hourlyRaw?.data || (Array.isArray(hourlyRaw) ? hourlyRaw : []);

  /* --- Derived data --- */
  const regionData = overview?.regions || [];
  const priceRanges = overview?.price_ranges || overview?.price_distribution || [];

  // Hourly data: backend returns flat [{day, hour, count}, ...], transform to [{day, label, hours: [...]}, ...]
  const hourlyActivity = useMemo(() => {
    const raw = Array.isArray(hourlyData) ? hourlyData : [];
    if (raw.length === 0) return [];
    if (raw[0] && Array.isArray(raw[0].hours)) return raw;
    const dayMap = {};
    raw.forEach(({ day, hour, count }) => {
      const dayIdx = Number(day);
      if (!dayMap[dayIdx]) {
        dayMap[dayIdx] = { day: dayIdx, label: DAY_LABELS[dayIdx] || `${dayIdx}`, hours: new Array(24).fill(0) };
      }
      if (hour >= 0 && hour < 24) {
        dayMap[dayIdx].hours[hour] = count || 0;
      }
    });
    return Object.values(dayMap).sort((a, b) => a.day - b.day);
  }, [hourlyData]);

  const regionTotal = regionData.reduce((s, r) => s + (r.count || 0), 0) || 1;
  const regionMax = Math.max(...regionData.map((r) => r.count || 0), 1);

  // Overview fields (safe defaults)
  const ov = overview || {};
  const avgPrice = ov.average_price ?? ov.avg_price ?? null;
  const conversion = ov.conversion ?? ov.conversion_rate ?? null;
  const totalSold = ov.total_sold ?? ov.sold_count ?? null;
  const totalLikes = ov.total_likes ?? ov.likes_count ?? null;
  const topRegion = ov.top_region ?? ov.most_active_region ?? null;
  const mostExpensive = ov.most_expensive ?? ov.top_plate ?? null;

  /* --- Heatmap helpers --- */
  const heatmapGlobalMax = useMemo(() => {
    if (!Array.isArray(hourlyActivity) || hourlyActivity.length === 0) return 1;
    let max = 1;
    hourlyActivity.forEach((row) => {
      const hours = row.hours || [];
      hours.forEach((v) => {
        if (v > max) max = v;
      });
    });
    return max;
  }, [hourlyActivity]);

  const getCellColor = (val) => {
    if (!val) return 'bg-gray-50';
    const ratio = val / heatmapGlobalMax;
    if (ratio < 0.15) return 'bg-blue-50 text-blue-600';
    if (ratio < 0.3) return 'bg-blue-100 text-blue-700';
    if (ratio < 0.5) return 'bg-blue-200 text-blue-800';
    if (ratio < 0.7) return 'bg-blue-400 text-white';
    return 'bg-blue-600 text-white';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Statistika</h1>
        <p className="mt-1 text-sm text-gray-500">
          Platformadagi barcha ko'rsatkichlar va tahlillar
        </p>
      </div>

      {/* ---- Date Range Selector ---- */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
        <div className="flex flex-wrap items-center gap-4">
          {/* Preset pills */}
          <div className="flex items-center gap-1 bg-gray-100 rounded-full p-1">
            {PRESETS.map((p) => (
              <button
                key={p.key}
                onClick={() => handlePreset(p.key)}
                className={`px-4 py-1.5 text-sm font-medium rounded-full transition-all ${
                  activePreset === p.key
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>

          {/* Custom date inputs */}
          <div className="flex items-center gap-2 ml-auto">
            <Calendar className="h-4 w-4 text-gray-400" />
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => {
                setDateFrom(e.target.value);
                setActivePreset('');
              }}
              className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <span className="text-gray-300">&mdash;</span>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => {
                setDateTo(e.target.value);
                setActivePreset('');
              }}
              className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>
      </div>

      {/* ---- Row 1: Summary Cards ---- */}
      {overviewLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-24 bg-white rounded-xl border border-gray-200 animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <StatCard
            icon={TrendingUp}
            label="O'rtacha narx"
            value={avgPrice != null ? formatPrice(avgPrice) : '-'}
            color="blue"
          />
          <StatCard
            icon={ArrowRightLeft}
            label="Konversiya (taklif - sotish)"
            value={conversion != null ? `${Number(conversion).toFixed(1)}%` : '-'}
            color="emerald"
          />
          <StatCard
            icon={ShoppingCart}
            label="Jami sotilgan"
            value={totalSold != null ? shortNumber(totalSold) : '-'}
            sub={totalSold != null ? `${totalSold} ta raqam` : undefined}
            color="violet"
          />
          <StatCard
            icon={Heart}
            label="Jami like"
            value={totalLikes != null ? shortNumber(totalLikes) : '-'}
            color="rose"
          />
          <StatCard
            icon={MapPin}
            label="Eng faol viloyat"
            value={topRegion || '-'}
            color="amber"
          />
          <StatCard
            icon={Crown}
            label="Eng qimmat raqam"
            value={
              mostExpensive
                ? typeof mostExpensive === 'object'
                  ? mostExpensive.plate_number || mostExpensive.number || '-'
                  : mostExpensive
                : '-'
            }
            sub={
              mostExpensive && typeof mostExpensive === 'object' && mostExpensive.price
                ? formatPrice(mostExpensive.price)
                : undefined
            }
            color="cyan"
          />
        </div>
      )}

      {/* ---- Row 2: Line Chart + Region Distribution ---- */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Daily line chart */}
        <ChartCard title="Kunlik e'lonlar va takliflar" icon={Activity}>
          {dailyLoading ? (
            <LoadingSkeleton />
          ) : Array.isArray(dailyData) && dailyData.length > 0 ? (
            <ResponsiveContainer width="100%" height={320}>
              <LineChart data={dailyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 11, fill: '#94a3b8' }}
                  tickFormatter={(val) => {
                    const d = new Date(val);
                    return `${d.getDate()}/${d.getMonth() + 1}`;
                  }}
                  axisLine={{ stroke: '#e2e8f0' }}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: '#94a3b8' }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  contentStyle={{
                    borderRadius: '12px',
                    border: '1px solid #e2e8f0',
                    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                    fontSize: 13,
                  }}
                />
                <Legend
                  iconType="circle"
                  wrapperStyle={{ fontSize: 13 }}
                />
                <Line
                  type="monotone"
                  dataKey="listings"
                  name="E'lonlar"
                  stroke="#3b82f6"
                  strokeWidth={2.5}
                  dot={false}
                  activeDot={{ r: 5, strokeWidth: 0 }}
                />
                <Line
                  type="monotone"
                  dataKey="offers"
                  name="Takliflar"
                  stroke="#10b981"
                  strokeWidth={2.5}
                  dot={false}
                  activeDot={{ r: 5, strokeWidth: 0 }}
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <EmptyState />
          )}
        </ChartCard>

        {/* Region distribution (progress bars) */}
        <ChartCard title="Viloyat bo'yicha taqsimot" icon={PieChartIcon}>
          {overviewLoading ? (
            <LoadingSkeleton />
          ) : regionData.length > 0 ? (
            <div className="space-y-3 max-h-[320px] overflow-y-auto pr-2">
              {regionData
                .sort((a, b) => (b.count || 0) - (a.count || 0))
                .map((r, i) => {
                  const pct = ((r.count || 0) / regionTotal * 100).toFixed(1);
                  const widthPct = ((r.count || 0) / regionMax * 100).toFixed(0);
                  return (
                    <div key={i}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium text-gray-700 truncate">
                          {r.region || r.name || `Viloyat ${i + 1}`}
                        </span>
                        <span className="text-xs text-gray-500 ml-2 whitespace-nowrap">
                          {r.count || 0} ({pct}%)
                        </span>
                      </div>
                      <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-500"
                          style={{
                            width: `${widthPct}%`,
                            backgroundColor: REGION_COLORS[i % REGION_COLORS.length],
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
            </div>
          ) : (
            <EmptyState />
          )}
        </ChartCard>
      </div>

      {/* ---- Row 3: Price Range Bar Chart + Heatmap ---- */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Price range distribution */}
        <ChartCard title="Narx oraliq taqsimoti" icon={BarChart3}>
          {overviewLoading ? (
            <LoadingSkeleton />
          ) : priceRanges.length > 0 ? (
            <ResponsiveContainer width="100%" height={320}>
              <BarChart data={priceRanges} barSize={40}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis
                  dataKey="range"
                  tick={{ fontSize: 11, fill: '#94a3b8' }}
                  axisLine={{ stroke: '#e2e8f0' }}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: '#94a3b8' }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  contentStyle={{
                    borderRadius: '12px',
                    border: '1px solid #e2e8f0',
                    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                    fontSize: 13,
                  }}
                  cursor={{ fill: '#f8fafc' }}
                />
                <Bar dataKey="count" name="Soni" radius={[6, 6, 0, 0]}>
                  {priceRanges.map((_, i) => (
                    <Cell key={i} fill={BAR_COLORS[i % BAR_COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <EmptyState />
          )}
        </ChartCard>

        {/* Hourly heatmap */}
        <ChartCard title="Soatlik faollik" icon={Activity}>
          {hourlyLoading ? (
            <LoadingSkeleton />
          ) : Array.isArray(hourlyActivity) && hourlyActivity.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full border-separate" style={{ borderSpacing: '2px' }}>
                <thead>
                  <tr>
                    <th className="w-10" />
                    {Array.from({ length: 24 }, (_, i) => (
                      <th
                        key={i}
                        className="text-[10px] font-medium text-gray-400 pb-1 text-center"
                        style={{ minWidth: 24 }}
                      >
                        {String(i).padStart(2, '0')}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {hourlyActivity.map((dayRow, idx) => {
                    const dayLabel = dayRow.label || DAY_LABELS[dayRow.day] || `${idx + 1}`;
                    const hours = dayRow.hours || [];
                    return (
                      <tr key={idx}>
                        <td className="pr-2 text-xs font-semibold text-gray-500 text-right whitespace-nowrap">
                          {dayLabel}
                        </td>
                        {Array.from({ length: 24 }, (_, h) => {
                          const val = hours[h] ?? 0;
                          return (
                            <td
                              key={h}
                              className={`text-center text-[10px] font-medium rounded-sm cursor-default transition-colors ${getCellColor(val)}`}
                              style={{ width: 24, height: 24 }}
                              title={`${dayLabel} ${String(h).padStart(2, '0')}:00 — ${val} ta`}
                            >
                              {val || ''}
                            </td>
                          );
                        })}
                      </tr>
                    );
                  })}
                </tbody>
              </table>

              {/* Legend */}
              <div className="flex items-center gap-2 mt-4 text-xs text-gray-400">
                <span>Kam</span>
                <div className="flex gap-0.5">
                  {['bg-gray-50', 'bg-blue-50', 'bg-blue-100', 'bg-blue-200', 'bg-blue-400', 'bg-blue-600'].map(
                    (c, i) => (
                      <div key={i} className={`w-4 h-4 rounded-sm ${c}`} />
                    )
                  )}
                </div>
                <span>Ko'p</span>
              </div>
            </div>
          ) : (
            <EmptyState />
          )}
        </ChartCard>
      </div>
    </div>
  );
};

export default Statistics;
