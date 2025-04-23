'use client';

import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  className?: string;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, className = '', ...props }, ref) => {
    return (
      <div className="space-y-2" suppressHydrationWarning>
        {label && (
          <label
            htmlFor={props.id}
            className="block text-sm font-medium text-gray-700"
            suppressHydrationWarning
          >
            {label}
          </label>
        )}
        <div suppressHydrationWarning>
          <input
            ref={ref}
            className={`
              block w-full rounded-md border-gray-300 shadow-sm 
              focus:border-blue-500 focus:ring-blue-500 sm:text-sm
              ${error ? 'border-red-500' : ''}
              ${className}
            `}
            suppressHydrationWarning
            {...props}
          />
        </div>
        {error && (
          <p className="mt-1 text-sm text-red-600" suppressHydrationWarning>{error}</p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';

export default Input; 