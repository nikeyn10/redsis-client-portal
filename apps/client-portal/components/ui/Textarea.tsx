import { TextareaHTMLAttributes, forwardRef } from 'react';
import { clsx } from 'clsx';

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, label, error, style, ...props }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <label className="block text-sm font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>
            {label}
          </label>
        )}
        <textarea
          ref={ref}
          className={clsx(
            'w-full px-4 py-3 rounded-lg transition-all duration-200 resize-y',
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

Textarea.displayName = 'Textarea';