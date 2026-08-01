// Iranian mobile numbers are stored in the app as 09xxxxxxxxx, but the SMS
// gateways require E.164 (+989xxxxxxxxx). normalizePhone() bridges the two and
// rejects anything malformed. The national part is always 9xxxxxxxxx (10 digits).
export function normalizePhone(input: string): string | null {
  if (!input) return null;

  // Drop spaces/dashes; strip a leading international prefix down to the
  // 10-digit national number (9xxxxxxxxx).
  let s = input.trim().replace(/[\s-]/g, "");
  if (s.startsWith("+98")) s = s.slice(3);
  else if (s.startsWith("0098")) s = s.slice(4);
  else if (s.startsWith("98") && s.length === 12) s = s.slice(2);
  else if (s.startsWith("0") && s.length === 11) s = s.slice(1);

  if (!/^9\d{9}$/.test(s)) return null;
  return "+98" + s;
}
