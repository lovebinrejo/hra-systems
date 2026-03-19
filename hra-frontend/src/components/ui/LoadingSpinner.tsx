import React from 'react';

interface LoadingSpinnerProps {
  fullPage?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

const sizeMap = { sm: 'w-4 h-4', md: 'w-8 h-8', lg: 'w-12 h-12' };

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ fullPage = false, size = 'md' }) => {
  const spinner = (
    <div className={`${sizeMap[size]} border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin`} />
  );

  if (fullPage) {
    return (
      <div className="fixed inset-0 bg-white/80 flex items-center justify-center z-50">
        {spinner}
      </div>
    );
  }
  return (
    <div className="flex items-center justify-center py-8">
      {spinner}
    </div>
  );
};
