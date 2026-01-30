import React from 'react';
import { cn } from '@/shared/lib/utils';

interface TextButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'danger' | 'success' | 'surface';
}

export const TextButton = React.forwardRef<HTMLButtonElement, TextButtonProps>(
  ({ className, children, variant = 'primary', ...props }, ref) => {
    const variantStyles = {
      primary: 'text-primary-600 active:text-primary-700 disabled:text-surface-300',
      secondary: 'text-surface-600 active:text-surface-700 disabled:text-surface-300',
      danger: 'text-accent-rose active:text-accent-rose/80 disabled:text-surface-300',
      success: 'text-accent-emerald active:text-accent-emerald/80 disabled:text-surface-300',
      surface: 'text-surface-400 active:text-surface-500 disabled:text-surface-200',
    };

    return (
      <button
        ref={ref}
        className={cn(
          'inline-flex items-center justify-center text-sm font-medium transition-colors focus:outline-none disabled:cursor-not-allowed',
          variantStyles[variant],
          className
        )}
        {...props}
      >
        {children}
      </button>
    );
  }
);

TextButton.displayName = 'TextButton';
