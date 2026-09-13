// ============================================================
// LOCALE CONFIGURATION - REChain Localization System
// ============================================================

// ──────────────────────────────────────────────────────────────
// IMPORTS
// ──────────────────────────────────────────────────────────────

import en from './en/common.js'
import es from './es/common.js'
import fr from './fr/common.js' 

// ──────────────────────────────────────────────────────────────
// LOCALE REGISTRY
// ──────────────────────────────────────────────────────────────

export const locales = {
  en: {
    name: 'English',
    flag: '🇬🇧',
    messages: en,
    direction: 'ltr',
    dateFormat: 'MM/DD/YYYY',
    timeFormat: 'HH:mm',
    numberFormat: {
      decimal: '.',
      thousands: ',',
      currency: 'USD',
      currencySymbol: '$',
    },
  },
  es: {
    name: 'Español',
    flag: '🇪🇸',
    messages: es,
    direction: 'ltr',
    dateFormat: 'DD/MM/YYYY',
    timeFormat: 'HH:mm',
    numberFormat: {
      decimal: ',',
      thousands: '.',
      currency: 'EUR',
      currencySymbol: '€',
    },
  },
  fr: {
    name: 'Français',
    flag: '🇫🇷',
    messages: fr,
    direction: 'ltr',
    dateFormat: 'DD/MM/YYYY',
    timeFormat: 'HH:mm',
    numberFormat: {
      decimal: ',',
      thousands: ' ',
      currency: 'EUR',
      currencySymbol: '€',
    },
  },
}

// ──────────────────────────────────────────────────────────────
// CONSTANTS
// ──────────────────────────────────────────────────────────────

export const defaultLocale = 'en'
export const fallbackLocale = 'en'

export const supportedLocales = Object.keys(locales)

export const localeNames = supportedLocales.reduce((acc, key) => {
  acc[key] = locales[key].name
  return acc
}, {})

export const localeFlags = supportedLocales.reduce((acc, key) => {
  acc[key] = locales[key].flag
  return acc
}, {})

// ──────────────────────────────────────────────────────────────
// CORE FUNCTIONS
// ──────────────────────────────────────────────────────────────

/**
 * Get messages for a specific locale
 * @param {string} locale - The locale code (e.g., 'en', 'es', 'fr')
 * @returns {Object} The messages object for the locale
 */
export const getMessages = (locale = defaultLocale) => {
  const target = locales[locale]
  if (!target) {
    console.warn(`Locale "${locale}" not found, falling back to "${fallbackLocale}"`)
    return locales[fallbackLocale]?.messages || {}
  }
  return target.messages || {}
}

/**
 * Get all supported locales
 * @returns {string[]} Array of locale codes
 */
export const getSupportedLocales = () => {
  return supportedLocales
}

/**
 * Get the name of a locale
 * @param {string} locale - The locale code
 * @returns {string} The name of the locale
 */
export const getLocaleName = (locale) => {
  return locales[locale]?.name || locale
}

/**
 * Get the flag emoji for a locale
 * @param {string} locale - The locale code
 * @returns {string} The flag emoji
 */
export const getLocaleFlag = (locale) => {
  return locales[locale]?.flag || ''
}

/**
 * Get the direction (ltr/rtl) for a locale
 * @param {string} locale - The locale code
 * @returns {string} 'ltr' or 'rtl'
 */
export const getLocaleDirection = (locale) => {
  return locales[locale]?.direction || 'ltr'
}

/**
 * Get the date format for a locale
 * @param {string} locale - The locale code
 * @returns {string} The date format string
 */
export const getDateFormat = (locale) => {
  return locales[locale]?.dateFormat || 'MM/DD/YYYY'
}

/**
 * Get the time format for a locale
 * @param {string} locale - The locale code
 * @returns {string} The time format string
 */
export const getTimeFormat = (locale) => {
  return locales[locale]?.timeFormat || 'HH:mm'
}

/**
 * Get the number format for a locale
 * @param {string} locale - The locale code
 * @returns {Object} The number format configuration
 */
export const getNumberFormat = (locale) => {
  return locales[locale]?.numberFormat || {
    decimal: '.',
    thousands: ',',
    currency: 'USD',
    currencySymbol: '$',
  }
}

/**
 * Translate a key with optional interpolation
 * @param {string} key - The translation key (dot notation, e.g., 'app.name')
 * @param {Object} params - Key-value pairs for interpolation
 * @param {string} locale - The locale to use (optional, defaults to defaultLocale)
 * @returns {string} The translated string
 */
export const t = (key, params = {}, locale = defaultLocale) => {
  const messages = getMessages(locale)
  const keys = key.split('.')
  let value = messages

  for (const k of keys) {
    if (value && typeof value === 'object' && k in value) {
      value = value[k]
    } else {
      // Return the key as fallback with a warning
      if (process.env.NODE_ENV === 'development') {
        console.warn(`Translation key not found: "${key}" for locale "${locale}"`)
      }
      return key
    }
  }

  if (typeof value === 'string' && Object.keys(params).length > 0) {
    return value.replace(/\{(\w+)\}/g, (_, name) => {
      return params[name] !== undefined ? params[name] : `{${name}}`
    })
  }

  return value || key
}

/**
 * Pluralize a translation based on count
 * @param {string} key - The translation key
 * @param {number} count - The count for pluralization
 * @param {Object} params - Additional interpolation parameters
 * @param {string} locale - The locale to use
 * @returns {string} The pluralized translation
 */
export const pluralize = (key, count, params = {}, locale = defaultLocale) => {
  const messages = getMessages(locale)
  const keys = key.split('.')
  let value = messages

  for (const k of keys) {
    if (value && typeof value === 'object' && k in value) {
      value = value[k]
    } else {
      return key
    }
  }

  // If value is an object with plural forms
  if (value && typeof value === 'object') {
    const pluralKey = count === 1 ? 'singular' : 'plural'
    const pluralValue = value[pluralKey] || value.other || JSON.stringify(value)
    if (typeof pluralValue === 'string') {
      const allParams = { ...params, count }
      return pluralValue.replace(/\{(\w+)\}/g, (_, name) => {
        return allParams[name] !== undefined ? allParams[name] : `{${name}}`
      })
    }
    return key
  }

  return value || key
}

/**
 * Check if a locale is supported
 * @param {string} locale - The locale code to check
 * @returns {boolean} True if the locale is supported
 */
export const isLocaleSupported = (locale) => {
  return supportedLocales.includes(locale)
}

/**
 * Get a list of all locales with their names and flags
 * @returns {Array} Array of locale objects
 */
export const getLocaleList = () => {
  return supportedLocales.map(code => ({
    code,
    name: getLocaleName(code),
    flag: getLocaleFlag(code),
    direction: getLocaleDirection(code),
  }))
}

/**
 * Detect the user's preferred locale from the browser
 * @returns {string} The detected locale code
 */
export const detectLocale = () => {
  if (typeof window === 'undefined') {
    return defaultLocale
  }

  // Try navigator.languages first
  if (navigator.languages) {
    for (const lang of navigator.languages) {
      const normalized = lang.split('-')[0]
      if (isLocaleSupported(normalized)) {
        return normalized
      }
    }
  }

  // Fallback to navigator.language
  if (navigator.language) {
    const normalized = navigator.language.split('-')[0]
    if (isLocaleSupported(normalized)) {
      return normalized
    }
  }

  return defaultLocale
}

/**
 * Get the locale from localStorage or cookie
 * @param {string} storageKey - The key to use for storage
 * @returns {string|null} The stored locale or null
 */
export const getStoredLocale = (storageKey = 'preferred_locale') => {
  if (typeof window === 'undefined') {
    return null
  }

  try {
    return localStorage.getItem(storageKey)
  } catch {
    return null
  }
}

/**
 * Save the locale to localStorage
 * @param {string} locale - The locale to save
 * @param {string} storageKey - The key to use for storage
 */
export const setStoredLocale = (locale, storageKey = 'preferred_locale') => {
  if (typeof window === 'undefined') {
    return
  }

  if (!isLocaleSupported(locale)) {
    console.warn(`Cannot store unsupported locale: "${locale}"`)
    return
  }

  try {
    localStorage.setItem(storageKey, locale)
  } catch {

  }
}


/**
 * Create a translation hook for React components
 * @param {Function} useState - React's useState hook
 * @param {Function} useEffect - React's useEffect hook
 * @param {string} initialLocale - The initial locale
 * @returns {Object} The hook result
 */
export const createTranslationHook = (useState, useEffect, initialLocale = defaultLocale) => {
  const [locale, setLocale] = useState(initialLocale)
  const [messages, setMessages] = useState(() => getMessages(initialLocale))
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    const newMessages = getMessages(locale)
    setMessages(newMessages)
  }, [locale])

  const changeLocale = (newLocale) => {
    if (!isLocaleSupported(newLocale)) {
      console.warn(`Locale "${newLocale}" is not supported`)
      return
    }
    setLocale(newLocale)
    setStoredLocale(newLocale)
  }

  const translate = (key, params = {}) => {
    return t(key, params, locale)
  }

  const plural = (key, count, params = {}) => {
    return pluralize(key, count, params, locale)
  }

  return {
    locale,
    messages,
    isLoading,
    setLocale: changeLocale,
    t: translate,
    pluralize: plural,
    changeLocale,
    isSupported: isLocaleSupported(locale),
  }
}

export default {
  locales,
  defaultLocale,
  fallbackLocale,
  supportedLocales,
  localeNames,
  localeFlags,
  getMessages,
  getSupportedLocales,
  getLocaleName,
  getLocaleFlag,
  getLocaleDirection,
  getDateFormat,
  getTimeFormat,
  getNumberFormat,
  t,
  pluralize,
  isLocaleSupported,
  getLocaleList,
  detectLocale,
  getStoredLocale,
  setStoredLocale,
  createTranslationHook,
}