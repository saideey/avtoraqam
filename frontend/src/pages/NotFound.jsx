import { Link } from 'react-router-dom';
import { Home } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center px-4 relative">
      {/* Subtle ios-blue orb */}
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full pointer-events-none"
        style={{
          background: 'radial-gradient(circle, rgba(10,132,255,0.08) 0%, transparent 70%)',
          filter: 'blur(140px)',
        }}
      />

      <div className="text-center relative z-10">
        {/* Huge decorative 404 */}
        <h1
          className="text-[120px] leading-none font-bold select-none mb-2"
          style={{ color: 'rgba(255,255,255,0.06)' }}
        >
          404
        </h1>

        <p className="text-xl text-white/55 mb-10">Sahifa topilmadi</p>

        <Link
          to="/"
          className="inline-flex items-center gap-2.5 bg-[#0A84FF] hover:bg-[#0A84FF]/90 text-white font-semibold px-7 py-3.5 rounded-full shadow-[0_0_20px_rgba(10,132,255,0.3)] hover:shadow-[0_0_30px_rgba(10,132,255,0.45)] transition-all duration-280"
          style={{ transitionTimingFunction: 'cubic-bezier(0.34,1.56,0.64,1)' }}
        >
          <Home size={20} />
          Bosh sahifaga qaytish
        </Link>
      </div>
    </div>
  );
}
