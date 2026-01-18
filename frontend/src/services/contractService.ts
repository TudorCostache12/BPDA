import { config } from "../config";

// Interfață pentru rezultatul verificării
export interface VerificationResult {
  exists: boolean;
  owner: string;
  timestamp: number;
  isRevoked: boolean;
}

/**
 * Convertește hex în număr
 */
function hexToNumber(hex: string): number {
  if (!hex || hex === "") return 0;
  return parseInt(hex, 16) || 0;
}

/**
 * Convertește string hex în bytes și apoi în base64
 * Necesar pentru a trimite hash-ul corect la API
 */
function hexToBase64(hex: string): string {
  const bytes = new Uint8Array(hex.match(/.{1,2}/g)!.map(byte => parseInt(byte, 16)));
  let binary = '';
  bytes.forEach(b => binary += String.fromCharCode(b));
  return btoa(binary);
}

/**
 * Verifică un document pe blockchain folosind API-ul MultiversX
 */
export async function verifyDocument(hash: string): Promise<VerificationResult> {
  try {
    console.log("Verifying hash:", hash);
    
    // Construiește URL-ul pentru query VM
    const url = `${config.apiUrl}/query`;
    
    // Hash-ul vine ca hex string (64 caractere), trebuie trimis direct ca hex
    const requestBody = {
      scAddress: config.contractAddress,
      funcName: config.endpoints.verifyDocument,
      args: [hash], // API-ul acceptă hex direct
    };

    console.log("Request body:", requestBody);

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      console.error("Query failed:", response.status, response.statusText);
      return { exists: false, owner: "", timestamp: 0, isRevoked: false };
    }

    const result = await response.json();
    console.log("Query result:", result);
    
    // Parse rezultatul - API-ul returnează direct returnData
    const returnData = result.returnData || (result.data && result.data.returnData);
    
    if (returnData && returnData.length >= 4) {
      // Decodează din base64
      const existsRaw = atob(returnData[0] || "");
      const ownerRaw = atob(returnData[1] || "");
      const timestampRaw = atob(returnData[2] || "");
      const revokedRaw = atob(returnData[3] || "");
      
      console.log("Decoded values:", {
        existsRaw: existsRaw.length > 0 ? existsRaw.charCodeAt(0) : "empty",
        ownerRawLength: ownerRaw.length,
        timestampRawLength: timestampRaw.length,
        revokedRaw: revokedRaw.length > 0 ? revokedRaw.charCodeAt(0) : "empty"
      });
      
      const exists = existsRaw.length > 0 && existsRaw.charCodeAt(0) === 1;
      
      // Convertește owner din bytes în adresă
      let owner = "";
      if (ownerRaw.length === 32) {
        const ownerHex = Array.from(ownerRaw)
          .map(c => c.charCodeAt(0).toString(16).padStart(2, "0"))
          .join("");
        owner = `erd1...${ownerHex.slice(-8)}`;
      }
      
      // Timestamp
      let timestamp = 0;
      if (timestampRaw.length > 0) {
        const timestampHex = Array.from(timestampRaw)
          .map(c => c.charCodeAt(0).toString(16).padStart(2, "0"))
          .join("");
        timestamp = hexToNumber(timestampHex);
      }
      
      const isRevoked = revokedRaw.length > 0 && revokedRaw.charCodeAt(0) === 1;
      
      console.log("Parsed result:", { exists, owner, timestamp, isRevoked });
      return { exists, owner, timestamp, isRevoked };
    }
    
    return { exists: false, owner: "", timestamp: 0, isRevoked: false };
  } catch (error) {
    console.error("Error querying contract:", error);
    return { exists: false, owner: "", timestamp: 0, isRevoked: false };
  }
}

/**
 * Obține numărul total de documente înregistrate
 */
export async function getTotalDocuments(): Promise<number> {
  try {
    // Folosim același endpoint /query ca și pentru verificare
    const url = `${config.apiUrl}/query`;
    
    const requestBody = {
      scAddress: config.contractAddress,
      funcName: config.endpoints.getTotalDocuments,
      args: [],
    };

    console.log("Getting total documents...");

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      console.error("getTotalDocuments failed:", response.status);
      return 0;
    }

    const result = await response.json();
    console.log("Total documents result:", result);
    
    // Parse rezultatul - API-ul returnează direct returnData
    const returnData = result.returnData || (result.data && result.data.returnData);
    
    if (returnData && returnData.length > 0 && returnData[0]) {
      const raw = atob(returnData[0]);
      console.log("Raw total:", raw, "length:", raw.length);
      
      if (raw.length > 0) {
        // Convertește bytes în număr
        let num = 0;
        for (let i = 0; i < raw.length; i++) {
          num = num * 256 + raw.charCodeAt(i);
        }
        console.log("Parsed total:", num);
        return num;
      }
    }
    
    return 0;
  } catch (error) {
    console.error("Error getting total documents:", error);
    return 0;
  }
}

/**
 * Construiește datele tranzacției pentru înregistrarea unui document
 */
export function buildRegisterDocumentData(hash: string): string {
  return `${config.endpoints.registerDocument}@${hash}`;
}

/**
 * Construiește datele tranzacției pentru revocarea unui document
 */
export function buildRevokeDocumentData(hash: string): string {
  return `${config.endpoints.revokeDocument}@${hash}`;
}
