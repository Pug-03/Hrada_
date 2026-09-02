import type { Screen } from '@/lib/permissions'
import type { TranslationKey } from '@/lib/i18n'

/**
 * Router state carried to /not-authorized. A screen id and an optional extra
 * reason key, not a pre-rendered sentence — so the not-authorized page still
 * reads correctly after the viewer switches language.
 */
export interface DeniedState {
  screen?: Screen
  attempted: string
  suffixKey?: TranslationKey
}
