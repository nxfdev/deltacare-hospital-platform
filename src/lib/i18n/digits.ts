const BN_DIGITS = "০১২৩৪৫৬৭৮৯";

/** Converts ASCII digits to Bangla digits (works on server and client). */
export function toBnDigits(value: string | number): string {
  return String(value).replace(/\d/g, (d) => BN_DIGITS[Number(d)]);
}
