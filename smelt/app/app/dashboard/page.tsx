"use client";

import { usePrivy } from "@privy-io/react-auth";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import styles from "./dashboard.module.css";

import DashboardNav from "@/components/dashboard/DashboardNav";
import FoundryScene from "@/components/dashboard/FoundryScene";
import FoundryStatusPanel from "@/components/dashboard/FoundryStatusPanel";
import ActiveBatchPanel from "@/components/dashboard/ActiveBatchPanel";
import AgentPanel from "@/components/dashboard/AgentPanel";
import PlanningPanel from "@/components/dashboard/PlanningPanel";
import EventLog from "@/components/dashboard/EventLog";
import EpochPanel from "@/components/dashboard/EpochPanel";

// Mock data — replace with Supabase queries
import { MOCK_STATE } from "@/lib/mock/state";

export default function DashboardPage() {
  const { ready, authenticated } = usePrivy();
  const router = useRouter();

  useEffect(() => {
    if (ready && !authenticated) {
      router.push("/app/login");
    }
  }, [ready, authenticated, router]);

  if (!ready || !authenticated) {
    return (
      <div className={styles.loading}>
        <span className={styles.loadingText}>INITIALIZING FOUNDRY...</span>
      </div>
    );
  }

  return (
    <div className={styles.root + " scanlines"}>
      <DashboardNav agent={MOCK_STATE.agent} foundry={MOCK_STATE.foundry} />

      <div className={styles.layout}>
        {/* Left column */}
        <div className={styles.colLeft}>
          <FoundryStatusPanel foundry={MOCK_STATE.foundry} />
          <ActiveBatchPanel batch={MOCK_STATE.activeBatch} job={MOCK_STATE.activeJob} />
          <EpochPanel epoch={MOCK_STATE.epoch} globalEvent={MOCK_STATE.globalEvent} />
        </div>

        {/* Center — main scene */}
        <div className={styles.colCenter}>
          <FoundryScene agent={MOCK_STATE.agent} foundry={MOCK_STATE.foundry} />
          <EventLog events={MOCK_STATE.recentEvents} />
        </div>

        {/* Right column */}
        <div className={styles.colRight}>
          <AgentPanel agent={MOCK_STATE.agent} messages={MOCK_STATE.agentMessages} />
          <PlanningPanel plan={MOCK_STATE.agentPlan} />
        </div>
      </div>
    </div>
  );
}
