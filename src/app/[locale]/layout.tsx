import { Inter } from 'next/font/google';
import { ThemeProvider } from '@/providers/theme-provider';
import { RootLayout } from '@/components/layout/root-layout';
import '@/styles/globals.css';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
});

export const metadata: Metadata = {
  title: 'GAIAthon25-Hub',
  description: 'A modern web application for GAIAthon25',
};

// Add supported locales
const locales = ['en', 'fr'];

export default function Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.variable}>
        <ThemeProvider>
          <RootLayout>{children}</RootLayout>
        </ThemeProvider>
      </body>
    </html>
  );
} 