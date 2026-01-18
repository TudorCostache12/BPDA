import { useState, useCallback, useEffect } from "react";
import { RegisterDocument, VerifyDocument, WalletConnect } from "./components";
import { verifyDocument, buildRegisterDocumentData, getTotalDocuments } from "./services";
import { config } from "./config";
import "./App.css";

function App() {
  const [isConnected, setIsConnected] = useState(false);
  const [address, setAddress] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"register" | "verify">("register");
  const [totalDocs, setTotalDocs] = useState<number>(0);

  // Fetch total documents on load
  useEffect(() => {
    const fetchTotal = async () => {
      try {
        const total = await getTotalDocuments();
        setTotalDocs(total);
      } catch (e) {
        console.error("Error fetching total:", e);
      }
    };
    fetchTotal();
  }, []);

  // Handler pentru conectarea portofelului
  const handleConnect = useCallback(async () => {
    // Redirect la Web Wallet pentru autentificare
    const callbackUrl = encodeURIComponent(window.location.origin + "/auth");
    window.location.href = `https://devnet-wallet.multiversx.com/hook/login?callbackUrl=${callbackUrl}`;
  }, []);

  // Verifică dacă utilizatorul s-a autentificat sau a finalizat o tranzacție
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const addressParam = urlParams.get("address");
    const statusParam = urlParams.get("status");
    const txHashParam = urlParams.get("txHash");
    const actionParam = urlParams.get("action");
    
    // Gestionare login
    if (addressParam) {
      setAddress(addressParam);
      setIsConnected(true);
      localStorage.setItem("walletAddress", addressParam);
      window.history.replaceState({}, document.title, window.location.pathname);
    } else {
      const savedAddress = localStorage.getItem("walletAddress");
      if (savedAddress) {
        setAddress(savedAddress);
        setIsConnected(true);
      }
    }

    // Gestionare status tranzacție
    if (statusParam && txHashParam) {
      if (statusParam === "success") {
        alert(`Tranzacție trimisă cu succes!\nHash: ${txHashParam}\nAșteaptă câteva secunde pentru confirmare.`);
        // Dacă a fost o înregistrare, reîmprospătează totalul
        if (actionParam === "register") {
          setTimeout(() => {
             getTotalDocuments().then(setTotalDocs);
          }, 6000); // Așteaptă 6 secunde pentru procesare pe blockchain
        }
      } else if (statusParam === "fail" || statusParam === "cancelled") {
        alert(`Tranzacție eșuată sau anulată.\nStatus: ${statusParam}`);
      }
      // Curăță URL-ul
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  // Handler pentru deconectare
  const handleDisconnect = useCallback(() => {
    setIsConnected(false);
    setAddress(null);
    localStorage.removeItem("walletAddress");
  }, []);

  // Handler pentru înregistrarea unui document
  const handleRegister = useCallback(async (hash: string) => {
    if (!address) throw new Error("Portofel neconectat");
    
    // Construiește datele tranzacției
    const data = buildRegisterDocumentData(hash);
    
    // Redirect la Web Wallet pentru semnare
    const txData = {
      receiver: config.contractAddress,
      value: "0",
      gasLimit: "10000000",
      data: data, // Datele trebuie trimise ca string simplu, nu Base64
    };
    
    const callbackUrl = encodeURIComponent(window.location.origin + "?action=register");
    const txUrl = `https://devnet-wallet.multiversx.com/hook/transaction?receiver=${txData.receiver}&value=${txData.value}&gasLimit=${txData.gasLimit}&data=${txData.data}&callbackUrl=${callbackUrl}`;
    
    window.location.href = txUrl;
  }, [address]);

  // Handler pentru verificarea unui document
  const handleVerify = useCallback(async (hash: string) => {
    return await verifyDocument(hash);
  }, []);

  return (
    <div className="app">
      <header className="header">
        <WalletConnect
          isConnected={isConnected}
          address={address}
          onConnect={handleConnect}
          onDisconnect={handleDisconnect}
        />
      </header>

      <main className="main">
        <div className="stats">
          <div className="stat-item">
            <span className="stat-value">{totalDocs}</span>
            <span className="stat-label">Documente Înregistrate</span>
          </div>
          <div className="stat-item">
            <span className="stat-value">Devnet</span>
            <span className="stat-label">Rețea</span>
          </div>
        </div>

        <div className="tabs">
          <button
            className={`tab ${activeTab === "register" ? "active" : ""}`}
            onClick={() => setActiveTab("register")}
          >
            📄 Înregistrare
          </button>
          <button
            className={`tab ${activeTab === "verify" ? "active" : ""}`}
            onClick={() => setActiveTab("verify")}
          >
            🔍 Verificare
          </button>
        </div>

        <div className="tab-content">
          {activeTab === "register" ? (
            <RegisterDocument isConnected={isConnected} onRegister={handleRegister} />
          ) : (
            <VerifyDocument onVerify={handleVerify} />
          )}
        </div>
      </main>

      <footer className="footer">
        <p>
          Contract: <a href={`${config.explorerUrl}/accounts/${config.contractAddress}`} target="_blank" rel="noopener">
            {config.contractAddress.substring(0, 20)}...
          </a>
        </p>
      </footer>
    </div>
  );
}

export default App;

