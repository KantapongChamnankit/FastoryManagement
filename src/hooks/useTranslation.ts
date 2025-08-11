"use client"

import { useLanguage } from "@/contexts/LanguageContext"
import { translations } from "@/lib/utils/Language"

export function useTranslation() {
  const { lang } = useLanguage()
  
  const t = (key: string) => {
    return translations[lang]?.[key as keyof typeof translations[typeof lang]] || 
           translations.en[key as keyof typeof translations.en] || 
           key
  }

  return { t, lang }
}
