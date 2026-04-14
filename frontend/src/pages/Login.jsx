import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { useAuth } from '../hooks/useAuth';
import { Eye, EyeOff } from 'lucide-react';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm();

  const onSubmit = async (data) => {
    try {
      await login({
        phone_number: data.phone_number,
        password: data.password,
      });
      toast.success("Muvaffaqiyatli kirdingiz!");
      navigate('/');
    } catch (err) {
      const message =
        err.response?.data?.detail ||
        err.response?.data?.message ||
        "Kirish xatoligi. Qayta urinib ko'ring.";
      toast.error(message);
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4 py-12 relative overflow-hidden"
      style={{
        background: 'radial-gradient(ellipse at top left, #0a0a1a 0%, #050510 60%, #0d0d20 100%)',
      }}
    >
      {/* Subtle iOS-blue orb */}
      <div
        className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] rounded-full pointer-events-none"
        style={{
          background: 'radial-gradient(circle, rgba(10,132,255,0.10) 0%, transparent 70%)',
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
              background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.20), transparent)',
            }}
          />

          {/* Logo */}
          <div className="text-center mb-8">
            <h2
              className="text-3xl font-bold"
              style={{
                background: 'linear-gradient(135deg, #0A84FF, #BF5AF2)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}
            >
              AvtoRaqam.uz
            </h2>
            <h1 className="text-2xl font-bold text-white/95 mt-4 mb-2">
              Tizimga kirish
            </h1>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            {/* Phone number */}
            <div>
              <label className="text-white/55 text-sm font-medium mb-1.5 block">
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
                      message: "Format: +998XXXXXXXXX",
                    },
                    setValueAs: (v) => {
                      if (v && !v.startsWith('+998')) return '+998' + v.replace(/\D/g, '');
                      return v;
                    },
                  })}
                  className="w-full pl-16 pr-4 py-3 rounded-xl text-white/95 placeholder:text-white/30 outline-none transition-all"
                  style={{
                    background: 'rgba(255,255,255,0.06)',
                    border: errors.phone_number
                      ? '1px solid rgba(255,69,58,0.6)'
                      : '1px solid rgba(255,255,255,0.10)',
                    boxShadow: 'none',
                  }}
                  onFocus={(e) => {
                    if (!errors.phone_number) {
                      e.target.style.boxShadow = '0 0 0 3px rgba(10,132,255,0.35)';
                      e.target.style.borderColor = 'rgba(10,132,255,0.5)';
                    }
                  }}
                  onBlur={(e) => {
                    e.target.style.boxShadow = 'none';
                    e.target.style.borderColor = errors.phone_number
                      ? 'rgba(255,69,58,0.6)'
                      : 'rgba(255,255,255,0.10)';
                  }}
                />
              </div>
              {errors.phone_number && (
                <p className="text-[#FF453A] text-sm mt-1">{errors.phone_number.message}</p>
              )}
            </div>

            {/* Password */}
            <div>
              <label className="text-white/55 text-sm font-medium mb-1.5 block">
                Parol
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Parolingizni kiriting"
                  {...register('password', {
                    required: 'Parol kiritilishi shart',
                  })}
                  className="w-full pr-11 pl-4 py-3 rounded-xl text-white/95 placeholder:text-white/30 outline-none transition-all"
                  style={{
                    background: 'rgba(255,255,255,0.06)',
                    border: errors.password
                      ? '1px solid rgba(255,69,58,0.6)'
                      : '1px solid rgba(255,255,255,0.10)',
                    boxShadow: 'none',
                  }}
                  onFocus={(e) => {
                    if (!errors.password) {
                      e.target.style.boxShadow = '0 0 0 3px rgba(10,132,255,0.35)';
                      e.target.style.borderColor = 'rgba(10,132,255,0.5)';
                    }
                  }}
                  onBlur={(e) => {
                    e.target.style.boxShadow = 'none';
                    e.target.style.borderColor = errors.password
                      ? 'rgba(255,69,58,0.6)'
                      : 'rgba(255,255,255,0.10)';
                  }}
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

            {/* Forgot password link */}
            <div className="text-right">
              <Link
                to="/forgot-password"
                className="text-sm text-white/40 hover:text-[#0A84FF] transition-colors"
              >
                Parolni unutdingizmi?
              </Link>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full text-white font-semibold py-3.5 rounded-full transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              style={{
                background: '#0A84FF',
                boxShadow: '0 0 20px rgba(10,132,255,0.25)',
              }}
              onMouseEnter={(e) => {
                if (!isSubmitting) {
                  e.currentTarget.style.filter = 'brightness(1.1)';
                  e.currentTarget.style.boxShadow = '0 0 30px rgba(10,132,255,0.4)';
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.filter = 'brightness(1)';
                e.currentTarget.style.boxShadow = '0 0 20px rgba(10,132,255,0.25)';
              }}
            >
              {isSubmitting ? 'Kirilyapti...' : 'Kirish'}
            </button>
          </form>

          <p className="text-center text-white/40 mt-6 text-sm">
            Hisobingiz yo&apos;qmi?{' '}
            <Link to="/register" className="text-white/40 hover:text-[#0A84FF] font-medium transition-colors">
              Ro&apos;yxatdan o&apos;tish
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
