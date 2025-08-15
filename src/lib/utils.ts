import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function autoSerialize(data: any): any {
  if (!data) return data;

  if (Array.isArray(data)) {
    return data.map(item => autoSerialize(item));
  }

  const plain = data.toObject?.() || data;

  return Object.fromEntries(
    Object.entries(plain).map(([key, value]) => {
      if (value && typeof value === "object") {
        if (value instanceof Date) {
          return [key, value.getTime()]; // Convert Date to timestamp (number)
        }

        if (typeof value.toString === "function" && (value as any)._bsontype === "ObjectId") {
          return [key, value.toString()];
        }

        return [key, autoSerialize(value)];
      }

      return [key, value];
    })
  );
}

// Mobile-friendly string truncation
export type TruncateOptions = {
  // Ellipsis string to append when truncated
  ellipsis?: string
  // Try to cut on word boundary for end truncation
  wordBoundary?: boolean
  // Where to place the ellipsis
  position?: 'start' | 'middle' | 'end'
}

// Split string into grapheme clusters to avoid breaking emojis/accents
function toGraphemes(str: string): string[] {
  // Use Intl.Segmenter when available
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const AnyIntl: any = Intl as any
  if (AnyIntl && typeof AnyIntl.Segmenter === 'function') {
    const seg = new AnyIntl.Segmenter(undefined, { granularity: 'grapheme' })
    // segment(str) returns iterable of segments with .segment property
    return Array.from(seg.segment(str), (s: { segment: string }) => s.segment)
  }
  // Fallback: split by Unicode code points
  return Array.from(str)
}

export function truncateString(
  input: string | null | undefined,
  maxLength: number,
  options: TruncateOptions = {}
): string {
  const str = (input ?? '').toString()
  if (maxLength <= 0) return ''

  const { ellipsis = '…', wordBoundary = true, position = 'end' } = options

  const graphemes = toGraphemes(str)
  if (graphemes.length <= maxLength) return str

  // If maxLength is too small for ellipsis, hard slice
  if (maxLength <= ellipsis.length) {
    return graphemes.slice(0, maxLength).join('')
  }

  if (position === 'start') {
    const tail = graphemes.slice(graphemes.length - (maxLength - ellipsis.length)).join('')
    return ellipsis + tail
  }

  if (position === 'middle') {
    const keep = maxLength - ellipsis.length
    const head = Math.ceil(keep / 2)
    const tail = Math.floor(keep / 2)
    const left = graphemes.slice(0, head).join('')
    const right = graphemes.slice(graphemes.length - tail).join('')
    return left + ellipsis + right
  }

  // position === 'end'
  let slice = graphemes.slice(0, maxLength - ellipsis.length).join('')
  if (wordBoundary) {
    const lastSpace = slice.search(/\s\S*$/) === -1 ? slice.lastIndexOf(' ') : slice.search(/\s\S*$/)
    if (lastSpace > 0) {
      slice = slice.slice(0, lastSpace).replace(/[\s\.,;:!?'"-]+$/, '')
    }
  }
  return slice + ellipsis
}

// Convenience helper for mobile UIs
export function adjustForMobile(
  input: string | null | undefined,
  maxLength = 24,
  options?: TruncateOptions
): string {
  return truncateString(input, maxLength, { wordBoundary: true, position: 'end', ...options })
}

