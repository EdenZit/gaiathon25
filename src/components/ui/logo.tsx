'use client';

import Link from 'next/link';
import Image from 'next/image';
import { cn } from '@/lib/utils';

interface LogoProps {
  className?: string;
}

export function Logo({ className }: LogoProps) {
  return (
    <Link href="/" className={cn("flex items-center", className)}>
      <Image
        src="/images/logo.png"
        alt="GAIAthon25 Logo"
        width={120}
        height={40}
        className="h-10 w-auto"
        priority
      />
    </Link>
  );
} 