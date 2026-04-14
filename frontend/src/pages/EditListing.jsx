import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { ArrowLeft, Edit3, Banknote } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { listingsAPI } from '../services/api';
import { validatePlateNumber } from '../utils/plateUtils';
import PlateInput from '../components/listing/PlateInput';
import LoadingSpinner from '../components/common/LoadingSpinner';

const formatPriceDisplay = (value) => {
  const digits = value.replace(/\D/g, '');
  if (!digits) return '';
  return Number(digits).toLocaleString('en-US');
};

const parsePriceValue = (formatted) => {
  return formatted.replace(/\D/g, '');
};

export default function EditListing() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [plateValue, setPlateValue] = useState('');
  const [priceDisplay, setPriceDisplay] = useState('');

  const {
    register,
    handleSubmit,
    setError,
    clearErrors,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm();

  const description = watch('description', '');

  useEffect(() => {
    listingsAPI
      .getOne(id)
      .then(({ data }) => {
        const listing = data.listing || data;
        const sellerId = listing.seller_id || listing.seller?._id || listing.seller?.id;
        const userId = user?._id || user?.id;
        if (sellerId && userId && sellerId !== userId) {
          toast.error("Siz bu e'lonni tahrirlash huquqiga ega emassiz");
          navigate('/my-listings');
          return;
        }
        reset({
          description: listing.description || '',
        });
        if (listing.plate_number) {
          setPlateValue(listing.plate_number);
        }
        if (listing.price) {
          setPriceDisplay(formatPriceDisplay(String(listing.price)));
        }
      })
      .catch(() => {
        toast.error("E'lonni yuklashda xatolik");
        navigate('/my-listings');
      })
      .finally(() => setLoading(false));
  }, [id, user, navigate, reset]);

  const handlePlateChange = (formatted) => {
    setPlateValue(formatted);
    if (formatted.length >= 10) {
      const result = validatePlateNumber(formatted);
      if (result.valid) {
        clearErrors('plate_number');
      }
    }
  };

  const handlePriceChange = (e) => {
    const raw = parsePriceValue(e.target.value);
    if (raw.length > 13) return;
    setPriceDisplay(raw ? formatPriceDisplay(raw) : '');
    clearErrors('price');
  };

  const onSubmit = async (data) => {
    const result = validatePlateNumber(plateValue);
    if (!result.valid) {
      setError('plate_number', { message: result.error });
      return;
    }

    const priceNum = Number(parsePriceValue(priceDisplay));
    if (!priceNum || priceNum < 1000) {
      setError('price', { message: "Kamida 1,000 so'm" });
      return;
    }
    if (priceNum > 10000000000) {
      setError('price', { message: 'Juda katta narx' });
      return;
    }

    try {
      await listingsAPI.update(id, {
        plate_number: result.formatted,
        price: priceNum,
        description: data.description || '',
      });
      toast.success("E'lon muvaffaqiyatli yangilandi!");
      navigate('/my-listings');
    } catch (err) {
      toast.error(
        err.response?.data?.error || "E'lonni yangilashda xatolik yuz berdi"
      );
    }
  };

  if (loading) return <LoadingSpinner size="lg" />;

  const inputClass = (hasError) =>
    `w-full border text-white placeholder:text-white/25 rounded-2xl px-4 py-3 outline-none text-lg font-medium transition-all duration-200 ${
      hasError
        ? 'border-[#FF453A]/50 focus:border-[#FF453A] focus:shadow-[0_0_0_3px_rgba(255,69,58,0.35)]'
        : 'border-white/10 focus:border-[#0A84FF] focus:shadow-[0_0_0_3px_rgba(10,132,255,0.35)]'
    }`;

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <Link
        to="/my-listings"
        className="inline-flex items-center gap-1 text-white/30 hover:text-white/55 transition-all duration-200 mb-6"
      >
        <ArrowLeft size={18} />
        <span>Orqaga</span>
      </Link>

      <div
        className="relative rounded-[20px] p-6 sm:p-8 border border-white/12"
        style={{
          background: 'rgba(255,255,255,0.06)',
          backdropFilter: 'blur(24px) saturate(180%)',
          boxShadow: '0 4px 6px rgba(0,0,0,0.07), 0 10px 15px rgba(0,0,0,0.1), 0 20px 25px rgba(0,0,0,0.15), inset 0 0 0 1px rgba(255,255,255,0.05)',
        }}
      >
        {/* Top highlight */}
        <div className="absolute top-0 left-[10%] w-[80%] h-px bg-gradient-to-r from-transparent via-white/40 to-transparent" />

        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 rounded-xl bg-[#0A84FF] flex items-center justify-center shadow-[0_0_15px_rgba(10,132,255,0.3)]">
            <Edit3 className="text-white" size={20} />
          </div>
          <h1 className="text-2xl font-bold text-white/95">E'lonni tahrirlash</h1>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Plate Number */}
          <div>
            <label className="block text-sm font-medium text-white/55 mb-3">
              Avtomobil raqami
            </label>
            <PlateInput
              value={plateValue}
              onChange={handlePlateChange}
              error={errors.plate_number?.message}
            />
          </div>

          {/* Price */}
          <div>
            <label className="block text-sm font-medium text-white/55 mb-2">
              Narxi (so'm)
            </label>
            <div className="relative">
              <Banknote
                size={20}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30"
              />
              <input
                type="text"
                inputMode="numeric"
                placeholder="5,000,000"
                value={priceDisplay}
                onChange={handlePriceChange}
                className={`${inputClass(errors.price)} pl-11 pr-16`}
                style={{ background: 'rgba(255,255,255,0.06)' }}
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-white/30 text-sm font-medium">
                so'm
              </span>
            </div>
            {priceDisplay && (
              <p className="text-xs text-white/30 mt-1.5">
                {Number(parsePriceValue(priceDisplay)).toLocaleString('en-US')} so'm
              </p>
            )}
            {errors.price && (
              <p className="text-[#FF453A] text-sm mt-1.5">{errors.price.message}</p>
            )}
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-white/55 mb-2">
              Tavsif (ixtiyoriy)
            </label>
            <textarea
              rows={4}
              placeholder="Raqam haqida qo'shimcha ma'lumot..."
              maxLength={500}
              {...register('description', {
                maxLength: { value: 500, message: "500 ta belgidan oshmasin" },
              })}
              className={`w-full border text-white placeholder:text-white/25 rounded-2xl px-4 py-3 outline-none resize-none transition-all duration-200 ${
                errors.description
                  ? 'border-[#FF453A]/50 focus:border-[#FF453A] focus:shadow-[0_0_0_3px_rgba(255,69,58,0.35)]'
                  : 'border-white/10 focus:border-[#0A84FF] focus:shadow-[0_0_0_3px_rgba(10,132,255,0.35)]'
              }`}
              style={{ background: 'rgba(255,255,255,0.06)' }}
            />
            <div className="flex justify-between mt-1.5">
              {errors.description ? (
                <p className="text-[#FF453A] text-sm">{errors.description.message}</p>
              ) : (
                <span />
              )}
              <span className="text-xs text-white/30">
                {(description || '').length}/500
              </span>
            </div>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-[#0A84FF] hover:bg-[#0A84FF]/90 text-white py-3.5 rounded-full font-semibold shadow-[0_0_20px_rgba(10,132,255,0.3)] hover:shadow-[0_0_30px_rgba(10,132,255,0.45)] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? 'Saqlanmoqda...' : "O'zgarishlarni saqlash"}
          </button>
        </form>
      </div>
    </div>
  );
}
