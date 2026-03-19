import React from 'react';
import { clsx } from 'clsx';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  color?: 'blue' | 'green' | 'yellow' | 'red' | 'purple' | 'orange';
  subtitle?: string;
}

const colorMap = {
  blue:   { bg: 'bg-blue-50',   icon: 'bg-blue-100 text-blue-600',    border: 'border-blue-100',   value: 'text-blue-700' },
  green:  { bg: 'bg-green-50',  icon: 'bg-green-100 text-green-600',  border: 'border-green-100',  value: 'text-green-700' },
  yellow: { bg: 'bg-yellow-50', icon: 'bg-yellow-100 text-yellow-600',border: 'border-yellow-100', value: 'text-yellow-700' },
  red:    { bg: 'bg-red-50',    icon: 'bg-red-100 text-red-600',      border: 'border-red-100',    value: 'text-red-700' },
  purple: { bg: 'bg-purple-50', icon: 'bg-purple-100 text-purple-600',border: 'border-purple-100', value: 'text-purple-700' },
  orange: { bg: 'bg-orange-50', icon: 'bg-orange-100 text-orange-600',border: 'border-orange-100', value: 'text-orange-700' },
};

export const StatCard: React.FC<StatCardProps> = ({ title, value, icon, color = 'blue', subtitle }) => {
  const c = colorMap[color];
  return (
    <div className={clsx('bg-white rounded-xl border p-4 flex items-center gap-4 hover:shadow-md transition-shadow', c.border)}>
      <div className={clsx('p-3 rounded-xl flex-shrink-0', c.icon)}>
        {icon}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-xs font-medium text-gray-500 uppercase tracking-wide truncate">{title}</p>
        <p className={clsx('text-2xl font-bold mt-0.5', c.value)}>{value}</p>
        {subtitle && <p className="text-xs text-gray-400 mt-0.5">{subtitle}</p>}
      </div>
    </div>
  );
};
