import { ButtonHTMLAttributes, forwardRef } from 'react';
import { clsx } from 'clsx';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', children, style, ...props }, ref) => {
    const getVariantStyles = () => {
      switch (variant) {
        case 'primary':
          return {
            backgroundColor: 'var(--redsislab-yellow)',
            color: 'var(--text-inverse)',
            boxShadow: 'var(--shadow-yellow)',
          };
        case 'secondary':
          return {
            backgroundColor: 'var(--ibacs-tertiary)',
            color: 'var(--text-primary)',
            border: '1px solid var(--ibacs-tertiary)',
          };
        case 'ghost':
          return {
            backgroundColor: 'transparent',
            color: 'var(--text-secondary)',
            border: '1px solid var(--ibacs-tertiary)',
          };
        case 'danger':
          return {
            backgroundColor: 'var(--ibacs-red)',
            color: 'var(--text-primary)',
          };
        default:
          return {};
      }
    };

    return (
      <button
        ref={ref}
        className={clsx(
          'inline-flex items-center justify-center font-semibold transition-all duration-200 rounded-lg focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed hover:scale-105',
          {
            'px-3 py-1.5 text-sm': size === 'sm',
            'px-4 py-2 text-base': size === 'md',
            'px-6 py-3 text-lg': size === 'lg',
          },
          className
        )}
        style={{
          ...getVariantStyles(),
          ...style,
        }}
        {...props}
      >
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';