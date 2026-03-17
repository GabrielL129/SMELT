import styles from "./FoundryStatusPanel.module.css";
import type { Foundry } from "@/lib/supabase/types";

interface Props {
  foundry: Foundry;
}

function GaugeBar({
  label, value, max = 100, unit = "%", warn = 70, critical = 85, invert = false
}: {
  label: string; value: number; max?: number; unit?: string;
  warn?: number; critical?: number; invert?: boolean;
}) {
  const pct = Math.min((value / max) * 100, 100);
  const isWarn = invert ? pct < 100 - warn : pct >= warn;
  const isCrit = invert ? pct < 100 - critical : pct >= critical;

  return (
    <div className={styles.gauge}>
      <div className={styles.gaugeHeader}>
        <span className={styles.gaugeLabel}>{label}</span>
        <span className={`${styles.gaugeValue} ${isCrit ? styles.valueCrit : isWarn ? styles.valueWarn : ""}`}>
          {typeof value === "number" ? value.toFixed(value % 1 === 0 ? 0 : 1) : value}{unit}
        </span>
      </div>
      <div className={styles.gaugeTrack}>
        <div
          className={`${styles.gaugeFill} ${isCrit ? styles.fillCrit : isWarn ? styles.fillWarn : styles.fillNormal}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

function formatUptime(seconds: number): string {
  const d = Math.floor(seconds / 86400);
  const h = Math.floor((seconds % 86400) / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  return `${d}D ${h}H ${m}M`;
}

export default function FoundryStatusPanel({ foundry }: Props) {
  return (
    <div className={styles.panel}>
      <div className={styles.header}>
        <span className={styles.headerTitle}>FOUNDRY STATUS</span>
        <span className={`${styles.headerMode} ${styles[`mode_${foundry.furnace_mode}`]}`}>
          {foundry.furnace_mode.toUpperCase()}
        </span>
      </div>

      <div className={styles.body}>
        <GaugeBar label="HEAT INDEX" value={foundry.heat} warn={70} critical={85} />
        <GaugeBar label="FUEL LEVEL" value={foundry.fuel} warn={30} critical={15} invert />
        <GaugeBar label="PURITY SCORE" value={foundry.purity_score} warn={60} critical={40} invert />

        <div className={styles.divider} />

        <div className={styles.statsGrid}>
          <div className={styles.stat}>
            <span className={styles.statLabel}>SCRAP STOCK</span>
            <span className={styles.statValue}>{foundry.scrap_stockpile.toLocaleString()}<span className={styles.statUnit}>kg</span></span>
          </div>
          <div className={styles.stat}>
            <span className={styles.statLabel}>SLAG ACCUM.</span>
            <span className={`${styles.statValue} ${foundry.slag_accumulation > 1000 ? styles.statWarn : ""}`}>
              {foundry.slag_accumulation.toLocaleString()}<span className={styles.statUnit}>kg</span>
            </span>
          </div>
          <div className={styles.stat}>
            <span className={styles.statLabel}>REFINED OUT</span>
            <span className={`${styles.statValue} ${styles.statAccent}`}>
              {foundry.refined_output.toLocaleString()}<span className={styles.statUnit}>kg</span>
            </span>
          </div>
          <div className={styles.stat}>
            <span className={styles.statLabel}>UPTIME</span>
            <span className={styles.statValue}>{formatUptime(foundry.uptime_seconds)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
