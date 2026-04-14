import { useState, useContext, useRef, useEffect } from 'react';
import { Bell } from 'lucide-react';
import { NotifContext } from '../../context/NotifContext';
import NotifDropdown from './NotifDropdown';

const NotifBell = () => {
  const { notifications, unreadCount, markAllRead, markAsRead } = useContext(NotifContext);
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (ref.current && !ref.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className="relative text-white/50 hover:text-white transition-colors p-1.5"
      >
        <Bell size={20} />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-[#FF453A] text-white text-[10px] font-bold rounded-full w-[18px] h-[18px] flex items-center justify-center ring-2 ring-[#06080f]">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <NotifDropdown
          notifications={notifications}
          onMarkAllRead={markAllRead}
          onMarkRead={markAsRead}
          onClose={() => setOpen(false)}
        />
      )}
    </div>
  );
};

export default NotifBell;
