import React from 'react';
import { cn } from '../../utils/cn';

export interface KpiCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  subtext?: string;
  icon: any;
  variant?: 'teal' | 'cyan' | 'peach' | 'yellow' | 'sage';
  colorVariant?: 'teal' | 'cyan' | 'peach' | 'yellow' | 'sage';
  trend?: {
    value: string;
    isPositive?: boolean;
  };
  onClick?: () => void;
}

export const KpiCard: React.FC<KpiCardProps> = ({
  title,
  value,
  subtitle,
  subtext,
  icon,
  variant,
  colorVariant = 'teal',
  trend,
  onClick,
}) => {
  const chosenVariant = variant || colorVariant;
  const chosenSubtitle = subtitle || subtext;

  const iconBgs = {
    teal: 'bg-brand-deep-teal/10 text-brand-deep-teal border-brand-deep-teal/20',
    cyan: 'bg-brand-bright-cyan/20 text-teal-800 border-brand-bright-cyan/30',
    peach: 'bg-brand-warm-peach/20 text-orange-800 border-brand-warm-peach/40',
    yellow: 'bg-brand-soft-yellow/30 text-amber-800 border-brand-soft-yellow/50',
    sage: 'bg-brand-sage-green/30 text-emerald-800 border-brand-sage-green/50',
  };

  const borders = {
    teal: 'hover:border-brand-deep-teal/40',
    cyan: 'hover:border-brand-bright-cyan/50',
    peach: 'hover:border-brand-warm-peach/60',
    yellow: 'hover:border-brand-soft-yellow/60',
    sage: 'hover:border-brand-sage-green/60',
  };

  const renderIcon = () => {
    if (!icon) return null;
    if (React.isValidElement(icon)) return icon;
    const IconComp = icon;
    return <IconComp className="w-5 h-5" />;
  };

  return (
    <div
      onClick={onClick}
      className={cn(
        'bg-white rounded-xl p-5 border border-slate-200/80 shadow-sm transition-all hover:shadow-md hover:-translate-y-0.5',
        onClick && 'cursor-pointer',
        borders[chosenVariant]
      )}
    >
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">{title}</p>
        <div
          className={cn(
            'w-10 h-10 rounded-xl flex items-center justify-center border shadow-xs',
            iconBgs[chosenVariant]
          )}
        >
          {renderIcon()}
        </div>
      </div>

      <div className="mt-3 flex items-baseline justify-between">
        <h3 className="text-2xl font-bold text-slate-900 tracking-tight">{value}</h3>
        {trend && (
          <span
            className={cn(
              'text-xs font-semibold px-2 py-0.5 rounded-full',
              trend.isPositive ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
            )}
          >
            {trend.value}
          </span>
        )}
      </div>

      {chosenSubtitle && <p className="text-xs text-slate-500 mt-1 font-medium">{chosenSubtitle}</p>}
    </div>
  );
};

export default KpiCard;
