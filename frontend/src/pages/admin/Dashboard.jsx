import { useQuery } from '@tanstack/react-query';
import {
  Users,
  Tag,
  DollarSign,
  Eye,
  UserPlus,
  ClipboardList,
  FileBarChart,
  ArrowRight,
  TrendingUp,
  CheckCircle2,
  RotateCcw,
  Phone,
} from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { adminAPI } from '../../services/api';
import StatsCard from '../../components/admin/StatsCard';
import LoadingSpinner from '../../components/common/LoadingSpinner';

const Dashboard = () => {
  const { data: overview, isLoading: overviewLoading } = useQuery({
    queryKey: ['admin', 'stats', 'overview'],
    queryFn: () => adminAPI.statsOverview().then((res) => res.data),
  });

  const { data: dailyStats, isLoading: dailyLoading } = useQuery({
    queryKey: ['admin', 'stats', 'daily'],
    queryFn: () => adminAPI.statsDaily({ days: 30 }).then((res) => res.data),
  });

  if (overviewLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  const quickActions = [
    {
      label: "Yangi admin qo'shish",
      icon: UserPlus,
      color: 'bg-blue-50 text-blue-600 hover:bg-blue-100',
      href: '/admin/users',
    },
    {
      label: "E'lonlarni ko'rish",
      icon: ClipboardList,
      color: 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100',
      href: '/admin/listings',
    },
    {
      label: 'Takliflar',
      icon: DollarSign,
      color: 'bg-purple-50 text-purple-600 hover:bg-purple-100',
      href: '/admin/offers',
    },
    {
      label: 'Hisobot yuklab olish',
      icon: FileBarChart,
      color: 'bg-amber-50 text-amber-600 hover:bg-amber-100',
      href: '/admin/statistics',
    },
  ];

  const metricCards = [
    {
      label: "Faol e'lonlar",
      value: overview?.active_listings_pct ?? 68,
      suffix: '%',
      color: 'text-emerald-600',
      bg: 'bg-emerald-50',
    },
    {
      label: 'Sotilgan',
      value: overview?.sold_pct ?? 24,
      suffix: '%',
      color: 'text-blue-600',
      bg: 'bg-blue-50',
    },
    {
      label: 'Konversiya rate',
      value: overview?.conversion_rate ?? 8.5,
      suffix: '%',
      color: 'text-purple-600',
      bg: 'bg-purple-50',
    },
  ];

  const recentOffers = overview?.recent_offers ?? [
    { buyer: 'Alisher T.', plate: '01 A 777 AA', amount: '15 000 000', status: 'Kutilmoqda', time: '5 daq. oldin' },
    { buyer: 'Jasur K.', plate: '01 B 001 CA', amount: '8 500 000', status: 'Qabul qilindi', time: '12 daq. oldin' },
    { buyer: 'Dilshod M.', plate: '40 C 100 DA', amount: '3 200 000', status: 'Rad etildi', time: '25 daq. oldin' },
    { buyer: 'Nodira S.', plate: '01 D 555 FA', amount: '22 000 000', status: 'Kutilmoqda', time: '1 soat oldin' },
    { buyer: 'Bekzod R.', plate: '70 E 999 GA', amount: '6 800 000', status: 'Qabul qilindi', time: '2 soat oldin' },
  ];

  const recentUsers = overview?.recent_users ?? [
    { name: 'Alisher Toshmatov', phone: '+998 90 123 45 67', date: 'Bugun' },
    { name: 'Jasur Karimov', phone: '+998 91 234 56 78', date: 'Bugun' },
    { name: 'Dilshod Mirzoev', phone: '+998 93 345 67 89', date: 'Kecha' },
    { name: 'Nodira Saidova', phone: '+998 94 456 78 90', date: 'Kecha' },
    { name: 'Bekzod Raxmatov', phone: '+998 97 567 89 01', date: '2 kun oldin' },
  ];

  const statusColor = (status) => {
    switch (status) {
      case 'Qabul qilindi':
        return 'bg-emerald-100 text-emerald-700';
      case 'Rad etildi':
        return 'bg-red-100 text-red-700';
      default:
        return 'bg-amber-100 text-amber-700';
    }
  };

  return (
    <div className="space-y-6">
      {/* Page title */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-sm text-gray-500 mt-1">
          Boshqaruv paneli umumiy ko'rinishi
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatsCard
          icon={<Users size={26} />}
          value={overview?.total_users ?? 0}
          label="Jami foydalanuvchilar"
          subtitle={`bugun +${overview?.users_today ?? 0}`}
          gradient="bg-gradient-to-br from-blue-500 to-blue-700"
        />
        <StatsCard
          icon={<Tag size={26} />}
          value={overview?.active_listings ?? 0}
          label="Faol e'lonlar"
          subtitle={`bugun +${overview?.listings_today ?? 0}`}
          gradient="bg-gradient-to-br from-emerald-500 to-emerald-700"
        />
        <StatsCard
          icon={<DollarSign size={26} />}
          value={overview?.total_offers ?? 0}
          label="Jami takliflar"
          subtitle={`bugun +${overview?.offers_today ?? 0}`}
          gradient="bg-gradient-to-br from-purple-500 to-purple-700"
        />
        <StatsCard
          icon={<Eye size={26} />}
          value={overview?.total_views ?? 0}
          label="Bugungi ko'rishlar"
          subtitle={`bugun +${overview?.views_today ?? 0}`}
          gradient="bg-gradient-to-br from-amber-500 to-amber-600"
        />
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {quickActions.map((action) => (
          <a
            key={action.label}
            href={action.href}
            className={`flex items-center gap-3 p-4 rounded-xl border border-gray-100 bg-white shadow-sm hover:shadow-md transition-all duration-200 group ${action.color}`}
          >
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${action.color}`}>
              <action.icon size={20} />
            </div>
            <span className="text-sm font-medium text-gray-700 group-hover:text-gray-900 truncate">
              {action.label}
            </span>
            <ArrowRight size={16} className="ml-auto text-gray-300 group-hover:text-gray-500 shrink-0" />
          </a>
        ))}
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Line Chart - 2/3 width */}
        <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                Kunlik e'lonlar va takliflar
              </h3>
              <p className="text-sm text-gray-400 mt-0.5">Oxirgi 30 kun</p>
            </div>
            <div className="flex items-center gap-4 text-xs">
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-blue-500" />
                E'lonlar
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-emerald-500" />
                Takliflar
              </span>
            </div>
          </div>
          {dailyLoading ? (
            <div className="flex items-center justify-center h-[300px]">
              <LoadingSpinner />
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={dailyStats}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 12, fill: '#94a3b8' }}
                  tickLine={false}
                  axisLine={{ stroke: '#e2e8f0' }}
                  tickFormatter={(val) => {
                    const d = new Date(val);
                    return `${d.getDate()}/${d.getMonth() + 1}`;
                  }}
                />
                <YAxis
                  tick={{ fontSize: 12, fill: '#94a3b8' }}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip
                  contentStyle={{
                    borderRadius: '12px',
                    border: 'none',
                    boxShadow: '0 4px 20px rgba(0,0,0,0.12)',
                    padding: '12px 16px',
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="listings"
                  name="E'lonlar"
                  stroke="#3b82f6"
                  strokeWidth={2.5}
                  dot={false}
                  activeDot={{ r: 5, fill: '#3b82f6', stroke: '#fff', strokeWidth: 2 }}
                />
                <Line
                  type="monotone"
                  dataKey="offers"
                  name="Takliflar"
                  stroke="#10b981"
                  strokeWidth={2.5}
                  dot={false}
                  activeDot={{ r: 5, fill: '#10b981', stroke: '#fff', strokeWidth: 2 }}
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Metric Cards - 1/3 width */}
        <div className="space-y-4">
          {metricCards.map((metric) => (
            <div
              key={metric.label}
              className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5"
            >
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-gray-500">{metric.label}</p>
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${metric.bg}`}>
                  {metric.label === "Faol e'lonlar" && (
                    <TrendingUp size={16} className={metric.color} />
                  )}
                  {metric.label === 'Sotilgan' && (
                    <CheckCircle2 size={16} className={metric.color} />
                  )}
                  {metric.label === 'Konversiya rate' && (
                    <RotateCcw size={16} className={metric.color} />
                  )}
                </div>
              </div>
              <p className={`text-3xl font-bold mt-2 ${metric.color}`}>
                {metric.value}
                <span className="text-lg">{metric.suffix}</span>
              </p>
              {/* Simple progress bar */}
              <div className="mt-3 w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full ${metric.bg.replace('50', '400')}`}
                  style={{ width: `${Math.min(metric.value, 100)}%`, background: metric.color === 'text-emerald-600' ? '#10b981' : metric.color === 'text-blue-600' ? '#3b82f6' : '#8b5cf6' }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Activity Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Offers Table - 2/3 width */}
        <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-6 py-5 border-b border-gray-100">
            <h3 className="text-lg font-semibold text-gray-900">So'nggi takliflar</h3>
            <p className="text-sm text-gray-400 mt-0.5">Oxirgi 5 ta taklif</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50/50">
                  <th className="px-6 py-3 text-left">Xaridor</th>
                  <th className="px-6 py-3 text-left">Raqam</th>
                  <th className="px-6 py-3 text-left">Miqdor</th>
                  <th className="px-6 py-3 text-left">Holat</th>
                  <th className="px-6 py-3 text-left">Vaqt</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {recentOffers.map((offer, i) => (
                  <tr key={i} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">
                      {offer.buyer}
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center px-2.5 py-1 rounded-md bg-slate-100 text-xs font-mono font-bold text-slate-700 border border-slate-200">
                        {offer.plate}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm font-semibold text-gray-900">
                      {offer.amount} <span className="text-gray-400 font-normal">so'm</span>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${statusColor(offer.status)}`}
                      >
                        {offer.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-400">{offer.time}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Recent Users - 1/3 width */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-6 py-5 border-b border-gray-100">
            <h3 className="text-lg font-semibold text-gray-900">Yangi foydalanuvchilar</h3>
            <p className="text-sm text-gray-400 mt-0.5">Oxirgi 5 ta</p>
          </div>
          <div className="divide-y divide-gray-50">
            {recentUsers.map((user, i) => (
              <div key={i} className="px-6 py-4 flex items-center gap-3 hover:bg-gray-50/50 transition-colors">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white font-semibold text-sm shrink-0">
                  {user.name.charAt(0)}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-gray-900 truncate">{user.name}</p>
                  <p className="flex items-center gap-1 text-xs text-gray-400 mt-0.5">
                    <Phone size={10} />
                    {user.phone}
                  </p>
                </div>
                <span className="text-xs text-gray-400 shrink-0">{user.date}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
