import React from 'react';
import { useTranslation } from 'react-i18next';
import { Globe } from 'lucide-react';
import './LanguageSwitcher.css';

const LanguageSwitcher = () => {
    const { i18n } = useTranslation();

    const changeLanguage = (lng) => {
        i18n.changeLanguage(lng);
    };

    const languages = [
        { code: 'en', name: 'English' },
        { code: 'hi', name: 'Hindi' },
        { code: 'te', name: 'Telugu' },
        { code: 'gu', name: 'Gujarati' },
        { code: 'mr', name: 'Marathi' },
        { code: 'pa', name: 'Punjabi' },
        { code: 'ta', name: 'Tamil' },
        { code: 'kn', name: 'Kannada' }
    ];

    return (
        <div className="language-switcher-container">
            <Globe size={18} className="lang-icon" />
            <select
                value={i18n.language}
                onChange={(e) => changeLanguage(e.target.value)}
                className="lang-select"
            >
                {languages.map((lang) => (
                    <option key={lang.code} value={lang.code}>
                        {lang.name}
                    </option>
                ))}
            </select>
        </div>
    );
};

export default LanguageSwitcher;
