import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const badgeVariants = cva(
  'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2',
  {
    variants: {
      variant: {
        default:
          'bg-primary-100 text-primary-800 hover:bg-primary-200',
        secondary:
          'bg-secondary-100 text-secondary-800 hover:bg-secondary-200',
        success:
          'bg-green-100 text-green-800 hover:bg-green-200',
        warning:
          'bg-yellow-100 text-yellow-800 hover:bg-yellow-200',
        error:
          'bg-red-100 text-red-800 hover:bg-red-200',
        outline:
          'border border-primary-200 text-primary-800 hover:bg-primary-100',
      },
      size: {
        default: 'text-xs',
        sm: 'text-[0.625rem]',
        lg: 'text-sm',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, size, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant, size, className }))} {...props} />
  );
}

export { Badge, badgeVariants }; 