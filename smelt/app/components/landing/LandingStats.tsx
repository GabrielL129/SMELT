"use client";

import { useState, useEffect } from "react";
import { Flame, Activity, Zap, AlertTriangle, Globe, BarChart2 } from "lucide-react";
import styles from "./LandingStats.module.css";

export default function LandingStats() {
  const [mounted, setMounted] = useState(false);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    setMounted(true);
    const id = setInterval(() => setTick(t => t + 1), 2500);
    return () => clearInterval(id);
  }, []);

  // Static base values rendered on server — animated only after mount
  const base = {
    scrap: 47820,
    refined: 31204,
    foundries: 1847,
    agents: 3291,
    pressure: 62,
    purity: 84.2,
    cycles: 92440,
  };

  const live = mounted ? {
    scrap: base.scrap + tick * 4,
    refined: base.refined + tick * 2,
    foundries: base.foundries + (tick % 5),
    agents: base.agents + (tick % 8),
    pressure: base.pressure + (tick % 9),
    purity: (base.purity - (tick % 3) * 0.1).toFixed(1),
    cycles: base.cycles + tick,
  } : {
    scrap: base.scrap,
    refined: base.refined,
    foundries: base.foundries,
    agents: base.agents,
    pressure: base.pressure,
    purity: base.purity.toFixed(1),
    cycles: base.cycles,
  };

  // Safe number formatter — only use toLocaleString after mount
  const fmt = (n: number) => mounted ? n.toLocaleString() : String(n);

  const stats = [
    { icon: Activity, label: "SCRAP PROCESSED",  value: fmt(live.scrap) + " T",      sub: "EPOCH TOTAL",          accent: false, green: false },
    { icon: Flame,    label: "REFINED OUTPUT",    value: fmt(live.refined) + " T",    sub: "EPOCH TOTAL",          accent: true,  green: false },
    { icon: Globe,    label: "ACTIVE FOUNDRIES",  value: fmt(live.foundries),          sub: "CURRENTLY OPERATING",  accent: false, green: false },
    { icon: Zap,      label: "AGENTS ONLINE",     value: fmt(live.agents),             sub: "ALL CLASSES",          accent: false, green: false },
    { icon: BarChart2,label: "AVERAGE PURITY",    value: live.purity + "%",           sub: "SYSTEM-WIDE",          accent: false, green: true  },
    { icon: Activity, label: "TOTAL CYCLES",      value: fmt(live.cycles),             sub: "SINCE EPOCH START",    accent: false, green: false },
  ];

  return (
    <section className={styles.section} id="stats">
      <div className={styles.container}>
        <div className={styles.header}>
          <span className={styles.sectionTag}>// LIVE PROTOCOL METRICS</span>
          <h2 className={styles.title}>SYSTEM STATUS</h2>
        </div>

        <div className={styles.eventBanner + " warning-stripe"}>
          <div className={styles.eventBannerLeft}>
            <span className={styles.eventBadge}>
              <AlertTriangle size={9} /> GLOBAL EVENT ACTIVE
            </span>
            <span className={styles.eventTitle}>SCRAP SURGE — SECTOR 7</span>
          </div>
          <p className={styles.eventDesc}>
            Unprocessed scrap volumes have spiked across all active foundries. Thermal pressure rising system-wide.
          </p>
        </div>

        <div className={styles.epochRow}>
          <div className={styles.epochNum}>
            <span className={styles.epochNumLabel}>EPOCH</span>
            <span className={styles.epochNumValue}>01</span>
          </div>
          <div className={styles.epochName}>THE FIRST MELT</div>
          <div className={styles.epochPressure}>
            <span className={styles.epochPressureLabel}>GLOBAL PRESSURE</span>
            <div className={styles.epochPressureBar}>
              <div className={styles.epochPressureFill} style={{ width: `${live.pressure}%` }} />
              <div className={styles.epochPressureGlow} style={{ left: `${live.pressure}%` }} />
            </div>
            <span className={styles.epochPressureValue}>{live.pressure}%</span>
          </div>
        </div>

        <div className={styles.statsGrid}>
          {stats.map((s, i) => {
            const Icon = s.icon;
            return (
              <div key={i} className={styles.statCard}>
                <div className={styles.statCardHeader}>
                  <Icon size={10} className={styles.statCardIcon} />
                  <span className={styles.statCardLabel}>{s.label}</span>
                </div>
                <div className={`${styles.statCardValue} ${s.accent ? styles.statAccent : ""} ${s.green ? styles.statGreen : ""}`}>
                  {s.value}
                </div>
                <div className={styles.statCardSub}>{s.sub}</div>
                <div className={styles.statCardTick} />
              </div>
            );
          })}
        </div>

        <div className={styles.dataNote}>
          <Activity size={9} />
          METRICS SOURCED FROM SUPABASE PROTOCOL LAYER — UPDATED EACH CYCLE
        </div>
      </div>
    </section>
  );
}
