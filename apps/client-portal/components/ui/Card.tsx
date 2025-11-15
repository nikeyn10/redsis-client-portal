import { HTMLAttributes, forwardRef } from 'react';
import { clsx } from 'clsx';

interface CardProps extends HTMLAttributes<HTMLDivElement> {}

export const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ className, children, style, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={clsx(
          'rounded-xl shadow-lg transition-all duration-200',
          className
        )}
        style={{
          backgroundColor: 'var(--ibacs-secondary)',
          border: '1px solid var(--ibacs-tertiary)',
          ...style,
        }}
        {...props}
      >
        {children}
      </div>
    );
  }
);

Card.displayName = 'Card';