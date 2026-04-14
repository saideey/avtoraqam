const Footer = () => {
  return (
    <footer className="mt-auto border-t border-white/[0.06]"
            style={{
              background: 'rgba(255,255,255,0.04)',
              backdropFilter: 'blur(16px)',
              WebkitBackdropFilter: 'blur(16px)',
            }}>
      <div className="max-w-7xl mx-auto px-4 py-8 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div>
          <span className="text-white/60 font-bold text-lg">AvtoRaqam.uz</span>
          <p className="text-white/30 text-sm mt-1">
            O'zbekiston avtomobil raqamlari savdo platformasi
          </p>
        </div>
        <span className="text-white/25 text-xs">
          &copy; {new Date().getFullYear()} AvtoRaqam.uz. Barcha huquqlar himoyalangan.
        </span>
      </div>
    </footer>
  );
};

export default Footer;
