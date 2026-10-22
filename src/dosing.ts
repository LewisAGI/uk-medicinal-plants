/** Sentence-level dosing check. Applied only to medicinal use and basis text. */
export const DOSING = /\bmg\b|\bml\b|\bgrams?\b|\bteaspoons?\b|\btimes a day/i

export function hasDosing(text: string): boolean {
  return DOSING.test(text)
}

export function stripDosing(text: string): string {
  return text
    .split(/(?<=[.!?])\s+/)
    .filter((part) => !DOSING.test(part))
    .join(' ')
    .replace(/\s+/g, ' ')
    .trim()
}
