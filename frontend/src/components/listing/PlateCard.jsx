import { Link } from 'react-router-dom';
import { Heart, Eye } from 'lucide-react';
import PlateDisplay from './PlateDisplay';
import StatusBadge from './StatusBadge';
import { formatPrice } from '../../utils/formatters';
import { getRegionName } from '../../utils/plateUtils';

const PlateCard = ({ listing, onLike }) => {
  const {
    id,
    plate_number,
    price,
    region_code,
    views_count = 0,
    likes_count = 0,
    is_liked = false,
    status,
  } = listing;

  const handleLike = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (onLike) onLike(id);
  };

  return (
    <Link
      to={`/listings/${id}`}
      className="block bg-white border rounded-xl shadow-sm hover:shadow-md transition-shadow overflow-hidden"
    >
      <div className="p-4">
        <div className="flex items-center justify-between mb-3">
          <PlateDisplay plateNumber={plate_number} size="sm" />
          <StatusBadge status={status} />
        </div>

        <p className="text-xl font-bold text-gray-900 mb-1">
          {formatPrice(price)}
        </p>

        <p className="text-sm text-gray-500 mb-3">{getRegionName(region_code)}</p>

        <div className="flex items-center justify-between text-sm text-gray-400">
          <div className="flex items-center space-x-3">
            <span className="flex items-center space-x-1">
              <Eye size={14} />
              <span>{views_count}</span>
            </span>
            <span className="flex items-center space-x-1">
              <Heart size={14} className={is_liked ? 'fill-red-500 text-red-500' : ''} />
              <span>{likes_count}</span>
            </span>
          </div>

          <button
            onClick={handleLike}
            className={`p-1.5 rounded-full transition-colors ${
              is_liked
                ? 'text-red-500 hover:bg-red-50'
                : 'text-gray-400 hover:bg-gray-100 hover:text-red-500'
            }`}
          >
            <Heart
              size={18}
              className={is_liked ? 'fill-red-500' : ''}
            />
          </button>
        </div>
      </div>
    </Link>
  );
};

export default PlateCard;
