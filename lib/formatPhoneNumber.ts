export function formatPhoneNumber(value: string) {
  const rawDigits = value.replace(/\D/g, "");

  // Browser/contact autofill sometimes supplies a U.S. number with a leading
  // country code, like 1-425-790-1330. Remove that leading 1 before limiting
  // to the 10-digit local phone number so the final digit is not dropped.
  const digits = rawDigits.length === 11 && rawDigits.startsWith("1")
    ? rawDigits.slice(1)
    : rawDigits.slice(0, 10);

  if (digits.length <= 3) return digits;
  if (digits.length <= 6) return `${digits.slice(0, 3)}-${digits.slice(3)}`;
  return `${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6)}`;
}
