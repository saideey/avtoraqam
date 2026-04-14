import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Menu, X, ChevronDown, LogOut, User, Shield, Plus } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import NotifBell from '../notification/NotifBell';

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const profileRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (profileRef.current && !profileRef.current.contains(e.target)) {
        setProfileOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    logout();
    setProfileOpen(false);
    setMobileOpen(false);
    navigate('/login');
  };

  const isAdmin = user && (user.role === 'admin' || user.role === 'superadmin');

  return (
    <nav className="sticky top-0 z-50 border-b border-white/[0.06]"
         style={{
           background: 'rgba(255,255,255,0.04)',
           backdropFilter: 'blur(20px) saturate(180%)',
           WebkitBackdropFilter: 'blur(20px) saturate(180%)',
         }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">

          {/* Logo */}
          <Link to="/" className="flex items-center gap-0.5 shrink-0">
            <span className="text-xl font-bold bg-gradient-to-r from-[#0A84FF] to-[#BF5AF2] bg-clip-text text-transparent">
              AvtoRaqam
            </span>
            <span className="text-xl font-bold text-white/60">.uz</span>
          </Link>

          {/* Desktop nav links */}
          <div className="hidden md:flex items-center space-x-1">
            <Link
              to="/"
              className="px-3 py-2 text-white/55 hover:text-white text-sm font-medium transition-colors duration-200 flex items-center gap-1.5"
            >
              <img src="/icons/icons8-home-50.svg" alt="" className="w-5 h-5" />
              Bosh sahifa
            </Link>
            {user && (
              <>
                <Link
                  to="/my-listings"
                  className="px-3 py-2 text-white/55 hover:text-white text-sm font-medium transition-colors duration-200"
                >
                  Mening e'lonlarim
                </Link>
                <Link
                  to="/my-offers"
                  className="px-3 py-2 text-white/55 hover:text-white text-sm font-medium transition-colors duration-200"
                >
                  Takliflarim
                </Link>
              </>
            )}
          </div>

          {/* Right side */}
          <div className="hidden md:flex items-center space-x-3">
            {user ? (
              <>
                <Link
                  to="/create-listing"
                  className="glass-btn-primary flex items-center gap-1.5 !py-2.5 !px-5 text-sm"
                >
                  <Plus size={16} />
                  E'lon joylash
                </Link>

                <NotifBell />

                <div className="relative" ref={profileRef}>
                  <button
                    onClick={() => setProfileOpen(!profileOpen)}
                    className="flex items-center gap-2 text-white/55 hover:text-white transition-colors duration-200 pl-3 pr-2 py-1.5 rounded-xl hover:bg-white/[0.06]"
                  >
                    <div className="w-8 h-8 rounded-full bg-white/[0.08] border border-white/[0.12] flex items-center justify-center">
                      <User size={16} className="text-[#0A84FF]" />
                    </div>
                    <span className="text-sm font-medium max-w-[120px] truncate text-white/80">
                      {user.full_name}
                    </span>
                    <ChevronDown
                      size={14}
                      className={`text-white/30 transition-transform duration-200 ${profileOpen ? 'rotate-180' : ''}`}
                    />
                  </button>

                  {profileOpen && (
                    <div className="absolute right-0 mt-2 w-56 glass-elevated py-1.5 z-50 animate-slideUp"
                         style={{
                           boxShadow: '0 4px 6px rgba(0,0,0,0.07), 0 10px 15px rgba(0,0,0,0.1), 0 20px 25px rgba(0,0,0,0.15)',
                         }}>
                      <div className="px-4 py-3 border-b border-white/[0.08]">
                        <p className="text-sm font-medium text-white/95">{user.full_name}</p>
                        <p className="text-xs text-white/40 mt-0.5">{user.phone_number}</p>
                        {isAdmin && (
                          <span className="inline-block mt-1.5 px-2 py-0.5 bg-[#BF5AF2]/10 text-[#BF5AF2] text-xs font-medium rounded-full border border-[#BF5AF2]/20">
                            {user.role === 'superadmin' ? 'Super Admin' : 'Admin'}
                          </span>
                        )}
                      </div>

                      <Link
                        to="/profile"
                        onClick={() => setProfileOpen(false)}
                        className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-white/55 hover:text-white hover:bg-white/[0.06] transition-colors duration-200"
                      >
                        <User size={16} />
                        Profil
                      </Link>

                      {isAdmin && (
                        <Link
                          to="/admin"
                          onClick={() => setProfileOpen(false)}
                          className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-[#BF5AF2] hover:text-[#BF5AF2] hover:bg-[#BF5AF2]/[0.06] transition-colors duration-200"
                        >
                          <Shield size={16} />
                          Admin panel
                        </Link>
                      )}

                      <div className="border-t border-white/[0.08] mt-1 pt-1">
                        <button
                          onClick={handleLogout}
                          className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-[#FF453A] hover:text-[#FF453A] hover:bg-[#FF453A]/[0.06] transition-colors duration-200"
                        >
                          <LogOut size={16} />
                          Chiqish
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  className="px-4 py-2 text-white/55 hover:text-white text-sm font-medium transition-colors duration-200"
                >
                  Kirish
                </Link>
                <Link
                  to="/register"
                  className="glass-btn-primary !py-2.5 !px-5 text-sm"
                >
                  Ro'yxatdan o'tish
                </Link>
              </>
            )}
          </div>

          {/* Mobile hamburger */}
          <button
            className="md:hidden text-white/55 hover:text-white p-2 transition-colors duration-200"
            onClick={() => setMobileOpen(!mobileOpen)}
          >
            {mobileOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden border-t border-white/[0.06] px-4 pb-4 space-y-1 animate-slideUp"
             style={{
               background: 'rgba(255,255,255,0.04)',
               backdropFilter: 'blur(20px)',
               WebkitBackdropFilter: 'blur(20px)',
             }}>
          <Link
            to="/"
            onClick={() => setMobileOpen(false)}
            className="block py-2.5 text-white/55 hover:text-white text-sm transition-colors duration-200"
          >
            Bosh sahifa
          </Link>

          {user && (
            <>
              <Link
                to="/create-listing"
                onClick={() => setMobileOpen(false)}
                className="block py-2.5 text-sm font-semibold text-[#0A84FF]"
              >
                + E'lon joylash
              </Link>
              <Link
                to="/my-listings"
                onClick={() => setMobileOpen(false)}
                className="block py-2.5 text-white/55 hover:text-white text-sm transition-colors duration-200"
              >
                Mening e'lonlarim
              </Link>
              <Link
                to="/my-offers"
                onClick={() => setMobileOpen(false)}
                className="block py-2.5 text-white/55 hover:text-white text-sm transition-colors duration-200"
              >
                Takliflarim
              </Link>
            </>
          )}

          <hr className="border-white/[0.06] my-2" />

          {user ? (
            <>
              <div className="flex items-center justify-between py-2">
                <span className="text-white/95 font-medium text-sm">{user.full_name}</span>
                <NotifBell />
              </div>
              <Link
                to="/profile"
                onClick={() => setMobileOpen(false)}
                className="block py-2.5 text-white/55 hover:text-white text-sm transition-colors duration-200"
              >
                Profil
              </Link>
              {isAdmin && (
                <Link
                  to="/admin"
                  onClick={() => setMobileOpen(false)}
                  className="block py-2.5 text-[#BF5AF2] font-medium text-sm hover:text-[#BF5AF2] transition-colors duration-200"
                >
                  <Shield size={16} className="inline mr-1.5 -mt-0.5" />
                  Admin panel
                </Link>
              )}
              <button
                onClick={handleLogout}
                className="w-full text-left py-2.5 text-[#FF453A] hover:text-[#FF453A] flex items-center gap-2 text-sm transition-colors duration-200"
              >
                <LogOut size={16} />
                Chiqish
              </button>
            </>
          ) : (
            <>
              <Link
                to="/login"
                onClick={() => setMobileOpen(false)}
                className="block py-2.5 text-white/55 hover:text-white text-sm transition-colors duration-200"
              >
                Kirish
              </Link>
              <Link
                to="/register"
                onClick={() => setMobileOpen(false)}
                className="block py-2.5 text-sm font-semibold text-[#0A84FF]"
              >
                Ro'yxatdan o'tish
              </Link>
            </>
          )}
        </div>
      )}
    </nav>
  );
};

export default Navbar;
