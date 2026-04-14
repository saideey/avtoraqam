/**
 * PlateDisplay — Premium Uzbekistan license plate with flag badge.
 *
 * Structure: [Region | Letter · Digits · Suffix | 🇺🇿 UZ]
 * The UZ flag and "UZ" text appear on the RIGHT side, matching real UZ plates.
 *
 * Props:
 *   plateNumber  string   e.g. "01 A 777 AA"
 *   size         string   'sm' | 'md' | 'lg'  (default 'md')
 */

const sizeConfig = {
  sm: {
    plate: 'text-base',
    regionPad: 'px-2 py-1.5',
    mainPad: 'px-3 py-1.5 gap-1',
    flagSection: 'px-2 py-1.5 gap-0.5',
    flagImg: 'w-[18px] h-[13px]',
    uzText: 'text-[6px]',
  },
  md: {
    plate: 'text-xl',
    regionPad: 'px-3 py-2.5',
    mainPad: 'px-4 py-2.5 gap-1.5',
    flagSection: 'px-2.5 py-2.5 gap-0.5',
    flagImg: 'w-[22px] h-[16px]',
    uzText: 'text-[7px]',
  },
  lg: {
    plate: 'text-3xl sm:text-4xl',
    regionPad: 'px-4 py-3.5',
    mainPad: 'px-6 py-3.5 gap-2',
    flagSection: 'px-3.5 py-3.5 gap-1',
    flagImg: 'w-[28px] h-[20px]',
    uzText: 'text-[9px]',
  },
};

function parsePlate(plateNumber) {
  if (!plateNumber) return null;
  const match = plateNumber.trim().toUpperCase().match(/^(\d{2})\s*([A-Z])\s*(\d{3})\s*([A-Z]{2})$/);
  if (!match) return null;
  return { region: match[1], letter: match[2], digits: match[3], suffix: match[4] };
}

const plateStyle = {
  transform: 'rotateX(2deg)',
  boxShadow:
    '0 2px 4px rgba(0,0,0,0.3), 0 8px 16px rgba(0,0,0,0.2), 0 16px 32px rgba(0,0,0,0.12), inset 0 1px 0 rgba(255,255,255,0.5)',
  transition: 'transform 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
};

const PlateDisplay = ({ plateNumber, size = 'md' }) => {
  const parsed = parsePlate(plateNumber);
  const s = sizeConfig[size] || sizeConfig.md;

  if (!parsed) {
    return (
      <div style={{ perspective: '600px' }}>
        <div
          className={`inline-flex items-stretch bg-[#F8F8F0] border-[3px] border-[#1a2a5e] rounded-lg overflow-hidden font-mono font-bold uppercase text-[#1a2a5e] ${s.plate}`}
          style={plateStyle}
        >
          <div className={`flex items-center justify-center bg-[#eef2f7] border-r-[3px] border-[#1a2a5e] font-extrabold ${s.regionPad}`}>
            --
          </div>
          <div className={`flex items-center justify-center tracking-wider whitespace-nowrap ${s.mainPad}`}>
            - &middot; --- &middot; --
          </div>
        </div>
      </div>
    );
  }

  const { region, letter, digits, suffix } = parsed;

  return (
    <div style={{ perspective: '600px' }}>
      <div
        className={`inline-flex items-stretch bg-[#F8F8F0] border-[3px] border-[#1a2a5e] rounded-lg overflow-hidden font-mono font-bold uppercase text-[#1a2a5e] cursor-default select-none ${s.plate}`}
        style={plateStyle}
        onMouseEnter={(e) => { e.currentTarget.style.transform = 'rotateX(2deg) rotateY(-3deg)'; }}
        onMouseLeave={(e) => { e.currentTarget.style.transform = 'rotateX(2deg)'; }}
      >
        {/* Region code (left) */}
        <div className={`flex items-center justify-center bg-[#eef2f7] border-r-[3px] border-[#1a2a5e] font-extrabold leading-none ${s.regionPad}`}>
          {region}
        </div>

        {/* Main plate number */}
        <div className={`flex items-center justify-center tracking-wider leading-none whitespace-nowrap ${s.mainPad}`}>
          <span>{letter}</span>
          <span className="text-[#1a2a5e]/30 mx-0.5">&middot;</span>
          <span className="tracking-[0.12em]">{digits}</span>
          <span className="text-[#1a2a5e]/30 mx-0.5">&middot;</span>
          <span className="tracking-[0.08em]">{suffix}</span>
        </div>

        {/* Flag + UZ badge (right) */}
        <div className={`flex flex-col items-center justify-center bg-[#eef2f7] border-l-[3px] border-[#1a2a5e] ${s.flagSection}`}>
          <img src="/uz.svg" alt="UZ" className={`${s.flagImg} rounded-[2px]`} />
          <span className={`${s.uzText} font-bold text-[#1a2a5e] tracking-widest leading-none`}>
            UZ
          </span>
        </div>
      </div>
    </div>
  );
};

export default PlateDisplay;
