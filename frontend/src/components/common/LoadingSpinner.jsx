const LoadingSpinner = ({ size = 'md', className = '' }) => {
  const sizeClasses = {
    sm: 'w-5 h-5',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
  };

  return (
    <div className={`flex items-center justify-center py-12 ${className}`}>
      <div
        className={`${sizeClasses[size] || sizeClasses.md} border-2 border-[#0A84FF] border-t-transparent rounded-full animate-spin`}
      />
    </div>
  );
};

export default LoadingSpinner;
