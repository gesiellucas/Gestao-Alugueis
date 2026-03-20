import React from 'react';
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  label: string;
  Icon: LucideIcon;
  variant?: 'blue' | 'green' | 'amber';
}

const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  label,
  Icon,
  variant = 'blue'
}) => {
  const themes = {
    blue: {
      text: 'text-brand-blue',
      bg: 'text-brand-blue',
      badgeText: 'text-brand-blue',
      badgeBg: 'bg-blue-50',
    },
    green: {
      text: 'text-green-600',
      bg: 'bg-green-50',
      badgeText: 'text-green-700',
      badgeBg: 'bg-green-50',
    },
    amber: {
      text: 'text-amber-500',
      bg: 'bg-amber-50',
      badgeText: 'text-amber-700',
      badgeBg: 'bg-amber-50',
    }
  };

  const theme = themes[variant];

  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 relative overflow-hidden group transition-all hover:shadow-md z-1">
      <div className={`absolute top-0 right-0 w-24 h-24 bg-brand-blue/10 -mr-8 -mt-8 rounded-full transition-transform group-hover:scale-110 z-2`}></div>

      <div className="relative z-10">
        <p className="text-xs font-bold text-slate-400 uppercase mb-3">
          {title}
        </p>

        <h3 className={`text-2xl font-bold ${theme.text}`}>
          {value}
        </h3>

        <div className={`mt-4 flex items-center gap-2 ${theme.badgeText} font-medium text-xs ${theme.badgeBg} w-fit px-4 py-2 rounded-full`}>
          <Icon size={14} className="flex-shrink-0" />
          <span className="whitespace-nowrap">{label}</span>
        </div>
      </div>
    </div>
  );
};

export default StatCard;
