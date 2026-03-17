"use client";

import { useState, useEffect } from "react";
import styles from "./ActiveBatchPanel.module.css";
import type { ScrapBatch, BatchJob } from "@/lib/supabase/types";

interface Props {
  batch: ScrapBatch | null;
  job: BatchJob | null;
}

function useCountdown(target: string | null) {
  const [remaining, setRemaining] = useState("");

  useEffect(() => {
    if (!target) return;
    const tick = () => {
      const diff = new Date(target).getTime() - Date.now();
      if (diff <= 0) { setRemaining("COMPLETE"); return; }
      const m = Math.floor(diff / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      setRemaining(`${m}M ${String(s).padStart(2, "0")}S`);
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [target]);

  return remaining;
}

function useProgress(start: string | null, end: string | null) {
  const [pct, setPct] = useState(0);

  useEffect(() => {
    if (!start || !end) return;
    const tick = () => {
      const total = new Date(end).getTime() - new Date(start).getTime();
      const elapsed = Date.now() - new Date(start).getTime();
      setPct(Math.min((elapsed / total) * 100, 100));
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [start, end]);

  return pct;
}

export default function ActiveBatchPanel({ batch, job }: Props) {
  const eta = useCountdown(job?.estimated_completion ?? null);
  const progress = useProgress(job?.started_at ?? null, job?.estimated_completion ?? null);

  if (!batch || !job) {
    return (
      <div className={styles.panel}>
        <div className={styles.header}>
          <span className={styles.headerTitle}>ACTIVE BATCH</span>
          <span className={styles.headerStatus}>NO BATCH</span>
        </div>
        <div className={styles.empty}>
          <span className={styles.emptyText}>INTAKE QUEUE EMPTY</span>
          <span className={styles.emptySubtext}>AWAITING SCRAP INTAKE</span>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.panel}>
      <div className={styles.header}>
        <span className={styles.headerTitle}>ACTIVE BATCH</span>
        <span className={`${styles.headerStatus} ${styles[`status_${job.status}`]}`}>
          {job.status.toUpperCase()}
        </span>
      </div>

      <div className={styles.body}>
        {/* Batch ID */}
        <div className={styles.batchId}>
          <span className={styles.batchCode}>{batch.batch_code}</span>
          <span className={styles.batchOrigin}>{batch.origin ?? "UNKNOWN ORIGIN"}</span>
        </div>

        {/* Progress bar */}
        <div className={styles.progressSection}>
          <div className={styles.progressHeader}>
            <span className={styles.progressLabel}>SMELT PROGRESS</span>
            <span className={styles.progressPct}>{Math.round(progress)}%</span>
          </div>
          <div className={styles.progressTrack}>
            <div
              className={styles.progressFill}
              style={{ width: `${progress}%` }}
            />
            <div className={styles.progressGlow} style={{ left: `${progress}%` }} />
          </div>
        </div>

        {/* Stats grid */}
        <div className={styles.statsGrid}>
          <div className={styles.stat}>
            <span className={styles.statLabel}>SCRAP WEIGHT</span>
            <span className={styles.statValue}>{batch.scrap_weight.toLocaleString()}<span className={styles.statUnit}>kg</span></span>
          </div>
          <div className={styles.stat}>
            <span className={styles.statLabel}>IMPURITY</span>
            <span className={`${styles.statValue} ${batch.impurity_level > 30 ? styles.statWarn : ""}`}>
              {batch.impurity_level}<span className={styles.statUnit}>%</span>
            </span>
          </div>
          <div className={styles.stat}>
            <span className={styles.statLabel}>THERMAL DIFF.</span>
            <span className={styles.statValue}>{batch.thermal_difficulty}<span className={styles.statUnit}>/10</span></span>
          </div>
          <div className={styles.stat}>
            <span className={styles.statLabel}>EXPECTED YIELD</span>
            <span className={`${styles.statValue} ${styles.statAccent}`}>
              {job.expected_yield.toLocaleString()}<span className={styles.statUnit}>kg</span>
            </span>
          </div>
        </div>

        {/* ETA */}
        <div className={styles.etaRow}>
          <span className={styles.etaLabel}>ETA COMPLETION</span>
          <span className={styles.etaValue}>{eta || "CALCULATING..."}</span>
        </div>
      </div>
    </div>
  );
}
