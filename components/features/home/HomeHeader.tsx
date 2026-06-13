'use client';

import { useLanguage } from '@/components/providers/LanguageProvider';

export function HomeHeader() {
  const { dict } = useLanguage();

  return (
    <div className="mb-12 text-center md:text-left border-l-[3px] border-zinc-800 pl-4">
      <h2 className="text-3xl md:text-4xl font-serif text-white mb-2">{dict.home.theFamilyMembers}</h2>
      <p className="text-[10px] tracking-[0.3em] uppercase text-zinc-500 max-w-2xl">{dict.home.memberDescription}</p>
    </div>
  );
}
