import type { Metadata } from "next";
import { Inter } from 'next/font/google';
import { ThemeProvider } from "@/components/providers/theme-provider";
import { Navbar } from "@/components/layout/navigation/navbar";
import { Footer } from "@/components/layout/navigation/footer";
import "@/styles/globals.css";

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
});

export const metadata: Metadata = {
  title: "GAIAthon25",
  description: "The world's premier hackathon for sustainable technology solutions.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
