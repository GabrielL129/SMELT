import styles from "./EpochPanel.module.css";
import type { Epoch, GlobalEvent } from "@/lib/supabase/types";

interface Props {
  epoch: Epoch;
  globalEvent: GlobalEvent | null;
}

export default function EpochPanel({ epoch, globalEvent }: Props) {
  return (
    <div className={styles.panel}>
      <div className={styles.header}>
        <span className={styles.headerTitle}>EPOCH / CYCLE</span>
      </div>

      <div className={styles.body}>
        {/* Epoch */}
        <div className={styles.epochRow}>
          <div className={styles.epochNum}>
            <span className={styles.epochNumLabel}>EPOCH</span>
            <span className={styles.epochNumValue}>
              {String(epoch.epoch_number).padStart(2, "0")}
            </span>
          </div>
          <div className={styles.epochInfo}>
            <span className={styles.epochName}>{epoch.label}</span>
            <div className={styles.epochPressureRow}>
              <span className={styles.epochPressureLabel}>GLOBAL PRESSURE</span>
              <div className={styles.epochPressureBar}>
                <div
                  className={styles.epochPressureFill}
                  style={{ width: `${epoch.global_pressure}%` }}
                />
              </div>
              <span className={`${styles.epochPressureValue} ${epoch.global_pressure > 70 ? styles.pressureHigh : ""}`}>
                {epoch.global_pressure}%
              </span>
            </div>
          </div>
        </div>

        {/* Totals */}
        <div className={styles.totalsRow}>
          <div className={styles.total}>
            <span className={styles.totalLabel}>TOTAL SCRAP</span>
            <span className={styles.totalValue}>{epoch.total_scrap_processed.toLocaleString()}<span className={styles.totalUnit}>T</span></span>
          </div>
          <div className={styles.totalDivider} />
          <div className={styles.total}>
            <span className={styles.totalLabel}>TOTAL REFINED</span>
            <span className={`${styles.totalValue} ${styles.totalAccent}`}>
              {epoch.total_refined_output.toLocaleString()}<span className={styles.totalUnit}>T</span>
            </span>
          </div>
        </div>

        {/* Global event */}
        {globalEvent && globalEvent.active && (
          <div className={styles.globalEvent}>
            <div className={styles.globalEventHeader}>
              <span className={styles.globalEventBadge}>GLOBAL EVENT</span>
            </div>
            <span className={styles.globalEventTitle}>{globalEvent.title}</span>
            <p className={styles.globalEventDesc}>{globalEvent.description}</p>
          </div>
        )}
      </div>
    </div>
  );
}
