import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { ArrowLeft, Plus, Banknote, CreditCard, Shield, CheckCircle, ChevronLeft } from 'lucide-react';
import { useCreateListing } from '../hooks/useListings';
import { validatePlateNumber } from '../utils/plateUtils';
import PlateInput from '../components/listing/PlateInput';

/* ─── Design tokens ─── */
const glassSurface = {
  background: 'rgba(255,255,255,0.06)',
  backdropFilter: 'blur(24px) saturate(180%)',
  WebkitBackdropFilter: 'blur(24px) saturate(180%)',
  border: '1px solid rgba(255,255,255,0.12)',
  borderRadius: '20px',
  boxShadow: '0 4px 6px rgba(0,0,0,0.07), 0 10px 15px rgba(0,0,0,0.1), 0 20px 25px rgba(0,0,0,0.15)',
};

const glassInputStyle = (hasError) => ({
  background: 'rgba(255,255,255,0.06)',
  border: hasError ? '1px solid rgba(255,69,58,0.6)' : '1px solid rgba(255,255,255,0.10)',
});
const glassInputFocus = (e) => {
  e.target.style.boxShadow = '0 0 0 3px rgba(10,132,255,0.35)';
  e.target.style.borderColor = 'rgba(10,132,255,0.5)';
};
const glassInputBlur = (e, hasError) => {
  e.target.style.boxShadow = 'none';
  e.target.style.borderColor = hasError ? 'rgba(255,69,58,0.6)' : 'rgba(255,255,255,0.10)';
};

const formatPriceDisplay = (v) => { const d = v.replace(/\D/g, ''); return d ? Number(d).toLocaleString('en-US') : ''; };
const parsePriceValue = (f) => f.replace(/\D/g, '');

const PAYMENT_METHODS = [
  { id: 'click', name: 'Click', logo: '/click.png' },
  { id: 'payme', name: 'Payme', logo: '/payme.png' },
  { id: 'paynet', name: 'Paynet', logo: '/paynet.png' },
];

const LISTING_PRICE = 100000; // 100,000 so'm

export default function CreateListing() {
  const navigate = useNavigate();
  const createListing = useCreateListing();

  // Step: 'form' → 'payment' → 'card' → 'otp' → 'success'
  const [step, setStep] = useState('form');
  const [plateValue, setPlateValue] = useState('');
  const [priceDisplay, setPriceDisplay] = useState('');
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [otpSending, setOtpSending] = useState(false);
  const [formData, setFormData] = useState(null);

  const { register, handleSubmit, setError, clearErrors, watch, formState: { errors } } = useForm();
  const description = watch('description', '');

  const handlePlateChange = (formatted) => {
    setPlateValue(formatted);
    if (formatted.length >= 10) {
      const result = validatePlateNumber(formatted);
      if (result.valid) clearErrors('plate_number');
    }
  };

  const handlePriceChange = (e) => {
    const raw = parsePriceValue(e.target.value);
    if (raw.length > 13) return;
    setPriceDisplay(raw ? formatPriceDisplay(raw) : '');
  };

  // Step 1: Formni tekshirish va to'lov bosqichiga o'tish
  const onFormSubmit = async (data) => {
    const result = validatePlateNumber(plateValue);
    if (!result.valid) { setError('plate_number', { message: result.error }); return; }
    const priceNum = Number(parsePriceValue(priceDisplay));
    if (!priceNum || priceNum < 1000) { setError('price', { message: "Kamida 1,000 so'm" }); return; }
    if (priceNum > 10000000000) { setError('price', { message: 'Juda katta narx' }); return; }

    setFormData({ plate_number: result.formatted, price: priceNum, description: data.description || '' });
    setStep('payment');
  };

  // Step 2: Karta raqamini kiritish
  const handleCardSubmit = () => {
    const cleaned = cardNumber.replace(/\s/g, '');
    if (cleaned.length !== 16) { toast.error('Karta raqami 16 ta raqamdan iborat bo\'lishi kerak'); return; }
    if (cardExpiry.length < 5) { toast.error('Amal qilish muddatini kiriting'); return; }
    setOtpSending(true);
    // Test: 1 soniya kutish (haqiqiy integratsiyada SMS yuboriladi)
    setTimeout(() => { setOtpSending(false); setStep('otp'); toast.success('Tasdiqlash kodi yuborildi'); }, 1000);
  };

  // Step 3: OTP tasdiqlash va e'lon yaratish
  const handleOtpSubmit = async () => {
    if (otpCode !== '1234') { toast.error('Noto\'g\'ri kod. Test uchun: 1234'); return; }

    try {
      await createListing.mutateAsync({
        ...formData,
        payment_method: selectedPayment?.id || 'click',
        card_last4: cardNumber.replace(/\s/g, '').slice(-4),
      });
      setStep('success');
      setTimeout(() => navigate('/my-listings'), 2000);
    } catch (err) {
      toast.error(err.response?.data?.error || "E'lon yaratishda xatolik");
      setStep('form');
    }
  };

  const formatCardInput = (v) => {
    const d = v.replace(/\D/g, '').slice(0, 16);
    return d.replace(/(\d{4})(?=\d)/g, '$1 ');
  };

  const formatExpiryInput = (v) => {
    const d = v.replace(/\D/g, '').slice(0, 4);
    if (d.length > 2) return d.slice(0, 2) + '/' + d.slice(2);
    return d;
  };

  return (
    <div className="min-h-screen relative overflow-hidden">
      <div className="max-w-2xl mx-auto px-4 py-8 relative z-10">
        <Link to="/my-listings" className="inline-flex items-center gap-1 text-white/40 hover:text-white/70 mb-6 transition-colors text-sm font-medium">
          <ArrowLeft size={18} /> <span>Orqaga</span>
        </Link>

        <div className="p-6 sm:p-8 relative overflow-hidden" style={glassSurface}>
          <div className="absolute top-0 left-[10%] right-[10%] h-px" style={{ background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.20), transparent)' }} />

          {/* ══════════════ STEP: FORM ══════════════ */}
          {step === 'form' && (
            <>
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'rgba(10,132,255,0.15)', border: '1px solid rgba(10,132,255,0.25)' }}>
                  <Plus className="text-[#0A84FF]" size={22} />
                </div>
                <h1 className="text-2xl font-bold text-white/95">Yangi e'lon yaratish</h1>
              </div>

              <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-6">
                <div>
                  <label className="text-white/55 text-sm font-medium mb-3 block">Avtomobil raqami</label>
                  <PlateInput value={plateValue} onChange={handlePlateChange} error={errors.plate_number?.message} />
                </div>

                <div>
                  <label className="text-white/55 text-sm font-medium mb-1.5 block">Narxi (so'm)</label>
                  <div className="relative">
                    <Banknote size={20} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
                    <input type="text" inputMode="numeric" placeholder="5,000,000" value={priceDisplay} onChange={handlePriceChange}
                      className="w-full pl-10 pr-16 py-3 rounded-xl text-lg font-medium text-white/95 placeholder:text-white/30 outline-none transition-all"
                      style={glassInputStyle(errors.price)} onFocus={glassInputFocus} onBlur={(e) => glassInputBlur(e, errors.price)} />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 text-sm">so'm</span>
                  </div>
                  {errors.price && <p className="text-[#FF453A] text-sm mt-1">{errors.price.message}</p>}
                </div>

                <div>
                  <label className="text-white/55 text-sm font-medium mb-1.5 block">Tavsif (ixtiyoriy)</label>
                  <textarea rows={3} placeholder="Raqam haqida qo'shimcha ma'lumot..." maxLength={500}
                    {...register('description', { maxLength: { value: 500, message: "500 ta belgidan oshmasin" } })}
                    className="w-full px-4 py-3 rounded-xl text-white/95 placeholder:text-white/30 outline-none resize-none transition-all"
                    style={glassInputStyle(errors.description)} onFocus={glassInputFocus} onBlur={(e) => glassInputBlur(e, errors.description)} />
                  <div className="flex justify-end mt-1"><span className="text-xs text-white/30">{description.length}/500</span></div>
                </div>

                {/* To'lov haqida ma'lumot */}
                <div className="rounded-xl p-4" style={{ background: 'rgba(10,132,255,0.06)', border: '1px solid rgba(10,132,255,0.12)' }}>
                  <div className="flex items-center gap-2 mb-1">
                    <CreditCard size={16} className="text-[#0A84FF]" />
                    <span className="text-sm font-medium text-[#0A84FF]">E'lon joylashtirish narxi</span>
                  </div>
                  <p className="text-white/50 text-sm">
                    E'lon joylashtirish uchun <span className="text-white/90 font-semibold">{LISTING_PRICE.toLocaleString()} so'm</span> to'lov talab qilinadi.
                  </p>
                </div>

                <button type="submit" className="w-full text-white py-3.5 rounded-full font-semibold transition-all"
                  style={{ background: '#0A84FF', boxShadow: '0 0 20px rgba(10,132,255,0.25)' }}>
                  Davom etish — to'lov
                </button>
              </form>
            </>
          )}

          {/* ══════════════ STEP: PAYMENT METHOD ══════════════ */}
          {step === 'payment' && (
            <>
              <div className="flex items-center gap-3 mb-6">
                <button onClick={() => setStep('form')} className="text-white/40 hover:text-white/70 transition-colors"><ChevronLeft size={22} /></button>
                <h2 className="text-xl font-bold text-white/95">To'lov usulini tanlang</h2>
              </div>

              {/* Narx */}
              <div className="text-center mb-6">
                <p className="text-white/40 text-sm mb-1">To'lov miqdori</p>
                <p className="text-3xl font-bold text-[#30D158]">{LISTING_PRICE.toLocaleString()} so'm</p>
              </div>

              {/* To'lov usullari */}
              <div className="space-y-3 mb-6">
                {PAYMENT_METHODS.map((method) => (
                  <button
                    key={method.id}
                    type="button"
                    onClick={() => { setSelectedPayment(method); setStep('card'); }}
                    className={`w-full flex items-center gap-4 p-4 rounded-2xl border transition-all duration-200 ${
                      selectedPayment?.id === method.id
                        ? 'border-[#0A84FF]/40 bg-[#0A84FF]/[0.06]'
                        : 'border-white/[0.06] hover:border-white/[0.12] hover:bg-white/[0.02]'
                    }`}
                    style={{ background: selectedPayment?.id === method.id ? undefined : 'rgba(12,15,28,0.50)' }}
                  >
                    <div className="w-14 h-10 rounded-xl bg-white flex items-center justify-center p-1.5 shrink-0">
                      <img src={method.logo} alt={method.name} className="max-w-full max-h-full object-contain" />
                    </div>
                    <div className="flex-1 text-left">
                      <p className="text-white/90 font-semibold">{method.name}</p>
                      <p className="text-white/35 text-xs mt-0.5">Karta orqali to'lov</p>
                    </div>
                    <div className="w-5 h-5 rounded-full border-2 border-white/20 flex items-center justify-center shrink-0">
                      {selectedPayment?.id === method.id && <div className="w-2.5 h-2.5 rounded-full bg-[#0A84FF]" />}
                    </div>
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-2 text-white/25 text-xs justify-center">
                <Shield size={12} />
                <span>Barcha to'lovlar xavfsiz kanal orqali amalga oshiriladi</span>
              </div>
            </>
          )}

          {/* ══════════════ STEP: CARD INPUT ══════════════ */}
          {step === 'card' && (
            <>
              <div className="flex items-center gap-3 mb-6">
                <button onClick={() => setStep('payment')} className="text-white/40 hover:text-white/70 transition-colors"><ChevronLeft size={22} /></button>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-6 rounded bg-white flex items-center justify-center p-1 shrink-0">
                    <img src={selectedPayment?.logo} alt="" className="max-w-full max-h-full object-contain" />
                  </div>
                  <h2 className="text-xl font-bold text-white/95">{selectedPayment?.name} orqali to'lov</h2>
                </div>
              </div>

              <div className="text-center mb-6">
                <p className="text-2xl font-bold text-[#30D158]">{LISTING_PRICE.toLocaleString()} so'm</p>
              </div>

              <div className="space-y-4 mb-6">
                {/* Karta raqami */}
                <div>
                  <label className="text-white/55 text-sm font-medium mb-1.5 block">Karta raqami</label>
                  <div className="relative">
                    <CreditCard size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/25" />
                    <input type="text" inputMode="numeric" placeholder="0000 0000 0000 0000"
                      value={cardNumber} onChange={(e) => setCardNumber(formatCardInput(e.target.value))}
                      className="w-full pl-10 pr-4 py-3 rounded-xl text-lg font-mono text-white/95 placeholder:text-white/20 outline-none tracking-wider"
                      style={glassInputStyle(false)} onFocus={glassInputFocus} onBlur={(e) => glassInputBlur(e, false)} />
                  </div>
                </div>

                {/* Amal qilish muddati */}
                <div>
                  <label className="text-white/55 text-sm font-medium mb-1.5 block">Amal qilish muddati</label>
                  <input type="text" inputMode="numeric" placeholder="MM/YY"
                    value={cardExpiry} onChange={(e) => setCardExpiry(formatExpiryInput(e.target.value))}
                    className="w-full px-4 py-3 rounded-xl text-lg font-mono text-white/95 placeholder:text-white/20 outline-none"
                    style={glassInputStyle(false)} onFocus={glassInputFocus} onBlur={(e) => glassInputBlur(e, false)} />
                </div>
              </div>

              <button type="button" onClick={handleCardSubmit} disabled={otpSending}
                className="w-full text-white py-3.5 rounded-full font-semibold transition-all disabled:opacity-50"
                style={{ background: '#0A84FF', boxShadow: '0 0 20px rgba(10,132,255,0.25)' }}>
                {otpSending ? 'SMS yuborilmoqda...' : 'Tasdiqlash kodini yuborish'}
              </button>
            </>
          )}

          {/* ══════════════ STEP: OTP ══════════════ */}
          {step === 'otp' && (
            <>
              <div className="flex items-center gap-3 mb-6">
                <button onClick={() => setStep('card')} className="text-white/40 hover:text-white/70 transition-colors"><ChevronLeft size={22} /></button>
                <h2 className="text-xl font-bold text-white/95">SMS tasdiqlash</h2>
              </div>

              <div className="text-center mb-6">
                <div className="w-16 h-16 rounded-2xl mx-auto mb-4 flex items-center justify-center" style={{ background: 'rgba(10,132,255,0.10)', border: '1px solid rgba(10,132,255,0.20)' }}>
                  <Shield size={28} className="text-[#0A84FF]" />
                </div>
                <p className="text-white/60 text-sm mb-1">Karta raqamingizga yuborilgan 4 xonali kodni kiriting</p>
                <p className="text-white/30 text-xs">(Test uchun: <span className="text-white/60 font-mono">1234</span>)</p>
              </div>

              <div className="mb-6">
                <input type="text" inputMode="numeric" placeholder="• • • •" maxLength={4}
                  value={otpCode} onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, '').slice(0, 4))}
                  className="w-full px-4 py-4 rounded-xl text-2xl font-mono text-center text-white/95 placeholder:text-white/15 outline-none tracking-[0.5em]"
                  style={glassInputStyle(false)} onFocus={glassInputFocus} onBlur={(e) => glassInputBlur(e, false)} />
              </div>

              <button type="button" onClick={handleOtpSubmit} disabled={otpCode.length < 4}
                className="w-full text-white py-3.5 rounded-full font-semibold transition-all disabled:opacity-50"
                style={{ background: '#0A84FF', boxShadow: '0 0 20px rgba(10,132,255,0.25)' }}>
                Tasdiqlash va e'lon joylash
              </button>
            </>
          )}

          {/* ══════════════ STEP: SUCCESS ══════════════ */}
          {step === 'success' && (
            <div className="text-center py-8">
              <div className="w-20 h-20 rounded-full mx-auto mb-5 flex items-center justify-center" style={{ background: 'rgba(48,209,88,0.10)', border: '1px solid rgba(48,209,88,0.25)' }}>
                <CheckCircle size={40} className="text-[#30D158]" />
              </div>
              <h2 className="text-2xl font-bold text-white/95 mb-2">To'lov muvaffaqiyatli!</h2>
              <p className="text-white/50 mb-2">E'loningiz muvaffaqiyatli joylashtirildi.</p>
              <p className="text-white/30 text-sm">Sahifa avtomatik yo'naltiriladi...</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
