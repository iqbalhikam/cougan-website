'use client';

import { useLanguage } from '@/components/providers/LanguageProvider';

export function Footer() {
  const { dict } = useLanguage();

  return (
    <footer className="py-10 border-t border-white/10 text-center text-zinc-500 text-sm">
      <p>
        &copy; {new Date().getFullYear()} {dict.home.copyright}
      </p>
    </footer>
  );
}
