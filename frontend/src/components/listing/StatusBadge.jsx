const statusConfig = {
  active: {
    label: 'Faol',
    classes: 'bg-green-100 text-green-700',
  },
  sold: {
    label: 'Sotilgan',
    classes: 'bg-red-100 text-red-700',
  },
  cancelled: {
    label: 'Bekor qilingan',
    classes: 'bg-gray-100 text-gray-600',
  },
};

const StatusBadge = ({ status }) => {
  const config = statusConfig[status] || statusConfig.active;

  return (
    <span
      className={`inline-block text-xs font-medium px-2.5 py-0.5 rounded-full ${config.classes}`}
    >
      {config.label}
    </span>
  );
};

export default StatusBadge;
