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
      setError("Error calculating hash.");
      console.error(err);
    } finally {
      setIsCalculating(false);
    }
  }, []);

  const handleVerify = useCallback(async () => {
    const hashToVerify = verifyMode === "file" ? currentHash : hashInput.trim().toLowerCase();

    if (!hashToVerify) {
      setError("Select a file or enter a hash.");
      return;
    }

    if (!isValidSha256Hash(hashToVerify)) {
      setError("Invalid hash. Must be a SHA-256 hash (64 hex characters).");
      return;
    }

    setIsVerifying(true);
    setError(null);
    setResult(null);

    try {
      const verificationResult = await onVerify(hashToVerify);
      setResult(verificationResult);
    } catch (err) {
      setError(`Verification error: ${err instanceof Error ? err.message : "Unknown"}`);
    } finally {
      setIsVerifying(false);
    }
  }, [verifyMode, currentHash, hashInput, onVerify]);

  return (
    <div className="card">
      <h2>🔍 Verify Document</h2>
      <p className="description">
        Check if a document has been registered on the blockchain.
      </p>

      <div className="mode-toggle">
        <button
          className={`toggle-btn ${verifyMode === "file" ? "active" : ""}`}
          onClick={() => { setVerifyMode("file"); setResult(null); setError(null); }}
        >
          Verify with File
        </button>
        <button
          className={`toggle-btn ${verifyMode === "hash" ? "active" : ""}`}
          onClick={() => { setVerifyMode("hash"); setResult(null); setError(null); }}
        >
          Verify with Hash
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
            {file ? file.name : "Select file"}
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
            placeholder="Enter SHA-256 hash (64 characters)"
            value={hashInput}
            onChange={(e) => setHashInput(e.target.value)}
            maxLength={64}
          />
        </div>
      )}

      {isCalculating && <p className="loading">Calculating hash...</p>}

      {error && <div className="message error">{error}</div>}

      <button
        className="btn secondary"
        onClick={handleVerify}
        disabled={isVerifying || isCalculating || (verifyMode === "file" ? !currentHash : !hashInput)}
      >
        {isVerifying ? "Verifying..." : "Verify"}
      </button>

      {result && (
        <div className={`verification-result ${result.exists ? (result.isRevoked ? "revoked" : "valid") : "not-found"}`}>
          {result.exists ? (
            result.isRevoked ? (
              <>
                <div className="result-icon">⚠️</div>
                <h3>Document Revoked</h3>
                <p>This document was registered but later revoked by the owner.</p>
                <div className="result-details">
                  <p><strong>Owner:</strong> <span title={result.owner}>{formatAddress(result.owner)}</span></p>
                  <p><strong>Registration Date:</strong> {formatTimestamp(result.timestamp)}</p>
                </div>
              </>
            ) : (
              <>
                <div className="result-icon">✅</div>
                <h3>Valid Document</h3>
                <p>This document is registered on the blockchain.</p>
                <div className="result-details">
                  <p><strong>Owner:</strong> <span title={result.owner}>{formatAddress(result.owner)}</span></p>
                  <p><strong>Registration Date:</strong> {formatTimestamp(result.timestamp)}</p>
                </div>
              </>
            )
          ) : (
            <>
              <div className="result-icon">❌</div>
              <h3>Document Not Registered</h3>
              <p>This document was not found on the blockchain.</p>
            </>
          )}
        </div>
      )}
    </div>
  );
}
