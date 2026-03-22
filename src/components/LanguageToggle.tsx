import { useLanguage } from '../i18n/LanguageContext';

function LanguageToggle() {
    const { language, toggleLanguage, tr } = useLanguage();

    return (
        <button
            type="button"
            onClick={toggleLanguage}
            className="btn btn-sm btn-outline fixed bottom-4 right-4 z-50 shadow-lg"
            title={tr('Byt sprak', 'Switch language')}
            aria-label={tr('Byt sprak', 'Switch language')}
        >
            {language === 'sv' ? 'EN' : 'SV'}
        </button>
    );
}

export default LanguageToggle;