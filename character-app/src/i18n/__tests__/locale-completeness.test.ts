import { describe, it, expect } from 'vitest'

import enCommon from '../locales/en/common'
import enHeader from '../locales/en/header'
import enNavigation from '../locales/en/navigation'
import enForm from '../locales/en/form'
import enPreview from '../locales/en/preview'
import enValidation from '../locales/en/validation'

import ruCommon from '../locales/ru/common'
import ruHeader from '../locales/ru/header'
import ruNavigation from '../locales/ru/navigation'
import ruForm from '../locales/ru/form'
import ruPreview from '../locales/ru/preview'
import ruValidation from '../locales/ru/validation'

type AnyObject = Record<string, unknown>

function collectKeys(obj: AnyObject, prefix = ''): string[] {
  return Object.entries(obj).flatMap(([k, v]) => {
    const full = prefix ? `${prefix}.${k}` : k
    if (v !== null && typeof v === 'object' && !Array.isArray(v)) {
      return collectKeys(v as AnyObject, full)
    }
    return [full]
  })
}

function checkCompleteness(name: string, en: AnyObject, ru: AnyObject) {
  const enKeys = collectKeys(en)
  const ruKeys = new Set(collectKeys(ru))
  const missing = enKeys.filter(k => !ruKeys.has(k))
  expect(missing, `[${name}] RU missing keys: ${missing.join(', ')}`).toEqual([])
}

const namespaces: Array<[string, AnyObject, AnyObject]> = [
  ['common', enCommon as AnyObject, ruCommon as AnyObject],
  ['header', enHeader as AnyObject, ruHeader as AnyObject],
  ['navigation', enNavigation as AnyObject, ruNavigation as AnyObject],
  ['form', enForm as AnyObject, ruForm as AnyObject],
  ['preview', enPreview as AnyObject, ruPreview as AnyObject],
  ['validation', enValidation as AnyObject, ruValidation as AnyObject],
]

describe('locale completeness', () => {
  for (const [name, en, ru] of namespaces) {
    it(`ru/${name} has all keys from en/${name}`, () => {
      checkCompleteness(name, en, ru)
    })
  }
})
