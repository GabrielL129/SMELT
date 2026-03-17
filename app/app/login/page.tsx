"use client";

import { usePrivy } from "@privy-io/react-auth";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import styles from "./login.module.css";

export default function LoginPage() {
  const { ready, authenticated, login } = usePrivy();
  const router = useRouter();

  useEffect(() => {
    if (ready && authenticated) {
      router.push("/app/dashboard");
    }
  }, [ready, authenticated, router]);

  return (
    <div className={styles.page + " scanlines"}>
      <div className={styles.bgGrid} />
      <div className={styles.bgGlow} />

      <div className={styles.container}>
        <div className={styles.logo}>
          <span className={styles.logoText}>SMELT</span>
          <span className={styles.logoSub}>AUTONOMOUS FOUNDRY PROTOCOL</span>
        </div>

        <div className={styles.panel}>
          <div className={styles.panelHeader}>
            <div className={styles.panelHeaderDot} />
            <span>OPERATOR AUTHENTICATION</span>
          </div>

          <div className={styles.panelBody}>
            <div className={styles.terminalLine}>
              <span className={styles.terminalPrompt}>&gt;</span>
              <span className={styles.terminalText}>FOUNDRY ACCESS REQUIRED</span>
            </div>
            <div className={styles.terminalLine}>
              <span className={styles.terminalPrompt}>&gt;</span>
              <span className={styles.terminalText}>CONNECT WALLET TO AUTHENTICATE</span>
            </div>
            <div className={styles.terminalLine}>
              <span className={styles.terminalPrompt}>&gt;</span>
              <span className={styles.terminalCursor}>_</span>
            </div>

            <button
              className={styles.connectBtn}
              onClick={login}
              disabled={!ready}
            >
              {!ready ? (
                "INITIALIZING..."
              ) : (
                <>
                  <span className={styles.connectIcon}>⬡</span>
                  CONNECT WALLET
                </>
              )}
            </button>

            <p className={styles.note}>
              Supported: MetaMask, Coinbase Wallet, WalletConnect, and more.
            </p>
          </div>
        </div>

        <div className={styles.footer}>
          <a href="/" className={styles.footerLink}>← BACK TO SMELT.WORLD</a>
          <span className={styles.footerDivider}>·</span>
          <span className={styles.footerVersion}>EPOCH 01 · v0.1.0</span>
        </div>
      </div>
    </div>
  );
}
