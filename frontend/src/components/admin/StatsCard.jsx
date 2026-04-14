const StatsCard = ({ icon, value, label, subtitle, gradient }) => {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-all duration-200 group">
      <div className="flex items-center gap-4">
        {/* Icon with colored gradient background */}
        <div
          className={`shrink-0 w-14 h-14 rounded-xl flex items-center justify-center text-white shadow-lg ${
            gradient || 'bg-gradient-to-br from-blue-500 to-blue-600'
          }`}
        >
          {icon}
        </div>
        {/* Value and label */}
        <div className="min-w-0">
          <p className="text-2xl font-bold text-gray-900 leading-tight">
            {typeof value === 'number' ? value.toLocaleString('uz-UZ') : value}
          </p>
          <p className="text-sm text-gray-500 font-medium mt-0.5 truncate">{label}</p>
        </div>
      </div>
      {/* Subtitle */}
      {subtitle && (
        <div className="mt-4 pt-3 border-t border-gray-50">
          <p className="text-xs text-gray-400">{subtitle}</p>
        </div>
      )}
    </div>
  );
};

export default StatsCard;
