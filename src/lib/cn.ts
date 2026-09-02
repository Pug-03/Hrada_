import { clsx, type ClassValue } from 'clsx'
import { extendTailwindMerge } from 'tailwind-merge'

/**
 * tailwind-merge has to be told about the §3.2 type scale.
 *
 * Out of the box it knows Tailwind's stock font sizes (text-xs, text-sm …) and
 * arbitrary pixel ones, but a custom name like `text-small` looks to it
 * like a colour — so `cn('text-small', 'text-sky')` would silently drop the
 * size and leave the element at the inherited one. Declaring the scale here
 * puts both in the right conflict groups.
 */
export const TYPE_SCALE = ['display', 'title', 'section', 'body', 'small', 'micro'] as const

const twMerge = extendTailwindMerge({
  extend: {
    classGroups: {
      'font-size': [{ text: [...TYPE_SCALE] }],
    },
  },
})

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
