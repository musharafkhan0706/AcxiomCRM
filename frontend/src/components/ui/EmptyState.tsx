import React from 'react';
import { cn } from '../../utils/cn';
import { PackageOpen } from 'lucide-react';
import { Button } from './Button';

export interface EmptyStateProps {
  title: string;
  description: string;
  actionText?: string;
  onAction?: () => void;
  action?: React.ReactNode;
  icon?: any;
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title,
  description,
  actionText,
  onAction,
  action,
  icon,
  className,
}) => {
  const renderIcon = () => {
    if (!icon) return <PackageOpen className="w-8 h-8 text-brand-teal" />;
    if (React.isValidElement(icon)) return icon;
    const IconComp = icon;
    return <IconComp className="w-8 h-8 text-brand-teal" />;
  };

  return (
    <div className={cn('flex flex-col items-center justify-center p-12 text-center', className)}>
      <div className="w-16 h-16 rounded-full bg-teal-50 flex items-center justify-center mb-4 shadow-sm border border-teal-100">
        {renderIcon()}
      </div>
      <h3 className="text-base font-semibold text-gray-800">{title}</h3>
      <p className="text-xs text-gray-500 max-w-sm mt-1 mb-5">{description}</p>
      {action ? (
        action
      ) : actionText && onAction ? (
        <Button onClick={onAction} variant="primary" size="sm">
          {actionText}
        </Button>
      ) : null}
    </div>
  );
};

export default EmptyState;
