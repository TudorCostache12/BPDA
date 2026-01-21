import { useState, useCallback } from "react";
import { calculateFileHash, formatHash } from "../utils/hash";

interface RegisterDocumentProps {
  isConnected: boolean;
  onRegister: (hash: string) => Promise<void>;
}

export function RegisterDocument({ isConnected, onRegister }: RegisterDocumentProps) {
  const [file, setFile] = useState<File | null>(null);
  const [hash, setHash] = useState<string>("");
  const [isCalculating, setIsCalculating] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error" | "info"; text: string } | null>(null);

  const handleFileChange = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    setFile(selectedFile);
    setHash("");
    setMessage(null);
    setIsCalculating(true);

    try {
      const calculatedHash = await calculateFileHash(selectedFile);
      setHash(calculatedHash);
    } catch (error) {
      setMessage({ type: "error", text: "Error calculating hash." });
      console.error(error);
    } finally {
      setIsCalculating(false);
    }
  }, []);

  const handleRegister = useCallback(async () => {
    if (!hash || !isConnected) return;

    setIsRegistering(true);
    setMessage(null);

    try {
      await onRegister(hash);
      setMessage({ type: "success", text: "Document successfully registered on blockchain!" });
    } catch (error) {
      setMessage({ type: "error", text: `Error: ${error instanceof Error ? error.message : "Unknown"}` });
    } finally {
      setIsRegistering(false);
    }
  }, [hash, isConnected, onRegister]);

  return (
    <div className="card">
      <h2>📄 Register Document</h2>
      <p className="description">
        Select a file to calculate its digital fingerprint (SHA-256 hash) and register it on the blockchain.
        <strong> The file never leaves your computer.</strong>
      </p>

      <div className="file-upload">
        <input
          type="file"
          id="file-input"
          onChange={handleFileChange}
          disabled={isCalculating || isRegistering}
        />
        <label htmlFor="file-input" className="file-label">
          {file ? file.name : "Select file"}
        </label>
      </div>

      {isCalculating && <p className="loading">Calculating hash...</p>}

      {hash && (
        <div className="hash-result">
          <label>Hash SHA-256:</label>
          <code className="hash-code" title={hash}>
            {hash}
          </code>
          <span className="hash-short">({formatHash(hash)})</span>
        </div>
      )}

      {message && (
        <div className={`message ${message.type}`}>
          {message.text}
        </div>
      )}

      <button
        className="btn primary"
        onClick={handleRegister}
        disabled={!hash || !isConnected || isRegistering}
      >
        {isRegistering ? "Registering..." : "Register on Blockchain"}
      </button>

      {!isConnected && (
        <p className="warning">Connect your wallet to register documents.</p>
      )}
    </div>
  );
}
