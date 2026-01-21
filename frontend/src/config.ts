// Configuration for the Document Verification application
export const config = {
  // Contract address on Devnet - DEPLOYED!
  contractAddress: "erd1qqqqqqqqqqqqqpgqctlge8fuxrl0ptzg2vj5gwy4h645lmr68pnsyc57wa",
  
  // API and Explorer URLs
  apiUrl: "https://devnet-api.multiversx.com",
  explorerUrl: "https://devnet-explorer.multiversx.com",
  
  // Chain ID for Devnet
  chainId: "D",
  
  // Wallet Connect Project ID (optional, for xPortal)
  walletConnectV2ProjectId: "",
  
  // Contract endpoints
  endpoints: {
    registerDocument: "registerDocument",
    verifyDocument: "verifyDocument",
    revokeDocument: "revokeDocument",
    getUserDocuments: "getUserDocuments",
    getTotalDocuments: "getTotalDocuments",
  },
};

// Environment configuration
export const dAppConfig = {
  network: {
    id: "devnet",
    name: "Devnet",
    egldLabel: "xEGLD",
    walletAddress: "https://devnet-wallet.multiversx.com",
    apiAddress: "https://devnet-api.multiversx.com",
    gatewayAddress: "https://devnet-gateway.multiversx.com",
    explorerAddress: "https://devnet-explorer.multiversx.com",
  },
};
