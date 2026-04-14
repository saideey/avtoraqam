import { useState, useCallback, useRef, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Search,
  Download,
  Shield,
  Ban,
  Eye,
  MoreVertical,
  ChevronLeft,
  ChevronRight,
  User,
  Phone,
  Calendar,
  X,
  Users as UsersIcon,
  Tag,
  Heart,
  FileText,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { adminAPI } from '../../services/api';
import { useAuth } from '../../hooks/useAuth';
import { formatPhone, formatDate } from '../../utils/formatters';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getInitials(name) {
  if (!name) return '?';
  return name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

const ROLE_STYLES = {
  user: 'bg-gray-100 text-gray-600',
  admin: 'bg-blue-50 text-blue-700 ring-1 ring-blue-600/20',
  superadmin: 'bg-purple-50 text-purple-700 ring-1 ring-purple-600/20',
};

const PER_PAGE = 20;

// ---------------------------------------------------------------------------
// Action dropdown (click outside closes)
// ---------------------------------------------------------------------------

function ActionMenu({ user, isSuperAdmin, onView, onToggleBan, onChangeRole }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    function close(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((o) => !o)}
        className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
      >
        <MoreVertical size={16} />
      </button>
      {open && (
        <div className="absolute right-0 z-30 mt-1 w-48 origin-top-right rounded-xl bg-white shadow-lg ring-1 ring-black/5 py-1 animate-in fade-in zoom-in-95">
          <button
            onClick={() => { onView(); setOpen(false); }}
            className="flex w-full items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
          >
            <Eye size={15} className="text-gray-400" /> Ko'rish
          </button>

          <button
            onClick={() => { onToggleBan(); setOpen(false); }}
            className="flex w-full items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
          >
            {user.is_active ? (
              <>
                <Ban size={15} className="text-red-400" /> Bloklash
              </>
            ) : (
              <>
                <Shield size={15} className="text-green-500" /> Blokdan chiqarish
              </>
            )}
          </button>

          {isSuperAdmin && user.role !== 'superadmin' && (
            <>
              <div className="my-1 border-t border-gray-100" />
              <div className="px-3 py-1.5 text-xs font-medium text-gray-400 uppercase tracking-wider">
                Rol o'zgartirish
              </div>
              {['user', 'admin'].map((r) => (
                <button
                  key={r}
                  onClick={() => { onChangeRole(r); setOpen(false); }}
                  className={`flex w-full items-center gap-2 px-3 py-2 text-sm ${
                    user.role === r
                      ? 'text-blue-600 font-medium bg-blue-50/50'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <span
                    className={`w-2 h-2 rounded-full ${
                      r === 'admin' ? 'bg-blue-500' : 'bg-gray-400'
                    }`}
                  />
                  {r.charAt(0).toUpperCase() + r.slice(1)}
                </button>
              ))}
            </>
          )}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// User detail modal
// ---------------------------------------------------------------------------

function UserDetailModal({ userId, onClose }) {
  const { data: user, isLoading } = useQuery({
    queryKey: ['admin', 'user', userId],
    queryFn: () => adminAPI.getUser(userId).then((r) => r.data),
    enabled: !!userId,
  });

  if (!userId) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div
        className="relative w-full max-w-lg rounded-2xl bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
          <h3 className="text-lg font-semibold text-gray-900">
            Foydalanuvchi ma'lumotlari
          </h3>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
          </div>
        ) : user ? (
          <div className="px-6 py-5 space-y-6">
            {/* Profile header */}
            <div className="flex items-center gap-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 text-xl font-bold text-white shadow-md">
                {getInitials(user.full_name || user.name)}
              </div>
              <div>
                <p className="text-lg font-semibold text-gray-900">
                  {user.full_name || user.name || 'Noma\'lum'}
                </p>
                <p className="text-sm text-gray-500">
                  {formatPhone(user.phone_number || user.phone)}
                </p>
                <div className="mt-1 flex items-center gap-2">
                  <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${ROLE_STYLES[user.role] || ROLE_STYLES.user}`}>
                    {user.role}
                  </span>
                  <span className={`inline-flex items-center gap-1 text-xs font-medium ${user.is_active ? 'text-green-600' : 'text-red-500'}`}>
                    <span className={`h-1.5 w-1.5 rounded-full ${user.is_active ? 'bg-green-500' : 'bg-red-500'}`} />
                    {user.is_active ? 'Faol' : 'Bloklangan'}
                  </span>
                </div>
              </div>
            </div>

            {/* Stats row */}
            <div className="grid grid-cols-3 gap-3">
              {[
                {
                  icon: <FileText size={18} className="text-blue-500" />,
                  label: "E'lonlar",
                  value: user.listings_count ?? 0,
                },
                {
                  icon: <Tag size={18} className="text-amber-500" />,
                  label: 'Takliflar',
                  value: user.offers_count ?? 0,
                },
                {
                  icon: <Heart size={18} className="text-rose-500" />,
                  label: 'Yoqtirishlar',
                  value: user.likes_count ?? 0,
                },
              ].map((s) => (
                <div
                  key={s.label}
                  className="flex flex-col items-center rounded-xl bg-gray-50 py-3"
                >
                  {s.icon}
                  <span className="mt-1 text-lg font-bold text-gray-900">{s.value}</span>
                  <span className="text-xs text-gray-500">{s.label}</span>
                </div>
              ))}
            </div>

            {/* Info rows */}
            <div className="divide-y divide-gray-100 rounded-xl border border-gray-100">
              {[
                { icon: <User size={16} />, label: 'ID', value: user.id },
                {
                  icon: <Phone size={16} />,
                  label: 'Telefon',
                  value: formatPhone(user.phone_number || user.phone),
                },
                {
                  icon: <Calendar size={16} />,
                  label: "Ro'yxatdan o'tgan",
                  value: formatDate(user.created_at),
                },
              ].map((row) => (
                <div key={row.label} className="flex items-center gap-3 px-4 py-3">
                  <span className="text-gray-400">{row.icon}</span>
                  <span className="text-sm text-gray-500 w-36">{row.label}</span>
                  <span className="text-sm font-medium text-gray-900">{row.value || '-'}</span>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="py-12 text-center text-sm text-gray-500">
            Ma'lumot topilmadi
          </div>
        )}

        {/* Footer */}
        <div className="border-t border-gray-100 px-6 py-4">
          <button
            onClick={onClose}
            className="w-full rounded-xl bg-gray-100 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-200 transition-colors"
          >
            Yopish
          </button>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

const Users = () => {
  const queryClient = useQueryClient();
  const { user: currentUser } = useAuth();
  const isSuperAdmin = currentUser?.role === 'superadmin';

  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [detailUserId, setDetailUserId] = useState(null);

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
    queryKey: ['admin', 'users', { page, search: debouncedSearch, role: roleFilter, status: statusFilter }],
    queryFn: () =>
      adminAPI
        .getUsers({
          page,
          search: debouncedSearch || undefined,
          role: roleFilter || undefined,
          is_active: statusFilter || undefined,
          per_page: PER_PAGE,
        })
        .then((r) => r.data),
    keepPreviousData: true,
  });

  const users = data?.items || data?.users || [];
  const totalPages = data?.total_pages || 1;
  const totalCount = data?.total || users.length;

  // Mutations
  const banMutation = useMutation({
    mutationFn: (id) => adminAPI.banUser(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['admin', 'users']);
      toast.success('Foydalanuvchi bloklandi');
    },
    onError: () => toast.error('Xatolik yuz berdi'),
  });

  const unbanMutation = useMutation({
    mutationFn: (id) => adminAPI.unbanUser(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['admin', 'users']);
      toast.success('Foydalanuvchi blokdan chiqarildi');
    },
    onError: () => toast.error('Xatolik yuz berdi'),
  });

  const roleMutation = useMutation({
    mutationFn: ({ id, role }) => adminAPI.changeRole(id, role),
    onSuccess: () => {
      queryClient.invalidateQueries(['admin', 'users']);
      toast.success("Rol o'zgartirildi");
    },
    onError: () => toast.error('Xatolik yuz berdi'),
  });

  // Export
  const handleExport = async () => {
    try {
      const response = await adminAPI.exportUsers();
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'users.csv');
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      toast.success('Eksport tayyor!');
    } catch {
      toast.error('Eksport amalga oshmadi');
    }
  };

  // Toggle ban
  const handleToggleBan = (user) => {
    if (user.is_active) {
      banMutation.mutate(user.id);
    } else {
      unbanMutation.mutate(user.id);
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
      {/* ---------- Page header ---------- */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
            <UsersIcon size={20} />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">
              Foydalanuvchilar boshqaruvi
            </h1>
            <p className="text-sm text-gray-500">
              Jami{' '}
              <span className="inline-flex items-center rounded-full bg-blue-50 px-2 py-0.5 text-xs font-semibold text-blue-700">
                {totalCount}
              </span>{' '}
              foydalanuvchi
            </p>
          </div>
        </div>

        <button
          onClick={handleExport}
          className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-emerald-700 transition-colors"
        >
          <Download size={16} />
          CSV eksport
        </button>
      </div>

      {/* ---------- Filter bar ---------- */}
      <div className="flex flex-col gap-3 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-gray-100 sm:flex-row sm:items-center">
        {/* Search */}
        <div className="relative flex-1">
          <Search
            size={18}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
          />
          <input
            type="text"
            value={search}
            onChange={(e) => handleSearch(e.target.value)}
            placeholder="Ism yoki telefon bo'yicha qidirish..."
            className="w-full rounded-xl border border-gray-200 bg-gray-50 py-2.5 pl-10 pr-4 text-sm placeholder-gray-400 transition focus:border-blue-300 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          />
          {isFetching && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
            </div>
          )}
        </div>

        {/* Role filter */}
        <select
          value={roleFilter}
          onChange={(e) => { setRoleFilter(e.target.value); setPage(1); }}
          className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm text-gray-700 transition focus:border-blue-300 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
        >
          <option value="">Barchasi (rol)</option>
          <option value="user">User</option>
          <option value="admin">Admin</option>
          <option value="superadmin">SuperAdmin</option>
        </select>

        {/* Status filter */}
        <select
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
          className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm text-gray-700 transition focus:border-blue-300 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
        >
          <option value="">Barchasi (holat)</option>
          <option value="true">Faol</option>
          <option value="false">Bloklangan</option>
        </select>
      </div>

      {/* ---------- Table ---------- */}
      <div className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-gray-100">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/80">
                <th className="whitespace-nowrap px-4 py-3 text-xs font-semibold uppercase tracking-wider text-gray-500">
                  #
                </th>
                <th className="whitespace-nowrap px-4 py-3 text-xs font-semibold uppercase tracking-wider text-gray-500">
                  Ism
                </th>
                <th className="whitespace-nowrap px-4 py-3 text-xs font-semibold uppercase tracking-wider text-gray-500">
                  Telefon
                </th>
                <th className="whitespace-nowrap px-4 py-3 text-xs font-semibold uppercase tracking-wider text-gray-500">
                  Rol
                </th>
                <th className="whitespace-nowrap px-4 py-3 text-xs font-semibold uppercase tracking-wider text-gray-500">
                  Holat
                </th>
                <th className="whitespace-nowrap px-4 py-3 text-xs font-semibold uppercase tracking-wider text-gray-500">
                  E'lonlar
                </th>
                <th className="whitespace-nowrap px-4 py-3 text-xs font-semibold uppercase tracking-wider text-gray-500">
                  Ro'yxatdan o'tgan
                </th>
                <th className="whitespace-nowrap px-4 py-3 text-xs font-semibold uppercase tracking-wider text-gray-500 text-right">
                  Amallar
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {isLoading ? (
                <tr>
                  <td colSpan={8} className="py-20 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <div className="h-8 w-8 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
                      <span className="text-sm text-gray-400">Yuklanmoqda...</span>
                    </div>
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-20 text-center">
                    <div className="flex flex-col items-center gap-2">
                      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gray-100">
                        <UsersIcon size={28} className="text-gray-300" />
                      </div>
                      <p className="text-base font-medium text-gray-400">
                        Foydalanuvchilar topilmadi
                      </p>
                      <p className="text-sm text-gray-400">
                        Qidiruv yoki filter parametrlarini o'zgartiring
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                users.map((u, idx) => {
                  const displayName = u.full_name || u.name || 'Noma\'lum';
                  const displayPhone = u.phone_number || u.phone || '';
                  const rowNum = (page - 1) * PER_PAGE + idx + 1;

                  return (
                    <tr
                      key={u.id}
                      className="group transition-colors hover:bg-gray-50/70"
                    >
                      {/* # */}
                      <td className="whitespace-nowrap px-4 py-3 text-gray-400 font-mono text-xs">
                        {rowNum}
                      </td>

                      {/* Ism + Avatar */}
                      <td className="whitespace-nowrap px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 text-xs font-bold text-white">
                            {getInitials(displayName)}
                          </div>
                          <span className="font-medium text-gray-900">
                            {displayName}
                          </span>
                        </div>
                      </td>

                      {/* Telefon */}
                      <td className="whitespace-nowrap px-4 py-3 text-gray-600 font-mono text-xs">
                        {formatPhone(displayPhone)}
                      </td>

                      {/* Rol */}
                      <td className="whitespace-nowrap px-4 py-3">
                        <span
                          className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                            ROLE_STYLES[u.role] || ROLE_STYLES.user
                          }`}
                        >
                          {u.role}
                        </span>
                      </td>

                      {/* Holat */}
                      <td className="whitespace-nowrap px-4 py-3">
                        <span className="inline-flex items-center gap-1.5 text-xs font-medium">
                          <span
                            className={`h-2 w-2 rounded-full ${
                              u.is_active ? 'bg-green-500' : 'bg-red-500'
                            }`}
                          />
                          <span className={u.is_active ? 'text-green-700' : 'text-red-600'}>
                            {u.is_active ? 'Faol' : 'Bloklangan'}
                          </span>
                        </span>
                      </td>

                      {/* E'lonlar soni */}
                      <td className="whitespace-nowrap px-4 py-3 text-center text-gray-700">
                        {u.listings_count ?? '-'}
                      </td>

                      {/* Ro'yxatdan o'tgan */}
                      <td className="whitespace-nowrap px-4 py-3 text-gray-500 text-xs">
                        {u.created_at
                          ? formatDate(u.created_at)
                          : '-'}
                      </td>

                      {/* Amallar */}
                      <td className="whitespace-nowrap px-4 py-3 text-right">
                        <ActionMenu
                          user={u}
                          isSuperAdmin={isSuperAdmin}
                          onView={() => setDetailUserId(u.id)}
                          onToggleBan={() => handleToggleBan(u)}
                          onChangeRole={(role) =>
                            roleMutation.mutate({ id: u.id, role })
                          }
                        />
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

      {/* ---------- User detail modal ---------- */}
      {detailUserId && (
        <UserDetailModal
          userId={detailUserId}
          onClose={() => setDetailUserId(null)}
        />
      )}
    </div>
  );
};

export default Users;
