import { getRequestConfig } from 'next-intl/server';
import { cookies } from 'next/headers';

export const locales = ['en', 'es', 'ja'] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = 'en';

function isValidLocale(value: string): value is Locale {
  return (locales as readonly string[]).includes(value);
}

export default getRequestConfig(async () => {
  let locale: Locale = defaultLocale;

  try {
    const cookieStore = await cookies();
    const preferred = cookieStore.get('preferred-locale')?.value;
    if (preferred && isValidLocale(preferred)) {
      locale = preferred;
    }
  } catch {
    // cookies() may fail during static generation; fall back to default
  }

  return {
    locale,
    messages: (await import(`../../messages/${locale}.json`)).default,
  };
});
