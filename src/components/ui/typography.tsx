import { cn } from '@/lib/utils';
import { HTMLAttributes } from 'react';

interface TypographyProps extends HTMLAttributes<HTMLElement> {
  children: React.ReactNode;
  className?: string;
}

export function H1({ children, className, ...props }: TypographyProps) {
  return (
    <h1
      className={cn(
        'scroll-m-20 text-4xl font-bold tracking-tight lg:text-5xl text-primary-900',
        className
      )}
      {...props}
    >
      {children}
    </h1>
  );
}

export function H2({ children, className, ...props }: TypographyProps) {
  return (
    <h2
      className={cn(
        'scroll-m-20 text-3xl font-semibold tracking-tight text-primary-800',
        className
      )}
      {...props}
    >
      {children}
    </h2>
  );
}

export function H3({ children, className, ...props }: TypographyProps) {
  return (
    <h3
      className={cn(
        'scroll-m-20 text-2xl font-semibold tracking-tight text-primary-700',
        className
      )}
      {...props}
    >
      {children}
    </h3>
  );
}

export function P({ children, className, ...props }: TypographyProps) {
  return (
    <p
      className={cn('leading-7 text-primary-600 [&:not(:first-child)]:mt-6', className)}
      {...props}
    >
      {children}
    </p>
  );
}

export function Lead({ children, className, ...props }: TypographyProps) {
  return (
    <p
      className={cn('text-xl text-primary-600 font-normal', className)}
      {...props}
    >
      {children}
    </p>
  );
}

export function Large({ children, className, ...props }: TypographyProps) {
  return (
    <div
      className={cn('text-lg font-semibold text-primary-900', className)}
      {...props}
    >
      {children}
    </div>
  );
}

export function Small({ children, className, ...props }: TypographyProps) {
  return (
    <small
      className={cn('text-sm font-medium leading-none', className)}
      {...props}
    >
      {children}
    </small>
  );
}

export function Subtle({ children, className, ...props }: TypographyProps) {
  return (
    <p
      className={cn('text-sm text-primary-500', className)}
      {...props}
    >
      {children}
    </p>
  );
} 