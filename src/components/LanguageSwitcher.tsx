import React from 'react';
import { useTranslation } from 'react-i18next';

const LanguageSwitcher: React.FC<{ className?: string }> = ({ className = '' }) => {
  const { i18n } = useTranslation();
  const current = i18n.resolvedLanguage?.startsWith('en') ? 'en' : 'fr';

  const setLang = (lang: 'fr' | 'en') => {
    i18n.changeLanguage(lang);
  };

  return (
    <div className={`inline-flex items-center gap-0.5 text-xs font-body ${className}`}>
      <button
        onClick={() => setLang('fr')}
        aria-pressed={current === 'fr'}
        className={`px-2 py-1 rounded transition-colors ${
          current === 'fr'
            ? 'bg-accent/10 text-accent font-medium'
            : 'text-muted-foreground hover:text-foreground'
        }`}
      >
        FR
      </button>
      <span className="text-border">/</span>
      <button
        onClick={() => setLang('en')}
        aria-pressed={current === 'en'}
        className={`px-2 py-1 rounded transition-colors ${
          current === 'en'
            ? 'bg-accent/10 text-accent font-medium'
            : 'text-muted-foreground hover:text-foreground'
        }`}
      >
        EN
      </button>
    </div>
  );
};

export default LanguageSwitcher;
