import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import en from './locales/en.json';
import hi from './locales/hi.json';
import te from './locales/te.json';
import gu from './locales/gu.json';
import mr from './locales/mr.json';
import pa from './locales/pa.json';
import ta from './locales/ta.json';
import kn from './locales/kn.json';

i18n
    .use(LanguageDetector)
    .use(initReactI18next)
    .init({
        resources: {
            en: { translation: en },
            hi: { translation: hi },
            te: { translation: te },
            gu: { translation: gu },
            mr: { translation: mr },
            pa: { translation: pa },
            ta: { translation: ta },
            kn: { translation: kn },
        },
        fallbackLng: 'en',
        interpolation: {
            escapeValue: false,
        },
        detection: {
            order: ['localStorage', 'navigator'],
            caches: ['localStorage'],
        }
    });

export default i18n;
