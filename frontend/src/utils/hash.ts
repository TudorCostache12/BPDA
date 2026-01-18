// Utilitar pentru calcularea hash-ului SHA-256 în browser

/**
 * Calculează hash-ul SHA-256 al unui fișier
 * @param file - Fișierul pentru care se calculează hash-ul
 * @returns Promise<string> - Hash-ul în format hexadecimal (64 caractere)
 */
export async function calculateFileHash(file: File): Promise<string> {
  const arrayBuffer = await file.arrayBuffer();
  const hashBuffer = await crypto.subtle.digest("SHA-256", arrayBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
  return hashHex;
}

/**
 * Calculează hash-ul SHA-256 al unui string
 * @param text - Textul pentru care se calculează hash-ul
 * @returns Promise<string> - Hash-ul în format hexadecimal
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
 * Validează dacă un string este un hash SHA-256 valid
 * @param hash - String-ul de verificat
 * @returns boolean - true dacă este un hash valid
 */
export function isValidSha256Hash(hash: string): boolean {
  return /^[a-f0-9]{64}$/i.test(hash);
}

/**
 * Formatează un hash pentru afișare (primii și ultimii 8 caractere)
 * @param hash - Hash-ul complet
 * @returns string - Hash-ul formatat
 */
export function formatHash(hash: string): string {
  if (hash.length !== 64) return hash;
  return `${hash.substring(0, 8)}...${hash.substring(56)}`;
}

/**
 * Convertește un timestamp UNIX în dată citibilă
 * @param timestamp - Timestamp UNIX în secunde
 * @returns string - Data formatată
 */
export function formatTimestamp(timestamp: number): string {
  if (timestamp === 0) return "N/A";
  const date = new Date(timestamp * 1000);
  return date.toLocaleString("ro-RO", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/**
 * Formatează o adresă pentru afișare
 * @param address - Adresa completă
 * @returns string - Adresa formatată
 */
export function formatAddress(address: string): string {
  if (address.length < 20) return address;
  return `${address.substring(0, 10)}...${address.substring(address.length - 6)}`;
}
