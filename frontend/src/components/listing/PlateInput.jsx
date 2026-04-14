import { useState, useRef, useEffect, useCallback } from 'react';
import { CheckCircle, AlertCircle } from 'lucide-react';
import { VALID_REGIONS, REGION_NAMES } from '../../utils/plateUtils';

const parsePlateValue = (value) => {
  if (!value) return { region: '', letter1: '', digits: '', letter23: '' };
  const match = value.match(/^(\d{0,2})\s*([A-Z]?)\s*(\d{0,3})\s*([A-Z]{0,2})$/);
  if (!match) return { region: '', letter1: '', digits: '', letter23: '' };
  return {
    region: match[1] || '',
    letter1: match[2] || '',
    digits: match[3] || '',
    letter23: match[4] || '',
  };
};

const buildPlateString = (parts) => {
  const { region, letter1, digits, letter23 } = parts;
  if (!region) return '';
  let result = region;
  if (letter1) result += ` ${letter1}`;
  if (digits) result += ` ${digits}`;
  if (letter23) result += ` ${letter23}`;
  return result;
};

const isCompletePlate = (parts) => {
  return (
    parts.region.length === 2 &&
    parts.letter1.length === 1 &&
    parts.digits.length === 3 &&
    parts.letter23.length === 2
  );
};

const isValidRegion = (code) => {
  return VALID_REGIONS.includes(code);
};

const PlateInput = ({ value, onChange, error }) => {
  const parsed = parsePlateValue(value || '');

  const [region, setRegion] = useState(parsed.region);
  const [letter1, setLetter1] = useState(parsed.letter1);
  const [digits, setDigits] = useState(parsed.digits);
  const [letter23, setLetter23] = useState(parsed.letter23);

  const regionRef = useRef(null);
  const letter1Ref = useRef(null);
  const digitsRef = useRef(null);
  const letter23Ref = useRef(null);

  // Sync from external value changes
  useEffect(() => {
    const p = parsePlateValue(value || '');
    setRegion(p.region);
    setLetter1(p.letter1);
    setDigits(p.digits);
    setLetter23(p.letter23);
  }, [value]);

  const emitChange = useCallback(
    (parts) => {
      const str = buildPlateString(parts);
      onChange(str);
    },
    [onChange]
  );

  const handleRegionChange = (e) => {
    const val = e.target.value.replace(/\D/g, '').slice(0, 2);
    setRegion(val);
    const parts = { region: val, letter1, digits, letter23 };
    emitChange(parts);
    if (val.length === 2) {
      letter1Ref.current?.focus();
    }
  };

  const handleLetter1Change = (e) => {
    const val = e.target.value.replace(/[^a-zA-Z]/g, '').toUpperCase().slice(0, 1);
    setLetter1(val);
    const parts = { region, letter1: val, digits, letter23 };
    emitChange(parts);
    if (val.length === 1) {
      digitsRef.current?.focus();
    }
  };

  const handleDigitsChange = (e) => {
    const val = e.target.value.replace(/\D/g, '').slice(0, 3);
    setDigits(val);
    const parts = { region, letter1, digits: val, letter23 };
    emitChange(parts);
    if (val.length === 3) {
      letter23Ref.current?.focus();
    }
  };

  const handleLetter23Change = (e) => {
    const val = e.target.value.replace(/[^a-zA-Z]/g, '').toUpperCase().slice(0, 2);
    setLetter23(val);
    const parts = { region, letter1, digits, letter23: val };
    emitChange(parts);
  };

  // Handle backspace to go to previous field
  const handleKeyDown = (e, field) => {
    if (e.key === 'Backspace') {
      if (field === 'letter1' && letter1 === '') {
        regionRef.current?.focus();
      } else if (field === 'digits' && digits === '') {
        letter1Ref.current?.focus();
      } else if (field === 'letter23' && letter23 === '') {
        digitsRef.current?.focus();
      }
    }
  };

  const parts = { region, letter1, digits, letter23 };
  const complete = isCompletePlate(parts);
  const validRegion = region.length === 2 && isValidRegion(region);
  const invalidRegion = region.length === 2 && !isValidRegion(region);
  const regionName = REGION_NAMES[region] || '';

  const inputBase =
    'bg-transparent outline-none text-center font-mono font-bold uppercase tracking-wider text-white placeholder:text-white/25';

  return (
    <div className="space-y-3">
      {/* Plate container */}
      <div className="flex justify-center">
        <div
          className={`relative inline-flex items-stretch rounded-2xl overflow-hidden transition-all duration-300 border ${
            error
              ? 'border-[#FF453A]/50 shadow-[0_0_20px_rgba(255,69,58,0.15)]'
              : complete && validRegion
              ? 'border-[#30D158]/40 shadow-[0_0_20px_rgba(48,209,88,0.15)]'
              : 'border-white/12'
          }`}
          style={{
            background: 'rgba(255,255,255,0.06)',
            backdropFilter: 'blur(24px) saturate(180%)',
            boxShadow: error
              ? '0 0 20px rgba(255,69,58,0.15), inset 0 0 0 1px rgba(255,255,255,0.05)'
              : complete && validRegion
              ? '0 0 20px rgba(48,209,88,0.15), inset 0 0 0 1px rgba(255,255,255,0.05)'
              : '0 4px 6px rgba(0,0,0,0.07), 0 10px 15px rgba(0,0,0,0.1), inset 0 0 0 1px rgba(255,255,255,0.05)',
            minWidth: '340px',
          }}
        >
          {/* UZ section */}
          <div
            className="flex flex-col items-center justify-center px-3 py-3 border-r border-white/12"
            style={{ background: 'rgba(255,255,255,0.08)' }}
          >
            <span className="text-[10px] font-bold text-[#0A84FF] tracking-widest mb-0.5">UZ</span>
            <input
              ref={regionRef}
              type="text"
              inputMode="numeric"
              value={region}
              onChange={handleRegionChange}
              onKeyDown={(e) => handleKeyDown(e, 'region')}
              placeholder="01"
              maxLength={2}
              className={`${inputBase} w-10 text-2xl ${
                invalidRegion ? 'text-[#FF453A]' : 'text-white'
              }`}
            />
          </div>

          {/* Main plate fields */}
          <div className="flex items-center gap-2 px-4 py-3">
            <input
              ref={letter1Ref}
              type="text"
              value={letter1}
              onChange={handleLetter1Change}
              onKeyDown={(e) => handleKeyDown(e, 'letter1')}
              placeholder="A"
              maxLength={1}
              className={`${inputBase} w-7 text-2xl`}
            />

            <span className="text-white/20 text-xl select-none">&middot;</span>

            <input
              ref={digitsRef}
              type="text"
              inputMode="numeric"
              value={digits}
              onChange={handleDigitsChange}
              onKeyDown={(e) => handleKeyDown(e, 'digits')}
              placeholder="000"
              maxLength={3}
              className={`${inputBase} w-14 text-2xl`}
            />

            <span className="text-white/20 text-xl select-none">&middot;</span>

            <input
              ref={letter23Ref}
              type="text"
              value={letter23}
              onChange={handleLetter23Change}
              onKeyDown={(e) => handleKeyDown(e, 'letter23')}
              placeholder="AA"
              maxLength={2}
              className={`${inputBase} w-12 text-2xl`}
            />

            {/* Validation icon */}
            {region.length > 0 && (
              <div className="ml-1 flex-shrink-0">
                {complete && validRegion ? (
                  <CheckCircle size={20} className="text-[#30D158]" />
                ) : invalidRegion ? (
                  <AlertCircle size={20} className="text-[#FF453A]" />
                ) : null}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Region name or validation hint */}
      <div className="text-center min-h-[1.5rem]">
        {invalidRegion && (
          <p className="text-[#FF453A] text-sm font-medium animate-pulse">
            Noto&apos;g&apos;ri viloyat kodi
          </p>
        )}
        {validRegion && regionName && (
          <p className="text-white/40 text-sm font-medium">
            {regionName}
          </p>
        )}
        {region.length < 2 && (
          <p className="text-white/25 text-sm">
            Viloyat kodini kiriting
          </p>
        )}
      </div>

      {/* Error message */}
      {error && (
        <p className="text-[#FF453A] text-sm text-center font-medium">{error}</p>
      )}
    </div>
  );
};

export default PlateInput;
