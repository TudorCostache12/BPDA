import { useState, useCallback } from "react";
import { calculateFileHash, isValidSha256Hash, formatTimestamp, formatAddress } from "../utils/hash";

interface VerificationResult {
  exists: boolean;
  owner: string;
  timestamp: number;
  isRevoked: boolean;
}

interface VerifyDocumentProps {
  onVerify: (hash: string) => Promise<VerificationResult>;
}

export function VerifyDocument({ onVerify }: VerifyDocumentProps) {
  const [verifyMode, setVerifyMode] = useState<"file" | "hash">("file");
  const [file, setFile] = useState<File | null>(null);
  const [hashInput, setHashInput] = useState("");
  const [currentHash, setCurrentHash] = useState("");
  const [isCalculating, setIsCalculating] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [result, setResult] = useState<VerificationResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    setFile(selectedFile);
    setResult(null);
    setError(null);
    setIsCalculating(true);

    try {
      const hash = await calculateFileHash(selectedFile);
      setCurrentHash(hash);
    } catch (err) {
      setError("Eroare la calcularea hash-ului.");
      console.error(err);
    } finally {
      setIsCalculating(false);
    }
  }, []);

  const handleVerify = useCallback(async () => {
    const hashToVerify = verifyMode === "file" ? currentHash : hashInput.trim().toLowerCase();

    if (!hashToVerify) {
      setError("Selectează un fișier sau introdu un hash.");
      return;
    }

    if (!isValidSha256Hash(hashToVerify)) {
      setError("Hash invalid. Trebuie să fie un hash SHA-256 (64 caractere hex).");
      return;
    }

    setIsVerifying(true);
    setError(null);
    setResult(null);

    try {
      const verificationResult = await onVerify(hashToVerify);
      setResult(verificationResult);
    } catch (err) {
      setError(`Eroare la verificare: ${err instanceof Error ? err.message : "Necunoscută"}`);
    } finally {
      setIsVerifying(false);
    }
  }, [verifyMode, currentHash, hashInput, onVerify]);

  return (
    <div className="card">
      <h2>🔍 Verificare Document</h2>
      <p className="description">
        Verifică dacă un document a fost înregistrat pe blockchain.
      </p>

      <div className="mode-toggle">
        <button
          className={`toggle-btn ${verifyMode === "file" ? "active" : ""}`}
          onClick={() => { setVerifyMode("file"); setResult(null); setError(null); }}
        >
          Verifică cu Fișier
        </button>
        <button
          className={`toggle-btn ${verifyMode === "hash" ? "active" : ""}`}
          onClick={() => { setVerifyMode("hash"); setResult(null); setError(null); }}
        >
          Verifică cu Hash
        </button>
      </div>

      {verifyMode === "file" ? (
        <div className="file-upload">
          <input
            type="file"
            id="verify-file-input"
            onChange={handleFileChange}
            disabled={isCalculating || isVerifying}
          />
          <label htmlFor="verify-file-input" className="file-label">
            {file ? file.name : "Selectează fișier"}
          </label>
          {currentHash && (
            <div className="hash-preview">
              <small>Hash: {currentHash.substring(0, 16)}...{currentHash.substring(48)}</small>
            </div>
          )}
        </div>
      ) : (
        <div className="hash-input">
          <input
            type="text"
            placeholder="Introdu hash-ul SHA-256 (64 caractere)"
            value={hashInput}
            onChange={(e) => setHashInput(e.target.value)}
            maxLength={64}
          />
        </div>
      )}

      {isCalculating && <p className="loading">Se calculează hash-ul...</p>}

      {error && <div className="message error">{error}</div>}

      <button
        className="btn secondary"
        onClick={handleVerify}
        disabled={isVerifying || isCalculating || (verifyMode === "file" ? !currentHash : !hashInput)}
      >
        {isVerifying ? "Se verifică..." : "Verifică"}
      </button>

      {result && (
        <div className={`verification-result ${result.exists ? (result.isRevoked ? "revoked" : "valid") : "not-found"}`}>
          {result.exists ? (
            result.isRevoked ? (
              <>
                <div className="result-icon">⚠️</div>
                <h3>Document Revocat</h3>
                <p>Acest document a fost înregistrat dar ulterior revocat de proprietar.</p>
                <div className="result-details">
                  <p><strong>Proprietar:</strong> <span title={result.owner}>{formatAddress(result.owner)}</span></p>
                  <p><strong>Data înregistrării:</strong> {formatTimestamp(result.timestamp)}</p>
                </div>
              </>
            ) : (
              <>
                <div className="result-icon">✅</div>
                <h3>Document Valid</h3>
                <p>Acest document este înregistrat pe blockchain.</p>
                <div className="result-details">
                  <p><strong>Proprietar:</strong> <span title={result.owner}>{formatAddress(result.owner)}</span></p>
                  <p><strong>Data înregistrării:</strong> {formatTimestamp(result.timestamp)}</p>
                </div>
              </>
            )
          ) : (
            <>
              <div className="result-icon">❌</div>
              <h3>Document Neînregistrat</h3>
              <p>Acest document nu a fost găsit pe blockchain.</p>
            </>
          )}
        </div>
      )}
    </div>
  );
}
