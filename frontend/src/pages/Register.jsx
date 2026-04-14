import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { Eye, EyeOff, ArrowLeft } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { authAPI } from '../services/api';

/* Reusable glass input focus handler */
const glassInputFocus = (e, hasError) => {
  if (!hasError) {
    e.target.style.boxShadow = '0 0 0 3px rgba(10,132,255,0.35)';
    e.target.style.borderColor = 'rgba(10,132,255,0.5)';
  }
};
const glassInputBlur = (e, hasError) => {
  e.target.style.boxShadow = 'none';
  e.target.style.borderColor = hasError
    ? 'rgba(255,69,58,0.6)'
    : 'rgba(255,255,255,0.10)';
};
const glassInputStyle = (hasError) => ({
  background: 'rgba(255,255,255,0.04)',
  border: hasError
    ? '1px solid rgba(255,69,58,0.6)'
    : '1px solid rgba(255,255,255,0.10)',
  boxShadow: 'none',
});

const SubmitButton = ({ children, disabled }) => (
  <button
    type="submit"
    disabled={disabled}
    className="w-full text-white font-semibold py-3.5 rounded-full transition-all disabled:opacity-50 disabled:cursor-not-allowed"
    style={{
      background: '#0A84FF',
      boxShadow: '0 0 20px rgba(10,132,255,0.25)',
    }}
    onMouseEnter={(e) => {
      if (!disabled) {
        e.currentTarget.style.filter = 'brightness(1.1)';
        e.currentTarget.style.boxShadow = '0 0 30px rgba(10,132,255,0.4)';
      }
    }}
    onMouseLeave={(e) => {
      e.currentTarget.style.filter = 'brightness(1)';
      e.currentTarget.style.boxShadow = '0 0 20px rgba(10,132,255,0.25)';
    }}
  >
    {children}
  </button>
);

const extractError = (err, fallback) =>
  err?.response?.data?.error ||
  err?.response?.data?.detail ||
  err?.response?.data?.message ||
  fallback;

/* ---------------- Step 1: Phone ---------------- */
function PhoneStep({ phone, onNext }) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({ defaultValues: { phone_number: phone || '' } });

  const onSubmit = async (data) => {
    try {
      await authAPI.sendRegisterOtp(data.phone_number);
      toast.success('Kod yuborildi');
      onNext(data.phone_number);
    } catch (err) {
      toast.error(extractError(err, 'Kod yuborishda xatolik'));
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      <div>
        <label className="text-white/60 text-sm font-medium mb-1.5 block">
          Telefon raqam
        </label>
        <div className="relative">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40 text-sm font-medium select-none">
            +998
          </span>
          <input
            type="tel"
            placeholder="901234567"
            {...register('phone_number', {
              required: 'Telefon raqam kiritilishi shart',
              pattern: {
                value: /^\+998\d{9}$/,
                message: 'Format: +998XXXXXXXXX',
              },
              setValueAs: (v) => {
                if (!v) return v;
                if (!v.startsWith('+998')) return '+998' + v.replace(/\D/g, '');
                return v;
              },
            })}
            className="w-full pl-16 pr-4 py-3 rounded-xl text-white placeholder:text-white/30 outline-none transition-all"
            style={glassInputStyle(errors.phone_number)}
            onFocus={(e) => glassInputFocus(e, errors.phone_number)}
            onBlur={(e) => glassInputBlur(e, errors.phone_number)}
          />
        </div>
        {errors.phone_number && (
          <p className="text-[#FF453A] text-sm mt-1">{errors.phone_number.message}</p>
        )}
      </div>

      <SubmitButton disabled={isSubmitting}>
        {isSubmitting ? 'Yuborilmoqda...' : 'Kodni yuborish'}
      </SubmitButton>
    </form>
  );
}

/* ---------------- Step 2: OTP ---------------- */
function OtpStep({ phone, onBack, onNext }) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm();

  const onSubmit = async (data) => {
    try {
      await authAPI.verifyRegisterOtp(phone, data.otp);
      toast.success('Tasdiqlandi');
      onNext();
    } catch (err) {
      toast.error(extractError(err, "Noto'g'ri kod"));
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      <div>
        <label className="text-white/60 text-sm font-medium mb-1.5 block text-center">
          Tasdiqlash kodi
        </label>
        <p className="text-white/40 text-xs text-center mb-3">
          {phone} raqamiga yuborildi
        </p>
        <input
          type="text"
          inputMode="numeric"
          maxLength={4}
          placeholder="0000"
          autoFocus
          {...register('otp', {
            required: 'Kod kiritilishi shart',
            pattern: { value: /^\d{4}$/, message: '4 xonali raqam' },
          })}
          className="w-full px-4 py-4 rounded-xl text-white placeholder:text-white/20 outline-none transition-all text-center text-3xl font-mono tracking-[0.5em]"
          style={glassInputStyle(errors.otp)}
          onFocus={(e) => glassInputFocus(e, errors.otp)}
          onBlur={(e) => glassInputBlur(e, errors.otp)}
        />
        {errors.otp && (
          <p className="text-[#FF453A] text-sm mt-1 text-center">{errors.otp.message}</p>
        )}
        <p className="text-white/40 text-xs text-center mt-3">
          Test uchun: <span className="text-white/60 font-mono">1234</span>
        </p>
      </div>

      <SubmitButton disabled={isSubmitting}>
        {isSubmitting ? 'Tekshirilmoqda...' : 'Tasdiqlash'}
      </SubmitButton>

      <button
        type="button"
        onClick={onBack}
        className="w-full flex items-center justify-center gap-2 text-white/40 hover:text-[#0A84FF] text-sm transition-colors"
      >
        <ArrowLeft size={16} />
        Telefon raqamni o&apos;zgartirish
      </button>
    </form>
  );
}

/* ---------------- Step 3: Profile ---------------- */
function ProfileStep({ phone, onBack }) {
  const { register: registerUser } = useAuth();
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm();

  const password = watch('password');

  const onSubmit = async (data) => {
    try {
      await registerUser({
        full_name: data.full_name,
        phone_number: phone,
        password: data.password,
      });
      toast.success("Muvaffaqiyatli ro'yxatdan o'tdingiz!");
      navigate('/');
    } catch (err) {
      toast.error(extractError(err, "Ro'yxatdan o'tishda xatolik"));
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      <div>
        <label className="text-white/60 text-sm font-medium mb-1.5 block">
          To&apos;liq ism
        </label>
        <input
          type="text"
          placeholder="Ismingiz va familiyangiz"
          {...register('full_name', {
            required: 'Ism kiritilishi shart',
            minLength: { value: 2, message: 'Kamida 2 ta belgi' },
            maxLength: { value: 100, message: "100 ta belgidan oshmasin" },
          })}
          className="w-full px-4 py-3 rounded-xl text-white placeholder:text-white/30 outline-none transition-all"
          style={glassInputStyle(errors.full_name)}
          onFocus={(e) => glassInputFocus(e, errors.full_name)}
          onBlur={(e) => glassInputBlur(e, errors.full_name)}
        />
        {errors.full_name && (
          <p className="text-[#FF453A] text-sm mt-1">{errors.full_name.message}</p>
        )}
      </div>

      <div>
        <label className="text-white/60 text-sm font-medium mb-1.5 block">
          Parol
        </label>
        <div className="relative">
          <input
            type={showPassword ? 'text' : 'password'}
            placeholder="Kamida 6 ta belgi"
            {...register('password', {
              required: 'Parol kiritilishi shart',
              minLength: { value: 6, message: 'Kamida 6 ta belgi' },
            })}
            className="w-full pr-11 pl-4 py-3 rounded-xl text-white placeholder:text-white/30 outline-none transition-all"
            style={glassInputStyle(errors.password)}
            onFocus={(e) => glassInputFocus(e, errors.password)}
            onBlur={(e) => glassInputBlur(e, errors.password)}
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/70 transition-colors"
          >
            {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
          </button>
        </div>
        {errors.password && (
          <p className="text-[#FF453A] text-sm mt-1">{errors.password.message}</p>
        )}
      </div>

      <div>
        <label className="text-white/60 text-sm font-medium mb-1.5 block">
          Parolni tasdiqlash
        </label>
        <input
          type={showPassword ? 'text' : 'password'}
          placeholder="Parolni qayta kiriting"
          {...register('confirm_password', {
            required: 'Parolni tasdiqlang',
            validate: (value) => value === password || 'Parollar mos kelmaydi',
          })}
          className="w-full px-4 py-3 rounded-xl text-white placeholder:text-white/30 outline-none transition-all"
          style={glassInputStyle(errors.confirm_password)}
          onFocus={(e) => glassInputFocus(e, errors.confirm_password)}
          onBlur={(e) => glassInputBlur(e, errors.confirm_password)}
        />
        {errors.confirm_password && (
          <p className="text-[#FF453A] text-sm mt-1">{errors.confirm_password.message}</p>
        )}
      </div>

      <SubmitButton disabled={isSubmitting}>
        {isSubmitting ? "Ro'yxatdan o'tilmoqda..." : "Ro'yxatdan o'tish"}
      </SubmitButton>

      <button
        type="button"
        onClick={onBack}
        className="w-full flex items-center justify-center gap-2 text-white/40 hover:text-[#0A84FF] text-sm transition-colors"
      >
        <ArrowLeft size={16} />
        Orqaga
      </button>
    </form>
  );
}

/* ---------------- Main ---------------- */
export default function Register() {
  const [step, setStep] = useState(1);
  const [phone, setPhone] = useState('');

  const stepTitles = {
    1: "Ro'yxatdan o'tish",
    2: 'Kodni tasdiqlash',
    3: "Ma'lumotlaringiz",
  };

  const stepSubtitles = {
    1: 'Telefon raqamingizni kiriting',
    2: '4 xonali kodni kiriting',
    3: 'Profilni yakunlang',
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4 py-12 relative overflow-hidden"
      style={{
        background:
          'radial-gradient(ellipse at top left, #0a0a1a 0%, #050510 60%, #0d0d20 100%)',
      }}
    >
      {/* Subtle iOS-blue orb */}
      <div
        className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] rounded-full pointer-events-none"
        style={{
          background:
            'radial-gradient(circle, rgba(10,132,255,0.10) 0%, transparent 70%)',
          filter: 'blur(120px)',
        }}
      />

      <div className="w-full max-w-md relative z-10">
        {/* Glass card */}
        <div
          className="rounded-[20px] p-8 relative overflow-hidden"
          style={{
            background: 'rgba(255,255,255,0.06)',
            backdropFilter: 'blur(24px) saturate(180%)',
            WebkitBackdropFilter: 'blur(24px) saturate(180%)',
            border: '1px solid rgba(255,255,255,0.12)',
            boxShadow:
              '0 4px 6px rgba(0,0,0,0.07), 0 10px 15px rgba(0,0,0,0.1), 0 20px 25px rgba(0,0,0,0.15)',
          }}
        >
          {/* Top highlight line */}
          <div
            className="absolute top-0 left-[10%] right-[10%] h-px"
            style={{
              background:
                'linear-gradient(90deg, transparent, rgba(255,255,255,0.20), transparent)',
            }}
          />

          {/* Logo */}
          <div className="text-center mb-6">
            <h2 className="text-3xl font-bold">
              <span className="text-white">AvtoRaqam</span>
              <span className="text-[#0A84FF]">.uz</span>
            </h2>
            <h1 className="text-xl font-semibold text-white/95 mt-5">
              {stepTitles[step]}
            </h1>
            <p className="text-white/40 text-sm mt-1">{stepSubtitles[step]}</p>
          </div>

          {/* Step indicator */}
          <div className="flex items-center justify-center gap-2 mb-6">
            {[1, 2, 3].map((s) => (
              <div
                key={s}
                className="h-1 rounded-full transition-all"
                style={{
                  width: s === step ? 28 : 16,
                  background:
                    s <= step ? '#0A84FF' : 'rgba(255,255,255,0.12)',
                }}
              />
            ))}
          </div>

          {step === 1 && (
            <PhoneStep
              phone={phone}
              onNext={(p) => {
                setPhone(p);
                setStep(2);
              }}
            />
          )}
          {step === 2 && (
            <OtpStep
              phone={phone}
              onBack={() => setStep(1)}
              onNext={() => setStep(3)}
            />
          )}
          {step === 3 && (
            <ProfileStep phone={phone} onBack={() => setStep(2)} />
          )}

          <p className="text-center text-white/40 mt-6 text-sm">
            Hisobingiz bormi?{' '}
            <Link
              to="/login"
              className="text-white/40 hover:text-[#0A84FF] font-medium transition-colors"
            >
              Kirish
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
