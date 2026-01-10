import { ui, defaultLang } from './ui';

export function getLangFromUrl(url: URL) {
    let pathname = url.pathname;

    // Remove base URL if present
    const baseUrl = import.meta.env.BASE_URL.replace(/\/$/, '');
    if (baseUrl && pathname.startsWith(baseUrl)) {
        pathname = pathname.substring(baseUrl.length);
    }

    // Extract language from pathname (e.g., /en/books -> en)
    const [, lang] = pathname.split('/');
    if (lang in ui) return lang as keyof typeof ui;
    return defaultLang;
}

export function useTranslations(lang: keyof typeof ui) {
    return function t(key: keyof typeof ui[typeof defaultLang]) {
        return ui[lang][key] || ui[defaultLang][key];
    }
}

/**
 * Creates a properly formatted URL path with the base path included
 * @param path - The path to format (e.g., '/de/books')
 * @returns The full path with base URL prepended
 */
export function getPath(path: string): string {
    const base = import.meta.env.BASE_URL.replace(/\/$/, ''); // Remove trailing slash
    const cleanPath = path.startsWith('/') ? path : `/${path}`;
    return `${base}${cleanPath}`;
}
