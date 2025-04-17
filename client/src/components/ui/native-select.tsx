import React, { forwardRef } from 'react';
import { cn } from '@/lib/utils';
import { Label } from './label';

interface NativeSelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  options: { value: string; label: string }[];
  className?: string;
  containerClassName?: string;
  labelClassName?: string;
  placeholder?: string;
}

const NativeSelect = forwardRef<HTMLSelectElement, NativeSelectProps>(
  ({ label, options, className, containerClassName, labelClassName, placeholder, ...props }, ref) => {
    return (
      <div className={cn("grid w-full items-center gap-1.5", containerClassName)}>
        {label && (
          <Label htmlFor={props.id} className={cn("text-sm font-medium", labelClassName)}>
            {label}
          </Label>
        )}
        <select
          ref={ref}
          className={cn(
            "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background",
            "focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
            className
          )}
          {...props}
        >
          {placeholder && (
            <option value="" disabled={props.required}>
              {placeholder}
            </option>
          )}
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>
    );
  }
);

NativeSelect.displayName = 'NativeSelect';

export { NativeSelect };