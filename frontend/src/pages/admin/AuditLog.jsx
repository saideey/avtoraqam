import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { adminAPI } from '../../services/api';
import { formatRelativeDate, formatPhone } from '../../utils/formatters';
import { Shield, Clock, User, ChevronLeft, ChevronRight, FileText } from 'lucide-react';

const ACTION_LABELS = {
  user_ban: { label: 'Foydalanuvchi bloklandi', color: 'text-red-600 bg-red-50' },
  user_unban: { label: 'Blokdan chiqarildi', color: 'text-green-600 bg-green-50' },
  role_change: { label: 'Rol o\'zgartirildi', color: 'text-purple-600 bg-purple-50' },
  listing_delete: { label: 'E\'lon o\'chirildi', color: 'text-red-600 bg-red-50' },
  export_users: { label: 'Foydalanuvchilar eksport', color: 'text-blue-600 bg-blue-50' },
  export_listings: { label: 'E\'lonlar eksport', color: 'text-blue-600 bg-blue-50' },
};

const AuditLog = () => {
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'logs', page],
    queryFn: () => adminAPI.getLogs({ page, per_page: 20 }).then(r => r.data),
    keepPreviousData: true,
  });

  const logs = data?.logs || [];
  const pagination = data?.pagination || {};

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-gray-100 rounded-lg">
          <Shield className="h-6 w-6 text-gray-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Audit Log</h1>
          <p className="text-sm text-gray-500">Admin harakatlari tarixi</p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto" />
          </div>
        ) : logs.length === 0 ? (
          <div className="p-12 text-center">
            <FileText className="h-12 w-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">Hali hech qanday harakat qayd etilmagan</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {logs.map((log) => {
              const actionConfig = ACTION_LABELS[log.action] || {
                label: log.action,
                color: 'text-gray-600 bg-gray-50'
              };
              return (
                <div key={log.id} className="px-6 py-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3 min-w-0">
                      <div className="w-9 h-9 bg-gradient-to-br from-gray-600 to-gray-700 rounded-full flex items-center justify-center shrink-0 mt-0.5">
                        <User className="h-4 w-4 text-white" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-gray-900">
                          {log.admin_name || `Admin #${log.admin_id}`}
                        </p>
                        <div className="flex items-center gap-2 mt-1 flex-wrap">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${actionConfig.color}`}>
                            {actionConfig.label}
                          </span>
                          {log.target_type && (
                            <span className="text-xs text-gray-400">
                              {log.target_type} #{log.target_id}
                            </span>
                          )}
                        </div>
                        {log.details && (
                          <p className="text-xs text-gray-500 mt-1">
                            {typeof log.details === 'object' ? JSON.stringify(log.details) : log.details}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="flex items-center gap-1 text-xs text-gray-400">
                        <Clock className="h-3 w-3" />
                        {formatRelativeDate(log.created_at)}
                      </div>
                      {log.ip_address && (
                        <p className="text-xs text-gray-300 mt-0.5">{log.ip_address}</p>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Pagination */}
        {pagination.pages > 1 && (
          <div className="px-6 py-3 border-t border-gray-100 flex items-center justify-between">
            <span className="text-sm text-gray-500">
              Jami: {pagination.total}
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={!pagination.has_prev}
                className="p-1.5 rounded-lg border border-gray-200 disabled:opacity-40 hover:bg-gray-50"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <span className="text-sm text-gray-600 px-2">
                {pagination.page} / {pagination.pages}
              </span>
              <button
                onClick={() => setPage(p => p + 1)}
                disabled={!pagination.has_next}
                className="p-1.5 rounded-lg border border-gray-200 disabled:opacity-40 hover:bg-gray-50"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AuditLog;
