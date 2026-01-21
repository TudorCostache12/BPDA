// Utility for calculating SHA-256 hash in browser

/**
 * Calculates the SHA-256 hash of a file
 * @param file - The file to calculate the hash for
 * @returns Promise<string> - The hash in hexadecimal format (64 characters)
 */
export async function calculateFileHash(file: File): Promise<string> {
  const arrayBuffer = await file.arrayBuffer();
  const hashBuffer = await crypto.subtle.digest("SHA-256", arrayBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
  return hashHex;
}

/**
 * Calculates the SHA-256 hash of a string
 * @param text - The text to calculate the hash for
 * @returns Promise<string> - The hash in hexadecimal format
 */
export async function calculateTextHash(text: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(text);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
  return hashHex;
}

/**
 * Validates if a string is a valid SHA-256 hash
 * @param hash - The string to validate
 * @returns boolean - true if it's a valid hash
 */
export function isValidSha256Hash(hash: string): boolean {
  return /^[a-f0-9]{64}$/i.test(hash);
}

/**
 * Formats a hash for display (first and last 8 characters)
 * @param hash - The complete hash
 * @returns string - The formatted hash
 */
export function formatHash(hash: string): string {
  if (hash.length !== 64) return hash;
  return `${hash.substring(0, 8)}...${hash.substring(56)}`;
}

/**
 * Converts a UNIX timestamp to a readable date
 * @param timestamp - UNIX timestamp in seconds
 * @returns string - The formatted date
 */
export function formatTimestamp(timestamp: number): string {
  if (timestamp === 0) return "N/A";
  const date = new Date(timestamp * 1000);
  return date.toLocaleString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/**
 * Formats an address for display
 * @param address - The complete address
 * @returns string - The formatted address
 */
export function formatAddress(address: string): string {
  if (address.length < 20) return address;
  return `${address.substring(0, 10)}...${address.substring(address.length - 6)}`;
}
