import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCheck, Bell, DollarSign, ShoppingCart, X, ArrowRight, Clock, ChevronLeft, Check } from 'lucide-react';

const getRelativeTime = (dateString) => {
  if (!dateString) return '';
  const now = new Date();
  const date = new Date(dateString);
  const diffMs = now - date;
  const diffMin = Math.floor(diffMs / 60000);
  const diffHr = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHr / 24);
  if (diffMin < 1) return 'Hozirgina';
  if (diffMin < 60) return `${diffMin} daqiqa oldin`;
  if (diffHr < 24) return `${diffHr} soat oldin`;
  if (diffDay < 7) return `${diffDay} kun oldin`;
  return date.toLocaleDateString('uz-UZ');
};

const TYPE_CONFIG = {
  new_offer: { icon: DollarSign, color: 'text-[#0A84FF]', bg: 'bg-[#0A84FF]/10', label: 'Yangi taklif' },
  offer_accepted: { icon: Check, color: 'text-[#30D158]', bg: 'bg-[#30D158]/10', label: 'Taklif qabul qilindi' },
  offer_rejected: { icon: X, color: 'text-[#FF453A]', bg: 'bg-[#FF453A]/10', label: 'Taklif rad etildi' },
  listing_sold: { icon: ShoppingCart, color: 'text-[#FF9F0A]', bg: 'bg-[#FF9F0A]/10', label: "E'lon sotildi" },
};
const DEFAULT_CONFIG = { icon: Bell, color: 'text-white/50', bg: 'bg-white/[0.06]', label: 'Bildirishnoma' };

const panelStyle = {
  background: 'rgba(12, 15, 28, 0.95)',
  backdropFilter: 'blur(20px)',
  border: '1px solid rgba(255, 255, 255, 0.08)',
  boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
};

const NotifDropdown = ({ notifications, onMarkAllRead, onMarkRead, onClose }) => {
  const navigate = useNavigate();
  const [selected, setSelected] = useState(null);

  const handleClick = (notif) => {
    if (!notif.is_read) onMarkRead(notif.id);
    setSelected(notif);
  };

  const handleGoToListing = (notif) => {
    const id = notif.data?.listing_id;
    if (id) { onClose(); navigate(`/listings/${id}`); }
  };

  // ── Batafsil ──
  if (selected) {
    const cfg = TYPE_CONFIG[selected.type] || DEFAULT_CONFIG;
    const Icon = cfg.icon;
    return (
      <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl overflow-hidden z-50 animate-fadeIn" style={panelStyle}>
        <div className="flex items-center gap-2 px-4 py-3 border-b border-white/[0.06]">
          <button onClick={() => setSelected(null)} className="text-white/40 hover:text-white transition-colors p-1">
            <ChevronLeft size={16} />
          </button>
          <span className="text-sm text-white/50">Orqaga</span>
        </div>
        <div className="p-4">
          <div className="flex items-center gap-3 mb-3">
            <div className={`w-9 h-9 rounded-xl ${cfg.bg} flex items-center justify-center`}>
              <Icon size={16} className={cfg.color} />
            </div>
            <div>
              <span className={`text-xs font-medium ${cfg.color}`}>{cfg.label}</span>
              <p className="text-[11px] text-white/25">{getRelativeTime(selected.created_at)}</p>
            </div>
          </div>
          <p className="text-sm font-semibold text-white/85 mb-1">{selected.title}</p>
          <p className="text-sm text-white/45 leading-relaxed mb-4">{selected.message}</p>
          {selected.data?.listing_id && (
            <button
              onClick={() => handleGoToListing(selected)}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold text-white bg-[#0A84FF] hover:bg-[#0A84FF]/90 transition-colors"
            >
              E'lonni ko'rish <ArrowRight size={14} />
            </button>
          )}
        </div>
      </div>
    );
  }

  // ── Ro'yxat ──
  return (
    <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl overflow-hidden z-50 animate-fadeIn" style={panelStyle}>
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.06]">
        <h3 className="font-semibold text-white/80 text-sm">Bildirishnomalar</h3>
        {notifications?.length > 0 && (
          <button onClick={onMarkAllRead} className="flex items-center gap-1 text-xs text-[#0A84FF] hover:text-[#0A84FF]/80 font-medium">
            <img src="/icons/icons8-check-all-50.svg" alt="" className="w-4 h-4" /> Barchasini o'qish
          </button>
        )}
      </div>
      <div className="max-h-[380px] overflow-y-auto">
        {notifications?.length > 0 ? notifications.map((notif) => {
          const cfg = TYPE_CONFIG[notif.type] || DEFAULT_CONFIG;
          const Icon = cfg.icon;
          const unread = !notif.is_read;
          return (
            <div
              key={notif.id}
              onClick={() => handleClick(notif)}
              className={`flex items-start gap-3 px-4 py-3 cursor-pointer transition-colors border-b border-white/[0.03] last:border-0 ${
                unread ? 'bg-[#0A84FF]/[0.03] hover:bg-[#0A84FF]/[0.06]' : 'hover:bg-white/[0.02]'
              }`}
            >
              <div className={`w-8 h-8 rounded-lg ${cfg.bg} flex items-center justify-center shrink-0 mt-0.5`}>
                <Icon size={14} className={cfg.color} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <p className={`text-sm leading-snug ${unread ? 'text-white/80 font-medium' : 'text-white/45'}`}>
                    {notif.title}
                  </p>
                  {unread && <span className="w-1.5 h-1.5 bg-[#0A84FF] rounded-full shrink-0 mt-1.5" />}
                </div>
                <p className="text-xs text-white/30 mt-0.5 line-clamp-1">{notif.message}</p>
                <span className="text-[10px] text-white/20 mt-1 block">{getRelativeTime(notif.created_at)}</span>
              </div>
            </div>
          );
        }) : (
          <div className="py-10 text-center">
            <Bell size={20} className="text-white/15 mx-auto mb-2" />
            <p className="text-white/25 text-sm">Bildirishnomalar yo'q</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default NotifDropdown;
