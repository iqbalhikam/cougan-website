'use client';

import { useLanguage } from '@/components/providers/LanguageProvider';

export function HomeHeader() {
  const { dict } = useLanguage();

  return (
    <div className="mb-12 text-center md:text-left">
      <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">{dict.home.theFamilyMembers}</h2>
      <p className="text-zinc-400 max-w-2xl">{dict.home.memberDescription}</p>
    </div>
  );
}
