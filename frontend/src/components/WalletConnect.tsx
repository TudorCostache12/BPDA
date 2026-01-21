import { formatAddress } from "../utils/hash";

interface WalletConnectProps {
  isConnected: boolean;
  address: string | null;
  onConnect: () => void;
  onDisconnect: () => void;
}

export function WalletConnect({ isConnected, address, onConnect, onDisconnect }: WalletConnectProps) {
  return (
    <div className="wallet-connect">
      {isConnected && address ? (
        <div className="wallet-info">
          <span className="wallet-address" title={address}>
            🟢 {formatAddress(address)}
          </span>
          <button className="btn disconnect" onClick={onDisconnect}>
            Disconnect
          </button>
        </div>
      ) : (
        <button className="btn connect" onClick={onConnect}>
          🔗 Connect Wallet
        </button>
      )}
    </div>
  );
}
