import { HTMLAttributes } from 'react';
import { clsx } from 'clsx';

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info';
}

export function Badge({ className, variant = 'default', children, style, ...props }: BadgeProps) {
  const getVariantStyles = () => {
    switch (variant) {
      case 'success':
        return {
          backgroundColor: 'var(--ibacs-green)',
          color: 'var(--text-primary)',
        };
      case 'warning':
        return {
          backgroundColor: 'var(--redsislab-yellow)',
          color: 'var(--text-inverse)',
        };
      case 'danger':
        return {
          backgroundColor: 'var(--ibacs-red)',
          color: 'var(--text-primary)',
        };
      case 'info':
        return {
          backgroundColor: 'var(--ibacs-blue)',
          color: 'var(--text-primary)',
        };
      default:
        return {
          backgroundColor: 'var(--ibacs-tertiary)',
          color: 'var(--text-secondary)',
        };
    }
  };

  return (
    <span
      className={clsx(
        'inline-flex items-center px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide',
        className
      )}
      style={{
        ...getVariantStyles(),
        ...style,
      }}
      {...props}
    >
      {children}
    </span>
  );
}