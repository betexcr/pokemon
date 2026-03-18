'use client'

import { useState, useEffect } from 'react'

const LOCALE_LABELS: Record<string, string> = {
  en: 'English',
  es: 'Español',
  ja: '日本語',
}

const STORAGE_KEY = 'preferred-locale'

export default function LocaleSwitcher() {
  const [locale, setLocale] = useState('en')

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved && saved in LOCALE_LABELS) setLocale(saved)
  }, [])

  const handleChange = (newLocale: string) => {
    setLocale(newLocale)
    localStorage.setItem(STORAGE_KEY, newLocale)
    document.cookie = `preferred-locale=${newLocale};path=/;max-age=${60 * 60 * 24 * 365};samesite=lax`
    window.location.reload()
  }

  return (
    <select
      value={locale}
      onChange={(e) => handleChange(e.target.value)}
      className="px-2 py-1 text-xs border border-border rounded bg-surface text-text"
      aria-label="Select language"
    >
      {Object.entries(LOCALE_LABELS).map(([code, label]) => (
        <option key={code} value={code}>
          {label}
        </option>
      ))}
    </select>
  )
}
