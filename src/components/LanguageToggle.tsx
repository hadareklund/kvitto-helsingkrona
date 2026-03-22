import { useLanguage } from '../i18n/LanguageContext';

function LanguageToggle() {
    const { language, toggleLanguage, tr } = useLanguage();

    return (
        <div className="fixed top-4 right-4 z-[9999]">
            <button
                type="button"
                onClick={toggleLanguage}
                className="btn btn-primary btn-sm shadow-xl"
                title={tr('Byt språk', 'Switch language')}
                aria-label={tr('Byt språk', 'Switch language')}
            >
                {language === 'sv' ? 'English' : 'Svenska'}
            </button>
        </div>
    );
}

export default LanguageToggle;