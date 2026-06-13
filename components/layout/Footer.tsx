'use client';

import { useLanguage } from '@/components/providers/LanguageProvider';

export function Footer() {
  const { dict } = useLanguage();

  return (
    <footer className="py-12 border-t border-zinc-900 bg-background text-center text-zinc-600 text-[10px] uppercase tracking-[0.3em]">
      <p>
        &copy; {new Date().getFullYear()} {dict.home.copyright}
      </p>
    </footer>
  );
}
