const CONTROL_CHARACTERS = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g
const HTML_DELIMITERS = /[<>]/g
const HORIZONTAL_WHITESPACE = /[\t ]+/g

export function sanitizeSingleLine(value: string) {
  return value
    .normalize('NFKC')
    .replace(CONTROL_CHARACTERS, '')
    .replace(HTML_DELIMITERS, '')
    .replace(/[\r\n]+/g, ' ')
    .replace(HORIZONTAL_WHITESPACE, ' ')
    .trim()
}
export function sanitizeMultiline(value: string) {
  return value
    .normalize('NFKC')
    .replace(CONTROL_CHARACTERS, '')
    .replace(HTML_DELIMITERS, '')
    .replace(/\r\n?/g, '\n')
    .split('\n')
    .map((line) => line.replace(HORIZONTAL_WHITESPACE, ' ').trim())
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}
export function normalizeEmail(value: string) {
  return sanitizeSingleLine(value).toLowerCase()
}
