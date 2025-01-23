import { useState } from 'react';
import Link from 'next/link';
import { useTheme } from 'next-themes';
import { Container } from '@/components/ui/container';
import { Button } from '@/components/common/Button';

// Navigation items
const navigation = [
  { name: 'Home', href: '/' },
  { name: 'About', href: '/about' },
  { name: 'Schedule', href: '/schedule' },
  { name: 'Resources', href: '/resources' },
];

const resources = [
  { name: 'WEkEO', href: 'https://www.wekeo.eu', external: true },
  { name: 'Dunia', href: 'https://dunia.esa.int', external: true },
];

export function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const { theme, setTheme } = useTheme();

  return (
    <nav className="sticky top-0 z-50 bg-primary-500 shadow-md">
      <Container>
        <div className="relative flex h-16 items-center justify-between">
          {/* Logo */}
          <div className="flex items-center">
            <Link href="/" className="flex items-center space-x-2">
              <span className="text-xl font-bold text-white">GAIAthon25</span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex md:items-center md:space-x-6">
            {navigation.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className="text-sm font-medium text-white hover:text-primary-100"
              >
                {item.name}
              </Link>
            ))}
            
            {/* Resources Dropdown */}
            <div className="relative group">
              <button className="flex items-center space-x-1 text-sm font-medium text-white hover:text-primary-100">
                <span>Resources</span>
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              <div className="absolute right-0 mt-2 w-48 origin-top-right rounded-md bg-white py-1 shadow-lg ring-1 ring-black ring-opacity-5 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all">
                {resources.map((item) => (
                  <a
                    key={item.name}
                    href={item.href}
                    target={item.external ? '_blank' : undefined}
                    rel={item.external ? 'noopener noreferrer' : undefined}
                    className="block px-4 py-2 text-sm text-primary-600 hover:bg-primary-50"
                  >
                    {item.name}
                  </a>
                ))}
              </div>
            </div>

            {/* Auth Buttons */}
            <div className="flex items-center space-x-2">
              <Button variant="outline" className="text-white border-white hover:bg-white hover:text-primary-500">
                Sign In
              </Button>
              <Button className="bg-white text-primary-500 hover:bg-primary-100">
                Register
              </Button>
            </div>
          </div>

          {/* Mobile menu button */}
          <div className="flex md:hidden">
            <button
              type="button"
              className="inline-flex items-center justify-center rounded-md p-2 text-white hover:bg-primary-600"
              onClick={() => setIsOpen(!isOpen)}
            >
              <span className="sr-only">Open main menu</span>
              {isOpen ? (
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              )}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        <div className={`${isOpen ? 'block' : 'hidden'} md:hidden`}>
          <div className="space-y-1 px-2 pb-3 pt-2">
            {navigation.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className="block rounded-md px-3 py-2 text-base font-medium text-white hover:bg-primary-600"
                onClick={() => setIsOpen(false)}
              >
                {item.name}
              </Link>
            ))}
            {resources.map((item) => (
              <a
                key={item.name}
                href={item.href}
                target={item.external ? '_blank' : undefined}
                rel={item.external ? 'noopener noreferrer' : undefined}
                className="block rounded-md px-3 py-2 text-base font-medium text-white hover:bg-primary-600"
                onClick={() => setIsOpen(false)}
              >
                {item.name}
              </a>
            ))}
            <div className="mt-4 space-y-2 px-3">
              <Button variant="outline" className="w-full text-white border-white hover:bg-white hover:text-primary-500">
                Sign In
              </Button>
              <Button className="w-full bg-white text-primary-500 hover:bg-primary-100">
                Register
              </Button>
            </div>
          </div>
        </div>
      </Container>
    </nav>
  );
} 