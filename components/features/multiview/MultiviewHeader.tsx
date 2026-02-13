'use client';

import { useLanguage } from '@/components/providers/LanguageProvider';

export function MultiviewHeader() {
  const { dict } = useLanguage();

  return (
    <div className="mb-6">
      <h1 className="text-3xl font-bold text-white">{dict.multiview.title}</h1>
      <p className="text-zinc-400">{dict.multiview.description}</p>
    </div>
  );
}
