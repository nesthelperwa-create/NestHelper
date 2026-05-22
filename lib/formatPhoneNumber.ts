export function formatPhoneNumber(value: string) {
  const digitsOnly = value.replace(/\D/g, "");
  const normalized = digitsOnly.length === 11 && digitsOnly.startsWith("1")
    ? digitsOnly.slice(1)
    : digitsOnly;
  const digits = normalized.slice(0, 10);

  if (digits.length <= 3) return digits;
  if (digits.length <= 6) return `${digits.slice(0, 3)}-${digits.slice(3)}`;

  return `${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6)}`;
}
