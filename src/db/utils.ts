// Simple cuid-like ID generator
export function createId(): string {
  const timestamp = Date.now().toString(36)
  const randomPart = Math.random().toString(36).substring(2, 9)
  return `c${timestamp}${randomPart}`
}
