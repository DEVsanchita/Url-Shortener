// Base62 uses 62 characters: 0-9, a-z, A-Z
// This lets us represent large numbers in far fewer characters than base10,
// which is exactly what we want for short URL codes.
const CHARS = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";
const BASE = CHARS.length; // 62

/**
 * Converts a positive integer into a base62 string.
 * e.g. encode(125) -> "21"
 */
export function encode(num) {
  if (num === 0) return CHARS[0];
  let result = "";
  while (num > 0) {
    result = CHARS[num % BASE] + result;
    num = Math.floor(num / BASE);
  }
  return result;
}

/**
 * Converts a base62 string back into its original integer.
 * e.g. decode("21") -> 125
 */
export function decode(str) {
  let num = 0;
  for (const char of str) {
    num = num * BASE + CHARS.indexOf(char);
  }
  return num;
}
