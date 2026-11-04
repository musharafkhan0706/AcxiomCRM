import React from 'react';
import { cn } from '../../utils/cn';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'teal' | 'cyan' | 'peach' | 'yellow' | 'sage' | 'slate' | 'outline';
  size?: 'sm' | 'md';
}

export const Badge: React.FC<BadgeProps> = ({
  className,
  variant = 'teal',
  size = 'md',
  children,
  ...props
}) => {
  const variants = {
    teal: 'bg-brand-teal/10 text-brand-teal border border-brand-teal/30',
    cyan: 'bg-brand-cyan/15 text-brand-cyan-700 border border-brand-cyan/40',
    peach: 'bg-brand-peach/20 text-brand-peach-700 border border-brand-peach/50',
    yellow: 'bg-brand-yellow/30 text-amber-800 border border-brand-yellow/60',
    sage: 'bg-brand-sage/30 text-emerald-800 border border-brand-sage/60',
    slate: 'bg-slate-100 text-slate-700 border border-slate-200',
    outline: 'bg-transparent text-slate-600 border border-slate-300',
  };

  const sizes = {
    sm: 'text-[11px] px-2 py-0.5 rounded-md font-medium',
    md: 'text-xs px-2.5 py-1 rounded-full font-medium',
  };

  return (
    <span className={cn('inline-flex items-center gap-1 leading-none select-none', variants[variant], sizes[size], className)} {...props}>
      {children}
    </span>
  );
};

export const StatusBadge: React.FC<{ status: string }> = ({ status }) => {
  const normalized = status.toUpperCase();

  switch (normalized) {
    case 'ACTIVE':
    case 'WON':
    case 'COMPLETED':
    case 'SUCCESS':
      return <Badge variant="sage">{status}</Badge>;

    case 'NEW':
    case 'CONTACTED':
    case 'QUALIFIED':
    case 'OPEN':
      return <Badge variant="cyan">{status}</Badge>;

    case 'PROPOSAL':
    case 'PLANNED':
    case 'MEDIUM':
      return <Badge variant="yellow">{status}</Badge>;

    case 'NEGOTIATION':
    case 'HIGH':
    case 'UNQUALIFIED':
      return <Badge variant="peach">{status}</Badge>;

    case 'LOST':
    case 'CANCELLED':
    case 'INACTIVE':
    case 'MISSED':
    case 'LOCKED':
      return <Badge variant="peach" className="bg-red-50 text-red-700 border-red-200">{status}</Badge>;

    case 'ADMIN':
      return <Badge variant="teal" className="font-semibold">{status}</Badge>;
    case 'MANAGER':
      return <Badge variant="cyan" className="font-semibold">{status}</Badge>;
    case 'SALES_EXECUTIVE':
      return <Badge variant="slate" className="font-semibold">SALES EXEC</Badge>;

    default:
      return <Badge variant="slate">{status}</Badge>;
  }
};

export default Badge;
