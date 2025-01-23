import { cn } from '@/lib/utils';
import { ElementType } from 'react';

interface ContainerProps<T extends ElementType = 'div'> {
  children: React.ReactNode;
  className?: string;
  as?: T;
}

export function Container<T extends ElementType = 'div'>({
  children,
  className,
  as: Component = 'div' as T,
  ...props
}: ContainerProps<T> & Omit<React.ComponentPropsWithoutRef<T>, keyof ContainerProps<T>>) {
  return (
    <Component
      className={cn(
        'mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8',
        className
      )}
      {...props}
    >
      {children}
    </Component>
  );
}

export function Section({
  children,
  className,
  ...props
}: React.HTMLAttributes<HTMLElement>) {
  return (
    <section
      className={cn('py-16 md:py-24', className)}
      {...props}
    >
      <Container>{children}</Container>
    </section>
  );
} 