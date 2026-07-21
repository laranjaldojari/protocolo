import * as React from 'react';
import { cn } from '@/lib/utils';

export const Textarea = React.forwardRef<HTMLTextAreaElement, React.TextareaHTMLAttributes<HTMLTextAreaElement>>(
  ({ className, ...props }, ref) => (
    <textarea
      ref={ref}
      className={cn(
        'flex min-h-[90px] w-full rounded-md border border-jari-300 bg-white px-3 py-2 text-sm',
        'placeholder:text-jari-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-jari-600',
        className,
      )}
      {...props}
    />
  ),
);
Textarea.displayName = 'Textarea';
