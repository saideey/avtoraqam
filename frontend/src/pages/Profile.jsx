import { useState } from 'react';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { User, Phone, Shield, Calendar, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { profileAPI, authAPI } from '../services/api';
import { formatPhone, formatDate } from '../utils/formatters';

function EditNameForm({ user, onUpdate }) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    defaultValues: { full_name: user.full_name || user.name || '' },
  });

  const onSubmit = async (data) => {
    try {
      const { data: res } = await profileAPI.update({ full_name: data.full_name });
      onUpdate(res.user || res);
      toast.success("Ism muvaffaqiyatli yangilandi");
    } catch (err) {
      toast.error(err.response?.data?.detail || "Yangilashda xatolik");
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <label className="block text-white/55 text-sm font-medium mb-1.5">
          To'liq ism
        </label>
        <input
          type="text"
          {...register('full_name', {
            required: 'Ism kiritilishi shart',
            minLength: { value: 2, message: 'Kamida 2 ta belgi' },
          })}
          className={`w-full border text-white placeholder:text-white/25 rounded-2xl px-4 py-3 outline-none transition-all duration-200 ${
            errors.full_name
              ? 'border-[#FF453A]/50 focus:border-[#FF453A] focus:shadow-[0_0_0_3px_rgba(255,69,58,0.35)]'
              : 'border-white/10 focus:border-[#0A84FF] focus:shadow-[0_0_0_3px_rgba(10,132,255,0.35)]'
          }`}
          style={{ background: 'rgba(255,255,255,0.06)' }}
        />
        {errors.full_name && (
          <p className="text-[#FF453A] text-sm mt-1">{errors.full_name.message}</p>
        )}
      </div>
      <button
        type="submit"
        disabled={isSubmitting}
        className="bg-[#0A84FF] hover:bg-[#0A84FF]/90 text-white font-semibold px-6 py-3 rounded-full shadow-[0_0_20px_rgba(10,132,255,0.3)] hover:shadow-[0_0_30px_rgba(10,132,255,0.45)] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isSubmitting ? 'Saqlanmoqda...' : 'Saqlash'}
      </button>
    </form>
  );
}

function ChangePasswordForm() {
  const [showPasswords, setShowPasswords] = useState(false);
  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm();

  const newPassword = watch('new_password');

  const onSubmit = async (data) => {
    try {
      await authAPI.changePassword({
        current_password: data.current_password,
        new_password: data.new_password,
      });
      toast.success("Parol muvaffaqiyatli o'zgartirildi");
      reset();
    } catch (err) {
      toast.error(
        err.response?.data?.detail || "Parolni o'zgartirishda xatolik"
      );
    }
  };

  const inputClass = (hasError) =>
    `w-full border text-white placeholder:text-white/25 rounded-2xl px-4 py-3 outline-none transition-all duration-200 ${
      hasError
        ? 'border-[#FF453A]/50 focus:border-[#FF453A] focus:shadow-[0_0_0_3px_rgba(255,69,58,0.35)]'
        : 'border-white/10 focus:border-[#0A84FF] focus:shadow-[0_0_0_3px_rgba(10,132,255,0.35)]'
    }`;

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <label className="block text-white/55 text-sm font-medium mb-1.5">
          Joriy parol
        </label>
        <div className="relative">
          <input
            type={showPasswords ? 'text' : 'password'}
            placeholder="Joriy parolingiz"
            {...register('current_password', {
              required: 'Joriy parolni kiriting',
            })}
            className={`${inputClass(errors.current_password)} pr-11`}
            style={{ background: 'rgba(255,255,255,0.06)' }}
          />
          <button
            type="button"
            onClick={() => setShowPasswords(!showPasswords)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/55 transition-all duration-200"
          >
            {showPasswords ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        </div>
        {errors.current_password && (
          <p className="text-[#FF453A] text-sm mt-1">{errors.current_password.message}</p>
        )}
      </div>

      <div>
        <label className="block text-white/55 text-sm font-medium mb-1.5">
          Yangi parol
        </label>
        <input
          type={showPasswords ? 'text' : 'password'}
          placeholder="Kamida 6 ta belgi"
          {...register('new_password', {
            required: 'Yangi parolni kiriting',
            minLength: { value: 6, message: 'Kamida 6 ta belgi' },
          })}
          className={inputClass(errors.new_password)}
          style={{ background: 'rgba(255,255,255,0.06)' }}
        />
        {errors.new_password && (
          <p className="text-[#FF453A] text-sm mt-1">{errors.new_password.message}</p>
        )}
      </div>

      <div>
        <label className="block text-white/55 text-sm font-medium mb-1.5">
          Yangi parolni tasdiqlash
        </label>
        <input
          type={showPasswords ? 'text' : 'password'}
          placeholder="Parolni qayta kiriting"
          {...register('confirm_new_password', {
            required: 'Parolni tasdiqlang',
            validate: (value) =>
              value === newPassword || 'Parollar mos kelmaydi',
          })}
          className={inputClass(errors.confirm_new_password)}
          style={{ background: 'rgba(255,255,255,0.06)' }}
        />
        {errors.confirm_new_password && (
          <p className="text-[#FF453A] text-sm mt-1">{errors.confirm_new_password.message}</p>
        )}
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        className="bg-[#0A84FF] hover:bg-[#0A84FF]/90 text-white font-semibold px-6 py-3 rounded-full shadow-[0_0_20px_rgba(10,132,255,0.3)] hover:shadow-[0_0_30px_rgba(10,132,255,0.45)] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isSubmitting ? "O'zgartirilmoqda..." : "Parolni o'zgartirish"}
      </button>
    </form>
  );
}

export default function Profile() {
  const { user, updateUser } = useAuth();

  if (!user) return null;

  const roleLabels = {
    user: 'Foydalanuvchi',
    admin: 'Administrator',
    superadmin: 'Super administrator',
  };

  const initials = (user.full_name || user.name || '')
    .split(' ')
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  const glassCard = {
    background: 'rgba(255,255,255,0.06)',
    backdropFilter: 'blur(24px) saturate(180%)',
    boxShadow: '0 4px 6px rgba(0,0,0,0.07), 0 10px 15px rgba(0,0,0,0.1), 0 20px 25px rgba(0,0,0,0.15), inset 0 0 0 1px rgba(255,255,255,0.05)',
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">
      <h1 className="text-2xl sm:text-3xl font-bold text-white/95">Profil</h1>

      {/* User Info Card */}
      <div
        className="relative rounded-[20px] p-8 border border-white/12"
        style={glassCard}
      >
        {/* Top highlight */}
        <div className="absolute top-0 left-[10%] w-[80%] h-px bg-gradient-to-r from-transparent via-white/40 to-transparent" />

        <div className="flex flex-col sm:flex-row items-center gap-6">
          {/* Avatar */}
          <div className="w-20 h-20 rounded-full bg-[#0A84FF] flex items-center justify-center shrink-0 shadow-[0_0_25px_rgba(10,132,255,0.3)]">
            {initials ? (
              <span className="text-2xl font-bold text-white">{initials}</span>
            ) : (
              <User size={36} className="text-white/80" />
            )}
          </div>

          {/* Details */}
          <div className="flex-1 text-center sm:text-left space-y-2.5">
            <h2 className="text-xl font-bold text-white/95">
              {user.full_name || user.name}
            </h2>
            <div className="flex items-center justify-center sm:justify-start gap-2 text-white/55">
              <Phone size={16} />
              <span>{formatPhone(user.phone_number)}</span>
            </div>
            <div className="flex items-center justify-center sm:justify-start gap-2">
              <Shield size={16} className="text-white/30" />
              <span className="bg-[#BF5AF2]/15 text-[#BF5AF2] border border-[#BF5AF2]/25 rounded-full px-2.5 py-0.5 text-xs font-medium">
                {roleLabels[user.role] || user.role}
              </span>
            </div>
            {user.created_at && (
              <div className="flex items-center justify-center sm:justify-start gap-2 text-white/30">
                <Calendar size={16} />
                <span className="text-sm">A'zo: {formatDate(user.created_at)}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Edit Name */}
      <div
        className="relative rounded-[20px] p-8 border border-white/12"
        style={glassCard}
      >
        <div className="absolute top-0 left-[10%] w-[80%] h-px bg-gradient-to-r from-transparent via-white/40 to-transparent" />
        <h3 className="text-lg font-semibold text-white/95 mb-4">Ismni tahrirlash</h3>
        <EditNameForm user={user} onUpdate={updateUser} />
      </div>

      {/* Change Password */}
      <div
        className="relative rounded-[20px] p-8 border border-white/12"
        style={glassCard}
      >
        <div className="absolute top-0 left-[10%] w-[80%] h-px bg-gradient-to-r from-transparent via-white/40 to-transparent" />
        <h3 className="text-lg font-semibold text-white/95 mb-4">Parolni o'zgartirish</h3>
        <ChangePasswordForm />
      </div>
    </div>
  );
}
