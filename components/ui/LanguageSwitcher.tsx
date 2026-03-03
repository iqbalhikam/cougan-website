'use client';

import { useLanguage } from '@/components/providers/LanguageProvider';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

export function LanguageSwitcher() {
  const { language, setLanguage } = useLanguage();

  return (
    <div className="flex items-center gap-2 bg-black/40 backdrop-blur-md border border-white/10 rounded-full p-1">
      <button onClick={() => setLanguage('id')} className={cn('relative px-3 py-1 text-xs font-medium rounded-full transition-all duration-300', language === 'id' ? 'text-black' : 'text-zinc-400 hover:text-white')}>
        {language === 'id' && <motion.div layoutId="activeLang" className="absolute inset-0 bg-gold rounded-full" transition={{ type: 'spring', duration: 0.5 }} />}
        <span className="relative z-10">ID</span>
      </button>
      <button onClick={() => setLanguage('en')} className={cn('relative px-3 py-1 text-xs font-medium rounded-full transition-all duration-300', language === 'en' ? 'text-black' : 'text-zinc-400 hover:text-white')}>
        {language === 'en' && <motion.div layoutId="activeLang" className="absolute inset-0 bg-gold rounded-full" transition={{ type: 'spring', duration: 0.5 }} />}
        <span className="relative z-10">EN</span>
      </button>
    </div>
  );
}
