import * as crypto from 'crypto'

export function randomCode(length: number): string {
  return crypto
    .randomBytes(Math.ceil(length / 2))
    .toString('hex')
    .slice(0, length)
}

export function nameValue<T extends Record<string, any>>(
  result: T[],
  choice: keyof T,
  value: keyof T,
): { name: string; value: string }[] {
  return result.map((r) => ({
    name: String(r[choice]),
    value: String(r[value]),
  }))
}
