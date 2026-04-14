import { useState } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  Tag,
  DollarSign,
  MapPin,
  Megaphone,
  Star,
  BarChart3,
  Shield,
  CreditCard,
  Menu,
  X,
  Bell,
  LogOut,
  ChevronRight,
} from 'lucide-react';

const navSections = [
  {
    title: 'ASOSIY',
    items: [
      { to: '/admin', icon: LayoutDashboard, label: 'Dashboard', end: true },
    ],
  },
  {
    title: 'BOSHQARUV',
    items: [
      { to: '/admin/users', icon: Users, label: 'Foydalanuvchilar' },
      { to: '/admin/listings', icon: Tag, label: "E'lonlar" },
      { to: '/admin/offers', icon: DollarSign, label: 'Takliflar' },
      { to: '/admin/regions', icon: MapPin, label: 'Viloyatlar' },
    ],
  },
  {
    title: 'MARKETING',
    items: [
      { to: '/admin/promotions', icon: Megaphone, label: 'Reklama/Aksiyalar' },
      { to: '/admin/featured', icon: Star, label: "Featured e'lonlar" },
    ],
  },
  {
    title: 'HISOBOTLAR',
    items: [
      { to: '/admin/payments', icon: CreditCard, label: "To'lovlar" },
      { to: '/admin/statistics', icon: BarChart3, label: 'Statistika' },
      { to: '/admin/audit', icon: Shield, label: 'Audit log' },
    ],
  },
];

const breadcrumbMap = {
  '/admin': 'Dashboard',
  '/admin/users': 'Foydalanuvchilar',
  '/admin/listings': "E'lonlar",
  '/admin/offers': 'Takliflar',
  '/admin/regions': 'Viloyatlar',
  '/admin/promotions': 'Reklama/Aksiyalar',
  '/admin/featured': "Featured e'lonlar",
  '/admin/statistics': 'Statistika',
  '/admin/audit': 'Audit log',
};

const AdminLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();

  const currentPage = breadcrumbMap[location.pathname] || 'Dashboard';

  return (
    <div className="min-h-screen bg-gray-100 flex">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden backdrop-blur-sm"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed lg:static inset-y-0 left-0 z-50 w-72 bg-[#1e293b] flex flex-col transition-transform duration-300 ease-in-out ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Logo */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-9 h-9 bg-blue-600 rounded-lg">
              <span className="text-white text-xs font-bold leading-none">UZ</span>
            </div>
            <div>
              <h1 className="text-lg font-bold text-white tracking-tight">
                Avto<span className="text-blue-400">Raqam</span>
              </h1>
              <span className="text-[10px] uppercase tracking-widest text-slate-400 font-medium">
                Admin Panel
              </span>
            </div>
          </div>
          <button
            className="lg:hidden text-slate-400 hover:text-white transition-colors"
            onClick={() => setSidebarOpen(false)}
          >
            <X size={20} />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 space-y-6 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-600">
          {navSections.map((section) => (
            <div key={section.title}>
              <p className="px-4 mb-2 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                {section.title}
              </p>
              <div className="space-y-1">
                {section.items.map((item) => (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    end={item.end}
                    onClick={() => setSidebarOpen(false)}
                    className={({ isActive }) =>
                      `group flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 ${
                        isActive
                          ? 'bg-blue-600/15 text-blue-400 border-l-[3px] border-blue-400 ml-0 pl-[13px]'
                          : 'text-slate-300 hover:bg-white/5 hover:text-white border-l-[3px] border-transparent ml-0 pl-[13px]'
                      }`
                    }
                  >
                    <item.icon size={20} className="shrink-0" />
                    <span>{item.label}</span>
                  </NavLink>
                ))}
              </div>
            </div>
          ))}
        </nav>

        {/* User info at bottom */}
        <div className="px-4 py-4 border-t border-white/10">
          <div className="flex items-center gap-3 px-2">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center text-white font-semibold text-sm shrink-0">
              A
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">Administrator</p>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide bg-blue-600/20 text-blue-400 rounded-full">
                <Shield size={10} />
                Super Admin
              </span>
            </div>
          </div>
          <a
            href="/"
            className="mt-3 flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium text-slate-400 hover:bg-white/5 hover:text-white transition-all duration-150"
          >
            <LogOut size={18} />
            <span>Saytga qaytish</span>
          </a>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top header bar */}
        <header className="sticky top-0 z-30 bg-white border-b border-gray-200 px-4 lg:px-6 h-16 flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-4">
            <button
              className="lg:hidden text-gray-500 hover:text-gray-700 transition-colors"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu size={24} />
            </button>
            {/* Breadcrumb */}
            <div className="flex items-center gap-2 text-sm">
              <span className="text-gray-400">Admin</span>
              <ChevronRight size={14} className="text-gray-300" />
              <span className="font-medium text-gray-700">{currentPage}</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Notification bell */}
            <button className="relative p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
              <Bell size={20} />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full ring-2 ring-white" />
            </button>
            {/* Admin avatar */}
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center text-white font-semibold text-sm cursor-pointer ring-2 ring-white shadow-sm">
              A
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 p-4 lg:p-6 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
