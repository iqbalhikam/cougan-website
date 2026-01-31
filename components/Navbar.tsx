'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Menu, X } from 'lucide-react';
import { useState } from 'react';
import Image from 'next/image';

export function Navbar() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);

  const routes = [
    { href: '/', label: 'Home' },
    { href: '/multiview', label: 'Multi-View' },
  ];

  return (
    <nav className="fixed top-0 z-50 w-full border-b border-white/10 bg-black/10 backdrop-blur-sm">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-26 items-center justify-between">
          <div className="flex items-center">
            <Link href="/" className="flex items-center gap-2">
              <span className="text-2xl flex items-center font-bold tracking-tighter text-gold">
                <span>
                  <Image src="/LOGO-COUGAN.gif" alt="Cougan Fams Logo" width={500} height={500} className="w-40 md:w-56 lg:w-20 h-auto object-contain" unoptimized />
                </span>
                {/* <span className="font-cougan-text px-4">X</span>
                <span>
                  <Image src="/BSG_LOGO.png" alt="Cougan Fams Logo" width={500} height={500} className="w-40 md:w-56 lg:w-15 h-auto object-contain" unoptimized />
                </span> */}
                {/* COUGAN<span className="text-white">FAMILLIA</span> */}
              </span>
            </Link>
          </div>

          <div className="hidden md:block">
            <div className="flex items-center space-x-8">
              {routes.map((route) => (
                <Link key={route.href} href={route.href} className={cn('text-sm font-medium transition-colors hover:text-gold', pathname === route.href ? 'text-gold' : 'text-zinc-400')}>
                  {route.label}
                </Link>
              ))}
            </div>
          </div>

          <div className="md:hidden">
            <button onClick={() => setIsOpen(!isOpen)} className="text-zinc-400 hover:text-white">
              {isOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isOpen && (
        <div className="md:hidden border-b border-white/10 bg-black">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
            {routes.map((route) => (
              <Link
                key={route.href}
                href={route.href}
                onClick={() => setIsOpen(false)}
                className={cn('block px-3 py-2 rounded-md text-base font-medium', pathname === route.href ? 'bg-white/10 text-gold' : 'text-zinc-400 hover:bg-white/5 hover:text-white')}>
                {route.label}
              </Link>
            ))}
          </div>
        </div>
      )}
    </nav>
  );
}
