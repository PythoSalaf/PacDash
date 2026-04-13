import { useDispatch } from "react-redux";
import { useWallet } from "@solana/wallet-adapter-react";
import { useWalletModal } from "@solana/wallet-adapter-react-ui";
import { useEffect } from "react";
import { connectWallet, disconnectWallet } from "../features/walletSlice";
import { LuShield } from "react-icons/lu";
import { FiArrowRight } from "react-icons/fi";
import { motion } from "framer-motion";

const ConnectWalletGate = ({ children, icon: Icon = LuShield, title }) => {
  const dispatch = useDispatch();
  const { publicKey, connected, disconnect, wallet } = useWallet();
  const { setVisible } = useWalletModal();

  // Sync wallet state into Redux
  useEffect(() => {
    if (connected && publicKey) {
      dispatch(
        connectWallet({
          address: publicKey.toBase58(),
          providerType: wallet?.adapter?.name?.toLowerCase() ?? "solana",
        })
      );
    } else {
      dispatch(disconnectWallet());
    }
  }, [connected, publicKey, wallet, dispatch]);

  // Loading — wallet adapter is initialising (autoConnect)
  if (wallet && !connected && publicKey === null) {
    return (
      <div className="flex items-center justify-center min-h-[55vh]">
        <div className="w-8 h-8 border-2 rounded-full border-primary border-t-transparent animate-spin" />
      </div>
    );
  }

  // ✅ Wallet connected — show the page
  if (connected && publicKey) return children;

  // 🔌 Not connected — show CTA
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center min-h-[55vh] text-center px-4"
    >
      <div className="flex items-center justify-center w-16 h-16 mb-5 border rounded-full bg-primary/10 border-primary/20">
        <Icon className="w-7 h-7 text-primary" />
      </div>

      <h3 className="mb-1 text-base font-bold font-display">
        Connect your Solana wallet
      </h3>

      <p className="max-w-xs mb-6 text-xs text-muted-foreground font-body">
        Sign in to view your {title ?? "personal data"}. Use Phantom, Solflare,
        or any Solana wallet.
      </p>

      <button
        onClick={() => setVisible(true)}
        className="flex items-center gap-2 px-8 py-3 text-sm transition-colors border rounded-xl bg-primary/10 border-primary text-primary font-body hover:bg-primary/20"
      >
        Connect Wallet <FiArrowRight className="w-4 h-4" />
      </button>

      <div className="mt-5 flex gap-4 text-[10px] text-muted-foreground font-mono">
        <span>👻 Phantom</span>
        <span>🌊 Solflare</span>
        <span>🔑 Any Solana wallet</span>
      </div>

      <p className="mt-3 text-[10px] text-muted-foreground font-mono max-w-xs">
        Read-only — your address is only used to fetch your Pacifica account data.
      </p>
    </motion.div>
  );
};

export default ConnectWalletGate;
