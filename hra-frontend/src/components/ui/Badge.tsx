import React from 'react';
import { clsx } from 'clsx';

type BadgeVariant = 'pending' | 'approved' | 'rejected' | 'cancelled' | 'present' | 'absent' | 'on_leave' | 'half_day' | 'success' | 'warning' | 'error' | 'info' | 'generated' | 'draft' | 'sent';

const variantMap: Record<BadgeVariant, string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  approved: 'bg-green-100 text-green-800',
  present: 'bg-green-100 text-green-800',
  success: 'bg-green-100 text-green-800',
  generated: 'bg-green-100 text-green-800',
  sent: 'bg-blue-100 text-blue-800',
  info: 'bg-blue-100 text-blue-800',
  rejected: 'bg-red-100 text-red-800',
  absent: 'bg-red-100 text-red-800',
  error: 'bg-red-100 text-red-800',
  cancelled: 'bg-gray-100 text-gray-600',
  draft: 'bg-gray-100 text-gray-600',
  on_leave: 'bg-purple-100 text-purple-800',
  half_day: 'bg-orange-100 text-orange-800',
  warning: 'bg-orange-100 text-orange-800',
};

interface BadgeProps {
  variant: BadgeVariant | string;
  children: React.ReactNode;
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({ variant, children, className }) => {
  const style = variantMap[variant as BadgeVariant] || 'bg-gray-100 text-gray-600';
  return (
    <span className={clsx('inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize', style, className)}>
      {children}
    </span>
  );
};
