import { Search, SlidersHorizontal } from 'lucide-react';

const regions = [
  { value: '', label: 'Barcha viloyatlar' },
  { value: '01', label: "Toshkent shahri" },
  { value: '10', label: "Toshkent viloyati" },
  { value: '20', label: "Sirdaryo" },
  { value: '25', label: "Jizzax" },
  { value: '30', label: "Samarqand" },
  { value: '40', label: "Farg'ona" },
  { value: '50', label: "Namangan" },
  { value: '60', label: "Andijon" },
  { value: '70', label: "Qashqadaryo" },
  { value: '75', label: "Surxondaryo" },
  { value: '80', label: "Buxoro" },
  { value: '85', label: "Navoiy" },
  { value: '90', label: "Xorazm" },
  { value: '95', label: "Qoraqalpog'iston" },
];

const sortOptions = [
  { value: 'newest', label: 'Eng yangi' },
  { value: 'oldest', label: 'Eng eski' },
  { value: 'cheapest', label: 'Arzonroq' },
  { value: 'expensive', label: 'Qimmatroq' },
  { value: 'most_liked', label: "Ko'p yoqtirilgan" },
  { value: 'most_viewed', label: "Ko'p ko'rilgan" },
];

const FilterPanel = ({ filters, onFilterChange }) => {
  const handleChange = (key, value) => {
    onFilterChange({ ...filters, [key]: value });
  };

  return (
    <div className="bg-white border rounded-xl p-4 space-y-4">
      <div className="flex items-center space-x-2 text-gray-700 font-medium">
        <SlidersHorizontal size={18} />
        <span>Filtrlash</span>
      </div>

      {/* Search */}
      <div className="relative">
        <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          placeholder="Raqamni qidirish..."
          value={filters.search || ''}
          onChange={(e) => handleChange('search', e.target.value)}
          className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-200"
        />
      </div>

      {/* Region */}
      <div>
        <label className="block text-sm text-gray-600 mb-1">Viloyat</label>
        <select
          value={filters.region || ''}
          onChange={(e) => handleChange('region', e.target.value)}
          className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-200"
        >
          {regions.map((r) => (
            <option key={r.value} value={r.value}>
              {r.label}
            </option>
          ))}
        </select>
      </div>

      {/* Price range */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm text-gray-600 mb-1">Min narx</label>
          <input
            type="number"
            placeholder="0"
            value={filters.minPrice || ''}
            onChange={(e) => handleChange('minPrice', e.target.value)}
            className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-200"
          />
        </div>
        <div>
          <label className="block text-sm text-gray-600 mb-1">Max narx</label>
          <input
            type="number"
            placeholder="0"
            value={filters.maxPrice || ''}
            onChange={(e) => handleChange('maxPrice', e.target.value)}
            className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-200"
          />
        </div>
      </div>

      {/* Sort */}
      <div>
        <label className="block text-sm text-gray-600 mb-1">Saralash</label>
        <select
          value={filters.sort || 'newest'}
          onChange={(e) => handleChange('sort', e.target.value)}
          className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-200"
        >
          {sortOptions.map((s) => (
            <option key={s.value} value={s.value}>
              {s.label}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
};

export default FilterPanel;
