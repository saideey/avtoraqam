import { Check, X, User, Clock } from 'lucide-react';
import { formatPrice } from '../../utils/formatters';

const statusConfig = {
  pending: { label: 'Kutilmoqda', classes: 'bg-yellow-100 text-yellow-700' },
  accepted: { label: 'Qabul qilindi', classes: 'bg-green-100 text-green-700' },
  rejected: { label: 'Rad etildi', classes: 'bg-red-100 text-red-700' },
};

const getRelativeTime = (dateString) => {
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

const OfferCard = ({ offer, showActions, onAccept, onReject }) => {
  const { buyer, amount, message, status, createdAt } = offer;
  const config = statusConfig[status] || statusConfig.pending;

  return (
    <div className="bg-white border rounded-lg p-4">
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center space-x-2">
          <User size={16} className="text-gray-400" />
          <span className="font-medium text-gray-800">
            {buyer?.name || buyer?.username || "Noma'lum"}
          </span>
        </div>
        <span
          className={`text-xs font-medium px-2.5 py-0.5 rounded-full ${config.classes}`}
        >
          {config.label}
        </span>
      </div>

      <p className="text-lg font-bold text-gray-900 mb-1">
        {formatPrice(amount)}
      </p>

      {message && (
        <p className="text-sm text-gray-600 mb-2">{message}</p>
      )}

      <div className="flex items-center text-xs text-gray-400 mb-3">
        <Clock size={12} className="mr-1" />
        <span>{getRelativeTime(createdAt)}</span>
      </div>

      {showActions && status === 'pending' && (
        <div className="flex space-x-2">
          <button
            onClick={() => onAccept && onAccept(offer._id || offer.id)}
            className="flex-1 flex items-center justify-center space-x-1 px-3 py-1.5 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700 transition-colors"
          >
            <Check size={14} />
            <span>Qabul qilish</span>
          </button>
          <button
            onClick={() => onReject && onReject(offer._id || offer.id)}
            className="flex-1 flex items-center justify-center space-x-1 px-3 py-1.5 bg-red-600 text-white rounded-lg text-sm hover:bg-red-700 transition-colors"
          >
            <X size={14} />
            <span>Rad etish</span>
          </button>
        </div>
      )}
    </div>
  );
};

export default OfferCard;
