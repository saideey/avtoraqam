import { useState, useEffect, useRef } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { Search, Heart, Eye, ChevronLeft, ChevronRight, X, SlidersHorizontal, Plus } from 'lucide-react';
import toast from 'react-hot-toast';
import { useInfiniteListings } from '../hooks/useListings';
import { useAuth } from '../hooks/useAuth';
import { likesAPI } from '../services/api';
import { formatPrice } from '../utils/formatters';
import { VALID_REGIONS, REGION_NAMES, getRegionName } from '../utils/plateUtils';
import LoadingSpinner from '../components/common/LoadingSpinner';
import PlateDisplay from '../components/listing/PlateDisplay';

/* ------------------------------------------------------------------ */
/*  RegionDropdown — Neu-Glass custom dropdown                         */
/* ------------------------------------------------------------------ */
function RegionDropdown({ value, onChange }) {
  const [open, setOpen] = useState(false);
  const dropRef = useRef(null);

  useEffect(() => {
    const handleOutside = (e) => {
      if (dropRef.current && !dropRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, []);

  const handleSelect = (code) => {
    onChange(code);
    setOpen(false);
  };

  return (
    <div className="relative shrink-0" ref={dropRef} style={{ background: '#e8ecf2', borderRight: '3px solid #1a2a5e' }}>
      {/* Trigger */}
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex items-center justify-center gap-0.5 h-full px-2.5 sm:px-3 py-4 font-mono font-bold text-xl sm:text-2xl text-[#1a2a5e] cursor-pointer select-none"
        style={{ minWidth: '58px' }}
      >
        <span>{value || '--'}</span>
        <svg width="10" height="6" viewBox="0 0 10 6" className={`ml-0.5 transition-transform duration-200 ${open ? 'rotate-180' : ''}`} style={{ opacity: 0.3 }}>
          <path d="M1 1L5 5L9 1" stroke="#1a2a5e" strokeWidth="1.5" fill="none" strokeLinecap="round" />
        </svg>
      </button>

      {/* Dropdown panel */}
      {open && (
        <div
          className="absolute top-full left-0 mt-2 z-50 rounded-2xl overflow-hidden animate-fadeIn"
          style={{
            background: 'linear-gradient(145deg, rgba(18, 20, 40, 0.95), rgba(10, 12, 28, 0.92))',
            backdropFilter: 'blur(24px) saturate(150%)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            boxShadow: '8px 8px 24px rgba(0,0,0,0.5), -4px -4px 16px rgba(40,40,80,0.06)',
            minWidth: '200px',
            maxHeight: '280px',
          }}
        >
          {/* Header */}
          <div className="px-4 py-2.5 border-b border-white/[0.06]">
            <p className="text-[11px] font-medium text-white/30 uppercase tracking-wider">Viloyat kodi</p>
          </div>

          {/* Scrollable list */}
          <div className="overflow-y-auto" style={{ maxHeight: '230px' }}>
            {/* "Barchasi" option */}
            <button
              type="button"
              onClick={() => handleSelect('')}
              className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors ${
                !value ? 'bg-[#0A84FF]/10' : 'hover:bg-white/[0.04]'
              }`}
            >
              <span className={`font-mono font-bold text-lg w-8 text-center ${!value ? 'text-[#0A84FF]' : 'text-white/30'}`}>--</span>
              <span className={`text-sm ${!value ? 'text-[#0A84FF] font-medium' : 'text-white/50'}`}>Barchasi</span>
            </button>

            {/* Region options */}
            {VALID_REGIONS.map((code) => {
              const isActive = value === code;
              return (
                <button
                  type="button"
                  key={code}
                  onClick={() => handleSelect(code)}
                  className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors ${
                    isActive ? 'bg-[#0A84FF]/10' : 'hover:bg-white/[0.04]'
                  }`}
                >
                  <span className={`font-mono font-bold text-lg w-8 text-center ${isActive ? 'text-[#0A84FF]' : 'text-white/80'}`}>
                    {code}
                  </span>
                  <span className={`text-sm ${isActive ? 'text-[#0A84FF] font-medium' : 'text-white/45'}`}>
                    {REGION_NAMES[code]}
                  </span>
                  {isActive && (
                    <svg width="14" height="14" viewBox="0 0 14 14" className="ml-auto text-[#0A84FF]">
                      <path d="M2 7L5.5 10.5L12 3.5" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  FilterPanel — Plate-shaped 4-field search                          */
/* ------------------------------------------------------------------ */
function FilterPanel({ filters, onChange }) {
  // Region — dropdown select, qolganlari alohida inputlar
  const [regionCode, setRegionCode] = useState(filters.s_region || '');
  const [l1, setL1] = useState(filters.s_letter || '');
  const [d1, setD1] = useState((filters.s_digits || '')[0] || '');
  const [d2, setD2] = useState((filters.s_digits || '')[1] || '');
  const [d3, setD3] = useState((filters.s_digits || '')[2] || '');
  const [x1, setX1] = useState((filters.s_suffix || '')[0] || '');
  const [x2, setX2] = useState((filters.s_suffix || '')[1] || '');
  const [showFilters, setShowFilters] = useState(false);

  const handleSubmit = (e) => {
    if (e) e.preventDefault();
    onChange({
      ...filters,
      s_region: regionCode,
      s_letter: l1.trim(),
      s_d1: d1, s_d2: d2, s_d3: d3,
      s_suffix: (x1 + x2).trim(),
      search: '',
      page: 1,
    });
  };

  const handleClear = () => {
    setRegionCode(''); setL1('');
    setD1(''); setD2(''); setD3('');
    setX1(''); setX2('');
    onChange({ ...filters, s_region: '', s_letter: '', s_d1: '', s_d2: '', s_d3: '', s_suffix: '', search: '', page: 1 });
  };

  const hasValue = regionCode || l1 || d1 || d2 || d3 || x1 || x2;

  // 6 ta ref: l1, d1, d2, d3, x1, x2
  const refL = useRef(null);
  const refD1 = useRef(null);
  const refD2 = useRef(null);
  const refD3 = useRef(null);
  const refX1 = useRef(null);
  const refX2 = useRef(null);
  const allRefs = [refL, refD1, refD2, refD3, refX1, refX2];

  const focusNext = (idx) => { if (idx < 5) allRefs[idx + 1].current?.focus(); };
  const focusPrev = (idx) => { if (idx > 0) allRefs[idx - 1].current?.focus(); };

  const makeHandler = (setValue, filter, idx) => ({
    onChange: (e) => {
      const raw = e.target.value;
      const v = filter(raw).slice(-1); // oxirgi kiritilgan belgini olish
      setValue(v);
      if (v) focusNext(idx);
    },
    onKeyDown: (e) => {
      if (e.key === 'Enter') handleSubmit();
      if (e.key === 'Backspace' && !e.target.value) { e.preventDefault(); focusPrev(idx); }
    },
  });

  const digitFilter = (v) => v.replace(/\D/g, '');
  const letterFilter = (v) => v.replace(/[^A-Za-z]/g, '').toUpperCase();

  const inputCls = "w-[24px] sm:w-[30px] py-4 bg-transparent text-transparent font-mono font-bold text-xl sm:text-2xl text-center outline-none uppercase caret-[#1a2a5e]";

  // Vizual overlay renderlovchi
  const charDisplay = (val) => (
    <div className={`absolute inset-0 flex items-center justify-center pointer-events-none font-mono font-bold text-xl sm:text-2xl ${val ? 'text-[#1a2a5e]' : 'text-[#1a2a5e]/15'}`}>
      {val || '-'}
    </div>
  );

  return (
    <div className="mb-8 -mt-10 relative z-10 max-w-3xl mx-auto px-4">
      <form onSubmit={handleSubmit} className="flex justify-center">
        {/* ── Plate-shaped search ── */}
        <div
          className="inline-flex items-stretch rounded-xl"
          style={{
            background: '#F8F8F0',
            border: '3px solid #1a2a5e',
            boxShadow: '0 4px 12px rgba(0,0,0,0.3), 0 12px 24px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.5)',
          }}
        >
          {/* ── Region: custom Neu-Glass dropdown ── */}
          <RegionDropdown
            value={regionCode}
            onChange={(v) => {
              setRegionCode(v);
              if (v) refL.current?.focus();
            }}
          />

          {/* Separator */}
          <div className="flex items-center px-0.5 select-none" style={{ color: '#1a2a5e', opacity: 0.15 }}>
            <span className="text-2xl font-bold">|</span>
          </div>

          {/* ── Harf: 1 ta ── */}
          <div className="relative">
            {charDisplay(l1)}
            <input ref={refL} type="text" value={l1} maxLength={1} className={inputCls} {...makeHandler(setL1, letterFilter, 0)} />
          </div>

          {/* Dot */}
          <div className="flex items-center select-none" style={{ color: '#1a2a5e', opacity: 0.12 }}>
            <span className="text-xl font-bold">&middot;</span>
          </div>

          {/* ── 3 ta raqam ── */}
          <div className="relative">
            {charDisplay(d1)}
            <input ref={refD1} type="text" value={d1} maxLength={1} className={inputCls} {...makeHandler(setD1, digitFilter, 1)} />
          </div>
          <div className="relative">
            {charDisplay(d2)}
            <input ref={refD2} type="text" value={d2} maxLength={1} className={inputCls} {...makeHandler(setD2, digitFilter, 2)} />
          </div>
          <div className="relative">
            {charDisplay(d3)}
            <input ref={refD3} type="text" value={d3} maxLength={1} className={inputCls} {...makeHandler(setD3, digitFilter, 3)} />
          </div>

          {/* Dot */}
          <div className="flex items-center select-none" style={{ color: '#1a2a5e', opacity: 0.12 }}>
            <span className="text-xl font-bold">&middot;</span>
          </div>

          {/* ── 2 ta harf ── */}
          <div className="relative">
            {charDisplay(x1)}
            <input ref={refX1} type="text" value={x1} maxLength={1} className={inputCls} {...makeHandler(setX1, letterFilter, 4)} />
          </div>
          <div className="relative">
            {charDisplay(x2)}
            <input ref={refX2} type="text" value={x2} maxLength={1} className={inputCls} {...makeHandler(setX2, letterFilter, 5)} />
          </div>

          {/* ── Flag + UZ ── */}
          <div
            className="flex flex-col items-center justify-center shrink-0 gap-0.5"
            style={{ background: '#e8ecf2', borderLeft: '3px solid #1a2a5e', padding: '8px 10px' }}
          >
            <img src="/uz.svg" alt="UZ" className="w-[20px] h-[14px] rounded-[1px]" />
            <span className="text-[6px] font-bold text-[#1a2a5e] tracking-widest leading-none">UZ</span>
          </div>

          {/* ── Search button (oxirgi element) ── */}
          <button
            type="submit"
            className="flex items-center justify-center shrink-0 px-4 sm:px-5 rounded-r-lg"
            style={{ background: '#0A84FF', borderLeft: '3px solid #1a2a5e' }}
          >
            <img src="/icons/icons8-search-50.svg" alt="Qidirish" className="w-6 h-6" />
          </button>
        </div>

      </form>

      {/* Hint + Clear */}
      <div className="flex items-center justify-center gap-4 mt-3">
        <p className="text-white/25 text-xs tracking-wide">
          Har bir maydonni alohida yoki birgalikda to'ldiring
        </p>
        {hasValue && (
          <button
            type="button"
            onClick={handleClear}
            className="flex items-center gap-1 text-white/30 hover:text-[#FF453A] text-xs transition-colors"
          >
            <X size={14} />
            Tozalash
          </button>
        )}
      </div>

      {/* Filter toggle */}
      <div className="flex justify-center mt-4">
        <button
          type="button"
          onClick={() => setShowFilters(!showFilters)}
          className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
            showFilters
              ? 'bg-[#0A84FF]/15 text-[#0A84FF] border border-[#0A84FF]/30'
              : 'text-white/35 border border-white/[0.08] hover:text-white/55 hover:border-white/15'
          }`}
        >
          <SlidersHorizontal size={16} />
          Filtrlar
        </button>
      </div>

      {/* Expandable filters */}
      {showFilters && (
        <div className="mt-4 glass-surface p-4 rounded-2xl flex flex-col sm:flex-row gap-3 animate-slideUp">
          <select
            value={filters.region || ''}
            onChange={(e) => onChange({ ...filters, region: e.target.value, page: 1 })}
            className="glass-input flex-1 px-4 py-2.5 text-sm appearance-none cursor-pointer rounded-xl"
          >
            <option value="" className="bg-[#0d0d20] text-white">Barcha viloyatlar</option>
            {VALID_REGIONS.map((code) => (
              <option key={code} value={code} className="bg-[#0d0d20] text-white">
                {code} — {REGION_NAMES[code]}
              </option>
            ))}
          </select>

          <select
            value={filters.sort || 'newest'}
            onChange={(e) => onChange({ ...filters, sort: e.target.value, page: 1 })}
            className="glass-input flex-1 px-4 py-2.5 text-sm appearance-none cursor-pointer rounded-xl"
          >
            <option value="newest" className="bg-[#0d0d20] text-white">Eng yangi</option>
            <option value="cheapest" className="bg-[#0d0d20] text-white">Arzondan qimmatga</option>
            <option value="expensive" className="bg-[#0d0d20] text-white">Qimmatdan arzonga</option>
            <option value="most_liked" className="bg-[#0d0d20] text-white">Ko'p yoqtirilgan</option>
            <option value="most_viewed" className="bg-[#0d0d20] text-white">Ko'p ko'rilgan</option>
          </select>

          <input
            type="number"
            placeholder="Min narx"
            value={filters.min_price || ''}
            onChange={(e) => onChange({ ...filters, min_price: e.target.value, page: 1 })}
            className="glass-input flex-1 px-4 py-2.5 text-sm rounded-xl"
          />
          <input
            type="number"
            placeholder="Max narx"
            value={filters.max_price || ''}
            onChange={(e) => onChange({ ...filters, max_price: e.target.value, page: 1 })}
            className="glass-input flex-1 px-4 py-2.5 text-sm rounded-xl"
          />
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  PlateCard                                                          */
/* ------------------------------------------------------------------ */
function PlateCard({ listing, onLikeToggle, isLiked }) {
  const [bouncing, setBouncing] = useState(false);

  const handleLike = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setBouncing(true);
    setTimeout(() => setBouncing(false), 300);
    onLikeToggle(listing.id);
  };

  const regionName = getRegionName(listing.region_code);

  return (
    <Link
      to={`/listings/${listing.id}`}
      className="glass-card overflow-hidden block transition-all duration-[280ms]"
      style={{ transitionTimingFunction: 'cubic-bezier(0.34, 1.56, 0.64, 1)' }}
    >
      <div className="p-5">
        {/* Plate display */}
        <div className="flex justify-center mb-4">
          <PlateDisplay plateNumber={listing.plate_number} size="sm" />
        </div>

        {/* Price */}
        <p className="text-xl font-bold text-[#30D158] mb-1">{formatPrice(listing.price)}</p>

        {/* Region */}
        {regionName && (
          <p className="text-sm text-white/40 mb-3">{regionName}</p>
        )}

        {/* Description */}
        {listing.description && (
          <p className="text-white/40 text-sm mb-3 line-clamp-2">{listing.description}</p>
        )}

        {/* Stats row */}
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-3 text-white/30">
            <span className="flex items-center gap-1">
              <Eye size={15} /> {listing.views_count || 0}
            </span>
            <button
              onClick={handleLike}
              className={`flex items-center gap-1 transition-colors duration-200 ${
                isLiked ? 'text-[#FF453A]' : 'hover:text-[#FF453A]'
              } ${bouncing ? 'heart-burst' : ''}`}
            >
              <Heart size={15} fill={isLiked ? 'currentColor' : 'none'} />
              {listing.likes_count || 0}
            </button>
          </div>

          {/* Status badge */}
          <span
            className={`px-3 py-0.5 rounded-full text-xs font-medium ${
              listing.status === 'active'
                ? 'bg-[#30D158]/10 text-[#30D158] border border-[#30D158]/20'
                : listing.status === 'sold'
                ? 'bg-white/[0.06] text-white/40 border border-white/[0.08]'
                : 'bg-[#FF9F0A]/10 text-[#FF9F0A] border border-[#FF9F0A]/20'
            }`}
          >
            {listing.status === 'active' ? 'Faol' : listing.status === 'sold' ? 'Sotilgan' : listing.status}
          </span>
        </div>
      </div>
    </Link>
  );
}

/* ------------------------------------------------------------------ */
/*  Pagination                                                         */
/* ------------------------------------------------------------------ */
function Pagination({ currentPage, totalPages, onPageChange }) {
  if (totalPages <= 1) return null;

  const pages = [];
  const start = Math.max(1, currentPage - 2);
  const end = Math.min(totalPages, currentPage + 2);

  for (let i = start; i <= end; i++) {
    pages.push(i);
  }

  return (
    <div className="flex items-center justify-center gap-2 mt-8">
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage <= 1}
        className="p-2 rounded-xl bg-white/[0.06] border border-white/[0.10] text-white/40 hover:text-white hover:border-white/20 disabled:opacity-30 disabled:cursor-not-allowed transition-colors duration-200"
      >
        <ChevronLeft size={20} />
      </button>

      {start > 1 && (
        <>
          <button
            onClick={() => onPageChange(1)}
            className="px-3 py-1.5 rounded-xl bg-white/[0.06] border border-white/[0.10] text-white/40 hover:text-white transition-colors duration-200"
          >
            1
          </button>
          {start > 2 && <span className="text-white/20 px-1">...</span>}
        </>
      )}

      {pages.map((page) => (
        <button
          key={page}
          onClick={() => onPageChange(page)}
          className={`px-3 py-1.5 rounded-xl border transition-colors duration-200 ${
            page === currentPage
              ? 'bg-[#0A84FF] border-[#0A84FF] text-white shadow-lg'
              : 'bg-white/[0.06] border-white/[0.10] text-white/40 hover:text-white hover:border-white/20'
          }`}
          style={page === currentPage ? { boxShadow: '0 0 20px rgba(10,132,255,0.3)' } : {}}
        >
          {page}
        </button>
      ))}

      {end < totalPages && (
        <>
          {end < totalPages - 1 && <span className="text-white/20 px-1">...</span>}
          <button
            onClick={() => onPageChange(totalPages)}
            className="px-3 py-1.5 rounded-xl bg-white/[0.06] border border-white/[0.10] text-white/40 hover:text-white transition-colors duration-200"
          >
            {totalPages}
          </button>
        </>
      )}

      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage >= totalPages}
        className="p-2 rounded-xl bg-white/[0.06] border border-white/[0.10] text-white/40 hover:text-white hover:border-white/20 disabled:opacity-30 disabled:cursor-not-allowed transition-colors duration-200"
      >
        <ChevronRight size={20} />
      </button>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Home (main export)                                                 */
/* ------------------------------------------------------------------ */
export default function Home() {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [likedIds, setLikedIds] = useState(new Set());
  const sentinelRef = useRef(null);

  const filters = {
    search: searchParams.get('search') || '',
    s_region: searchParams.get('s_region') || '',
    s_letter: searchParams.get('s_letter') || '',
    s_d1: searchParams.get('s_d1') || '',
    s_d2: searchParams.get('s_d2') || '',
    s_d3: searchParams.get('s_d3') || '',
    s_suffix: searchParams.get('s_suffix') || '',
    region: searchParams.get('region') || '',
    sort: searchParams.get('sort') || '',
    min_price: searchParams.get('min_price') || '',
    max_price: searchParams.get('max_price') || '',
  };

  const {
    data,
    isLoading,
    isError,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteListings(filters);

  // Barcha sahifalardan yig'ilgan e'lonlar
  const listings = data?.pages?.flatMap((p) => p.listings || []) || [];

  // Intersection observer — sentinel ko'rinsa keyingi sahifani yuklash
  useEffect(() => {
    if (!sentinelRef.current || !hasNextPage || isFetchingNextPage) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          fetchNextPage();
        }
      },
      { rootMargin: '300px' }
    );

    observer.observe(sentinelRef.current);
    return () => observer.disconnect();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  const handleFilterChange = (newFilters) => {
    const params = {};
    if (newFilters.search) params.search = newFilters.search;
    if (newFilters.s_region) params.s_region = newFilters.s_region;
    if (newFilters.s_letter) params.s_letter = newFilters.s_letter;
    if (newFilters.s_d1) params.s_d1 = newFilters.s_d1;
    if (newFilters.s_d2) params.s_d2 = newFilters.s_d2;
    if (newFilters.s_d3) params.s_d3 = newFilters.s_d3;
    if (newFilters.s_suffix) params.s_suffix = newFilters.s_suffix;
    if (newFilters.region) params.region = newFilters.region;
    if (newFilters.sort) params.sort = newFilters.sort;
    if (newFilters.min_price) params.min_price = newFilters.min_price;
    if (newFilters.max_price) params.max_price = newFilters.max_price;
    setSearchParams(params);
  };

  const handleLikeToggle = async (listingId) => {
    if (!user) {
      toast.error('Yoqtirish uchun tizimga kiring');
      return;
    }
    try {
      await likesAPI.toggle(listingId);
      setLikedIds((prev) => {
        const next = new Set(prev);
        if (next.has(listingId)) {
          next.delete(listingId);
        } else {
          next.add(listingId);
        }
        return next;
      });
    } catch {
      toast.error('Xatolik yuz berdi');
    }
  };

  return (
    <div className="min-h-screen animate-fadeIn">
      {/* ========== Hero Section ========== */}
      <section className="relative overflow-hidden py-20 sm:py-24">
        {/* Ambient orbs */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div
            className="absolute -top-32 -left-32 w-[500px] h-[500px] rounded-full"
            style={{ background: 'rgba(10,132,255,0.07)', filter: 'blur(150px)' }}
          />
          <div
            className="absolute top-20 -right-32 w-[350px] h-[350px] rounded-full"
            style={{ background: 'rgba(90,50,180,0.05)', filter: 'blur(130px)' }}
          />
        </div>

        {/* Hero content */}
        <div className="relative z-10 max-w-2xl mx-auto px-4 text-center">
          <h1 className="text-4xl sm:text-5xl font-bold text-white tracking-tight mb-4 leading-tight">
            Avtomobil raqamlarini sotib oling yoki soting
          </h1>
          <p className="text-white/55 text-lg">
            O'zbekiston bo'ylab chiroyli avtomobil raqamlarini oson qidiring
          </p>
        </div>
      </section>

      {/* ========== Listings Section ========== */}
      <section className="max-w-7xl mx-auto px-4 pb-16">
        <FilterPanel filters={filters} onChange={handleFilterChange} />

        {isLoading && (
          <div className="flex justify-center py-12">
            <LoadingSpinner size="lg" />
          </div>
        )}

        {isError && (
          <div className="text-center py-12">
            <p className="text-[#FF453A] text-lg">Ma'lumotlarni yuklashda xatolik yuz berdi.</p>
          </div>
        )}

        {!isLoading && !isError && listings.length === 0 && (
          <div className="text-center py-12">
            <p className="text-white/30 text-lg">Hech qanday e'lon topilmadi.</p>
          </div>
        )}

        {!isLoading && !isError && listings.length > 0 && (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {listings.map((listing) => (
                <PlateCard
                  key={listing.id}
                  listing={listing}
                  onLikeToggle={handleLikeToggle}
                  isLiked={likedIds.has(listing.id)}
                />
              ))}
            </div>

            {/* Sentinel — ko'rinishda kelganda keyingi sahifa yuklanadi */}
            <div ref={sentinelRef} className="h-10" />

            {isFetchingNextPage && (
              <div className="flex justify-center py-8">
                <LoadingSpinner size="md" />
              </div>
            )}

            {!hasNextPage && listings.length > 12 && (
              <p className="text-center text-white/25 text-sm py-8">
                Barcha e'lonlar ko'rsatildi
              </p>
            )}
          </>
        )}
      </section>
    </div>
  );
}
