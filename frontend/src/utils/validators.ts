// Validation utility functions

export const validName = (name: string): boolean => {
  const trimmed = name.trim()
  if (trimmed.length === 0 || trimmed.length > 20) return false

  return /^[A-Za-z]+(?:[ -][A-Za-z]+)*$/.test(trimmed)
}

export const validEmail = (email: string): boolean => {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())
}

export const validPhoneNumber = (phone: string): boolean => {
  const digitsOnly = phone.replace(/\D/g, "")
  return digitsOnly.length == 10
}