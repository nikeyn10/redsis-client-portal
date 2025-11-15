import { InputHTMLAttributes, forwardRef } from 'react';
import { clsx } from 'clsx';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, style, ...props }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <label className="block text-sm font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>
            {label}
          </label>
        )}
        <input
          ref={ref}
          className={clsx(
            'w-full px-4 py-3 rounded-lg transition-all duration-200',
            className
          )}
          style={{
            backgroundColor: 'var(--ibacs-tertiary)',
            border: error ? '2px solid var(--ibacs-red)' : '1px solid var(--ibacs-tertiary)',
            color: 'var(--text-primary)',
            ...style,
          }}
          {...props}
        />
        {error && <p className="mt-2 text-sm" style={{ color: 'var(--ibacs-red)' }}>{error}</p>}
      </div>
    );
  }
);

Input.displayName = 'Input';