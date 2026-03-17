import styles from "./EventLog.module.css";
import type { EventLog as EventLogType } from "@/lib/supabase/types";

interface Props {
  events: EventLogType[];
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "NOW";
  if (m < 60) return `${m}M`;
  const h = Math.floor(m / 60);
  return `${h}H`;
}

const EVENT_ICONS: Record<string, string> = {
  batch_start: "▶",
  batch_complete: "✓",
  heat_alert: "⚠",
  purge: "◎",
  repair: "⚙",
  mode_change: "⇄",
  warning: "⚠",
  system: "◈",
  epoch: "⬡",
};

const SEVERITY_COLORS: Record<string, string> = {
  info: "info",
  warning: "warn",
  critical: "crit",
};

export default function EventLog({ events }: Props) {
  return (
    <div className={styles.panel}>
      <div className={styles.header}>
        <span className={styles.headerTitle}>EVENT LOG</span>
        <span className={styles.headerCount}>{events.length} RECENT</span>
      </div>

      <div className={styles.events}>
        {events.map((evt) => {
          const severity = SEVERITY_COLORS[evt.severity] || "info";
          const icon = EVENT_ICONS[evt.event_type] || "·";
          return (
            <div key={evt.id} className={`${styles.event} ${styles[`sev_${severity}`]}`}>
              <span className={styles.eventTime}>{timeAgo(evt.created_at)}</span>
              <span className={`${styles.eventIcon} ${styles[`icon_${severity}`]}`}>{icon}</span>
              <div className={styles.eventContent}>
                <span className={`${styles.eventType} ${styles[`type_${severity}`]}`}>
                  {evt.event_type.replace("_", " ").toUpperCase()}
                </span>
                <p className={styles.eventMessage}>{evt.message}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
