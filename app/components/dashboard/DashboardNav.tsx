"use client";

import { usePrivy } from "@privy-io/react-auth";
import styles from "./DashboardNav.module.css";
import type { Agent, Foundry } from "@/lib/supabase/types";

interface Props {
  agent: Agent;
  foundry: Foundry;
}

const STATE_COLORS: Record<string, string> = {
  idle: "dim", scanning: "blue", hauling: "amber",
  smelting: "furnace", purging: "amber", repairing: "amber",
  overheated: "red", alert: "red",
};

export default function DashboardNav({ agent, foundry }: Props) {
  const { logout, user } = usePrivy();
  const stateColor = STATE_COLORS[agent.state] || "dim";
  const wallet = user?.wallet?.address
    ? `${user.wallet.address.slice(0, 6)}...${user.wallet.address.slice(-4)}`
    : "CONNECTED";

  return (
    <nav className={styles.nav}>
      <div className={styles.left}>
        <span className={styles.logo}>SMELT</span>
        <div className={styles.divider} />
        <div className={styles.foundryInfo}>
          <span className={styles.foundryName}>{foundry.name}</span>
          <span className={styles.foundryStatus}>
            <span className={`${styles.statusDot} ${styles[`dot_${foundry.status}`]}`} />
            {foundry.status.toUpperCase()}
          </span>
        </div>
      </div>

      <div className={styles.center}>
        <div className={styles.agentBadge}>
          <span className={`${styles.agentState} ${styles[`agentState_${stateColor}`]}`}>
            {agent.state.toUpperCase()}
          </span>
          <span className={styles.agentName}>{agent.name}</span>
          <span className={styles.agentMode}>{agent.mode.toUpperCase()} MODE</span>
        </div>
      </div>

      <div className={styles.right}>
        <div className={styles.walletBadge}>
          <span className={styles.walletIcon}>⬡</span>
          <span className={styles.walletAddr}>{wallet}</span>
        </div>
        <button className={styles.logoutBtn} onClick={logout}>
          DISCONNECT
        </button>
      </div>
    </nav>
  );
}
