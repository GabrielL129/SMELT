"use client";

import { useEffect, useRef } from "react";
import { Bot, Truck, Flame, Trash2, ScanLine, Wrench } from "lucide-react";
import styles from "./LandingRobotClasses.module.css";

const CLASSES = [
  {
    designation: "FOREMAN CLASS IV",
    code: "FMN-4",
    role: "Autonomous Supervisor",
    icon: Bot,
    description: "Primary operational intelligence. Manages full foundry workflow. Coordinates batch intake, furnace cycles, and slag purge scheduling. Issues all directives.",
    stats: { autonomy: 98, efficiency: 91, durability: 84 },
    state: "ACTIVE",
    stateColor: "green",
  },
  {
    designation: "HAULER CLASS II",
    code: "HLR-2",
    role: "Scrap Transport Unit",
    icon: Truck,
    description: "Heavy-duty scrap recovery and intake. Operates in surface recovery zones and internal conveyor systems. No decision logic. Pure mechanical throughput.",
    stats: { autonomy: 40, efficiency: 95, durability: 97 },
    state: "HAULING",
    stateColor: "amber",
  },
  {
    designation: "FURNACE TENDER CLASS III",
    code: "FTN-3",
    role: "Thermal Operations",
    icon: Flame,
    description: "Manages furnace temperature, fuel injection, and purge cycles. Monitors slag accumulation. Triggers critical heat alerts to the FOREMAN layer.",
    stats: { autonomy: 62, efficiency: 88, durability: 90 },
    state: "SMELTING",
    stateColor: "furnace",
  },
  {
    designation: "PURGE UNIT CLASS I",
    code: "PRG-1",
    role: "Slag Extraction",
    icon: Trash2,
    description: "Single-function extraction unit. Activates only during purge sequences. Removes accumulated slag from active furnaces. High heat tolerance.",
    stats: { autonomy: 20, efficiency: 100, durability: 79 },
    state: "STANDBY",
    stateColor: "dim",
  },
  {
    designation: "SCANNER CLASS II",
    code: "SCN-2",
    role: "Batch Analysis",
    icon: ScanLine,
    description: "Pre-processing assessment. Evaluates scrap composition, impurity levels, and thermal difficulty. Feeds data directly to FOREMAN layer planning systems.",
    stats: { autonomy: 55, efficiency: 93, durability: 71 },
    state: "SCANNING",
    stateColor: "blue",
  },
  {
    designation: "REPAIR DRONE CLASS I",
    code: "RPR-1",
    role: "Integrity Maintenance",
    icon: Wrench,
    description: "Dispatched when agent integrity drops below threshold. Performs field repairs on active units. Cannot self-repair. Operates on FOREMAN directives only.",
    stats: { autonomy: 30, efficiency: 77, durability: 88 },
    state: "IDLE",
    stateColor: "dim",
  },
];

function StatBar({ label, value }: { label: string; value: number }) {
  return (
    <div className={styles.statRow}>
      <span className={styles.statLabel}>{label}</span>
      <div className={styles.statBar}>
        <div className={styles.statFill} style={{ width: `${value}%` }} />
      </div>
      <span className={styles.statValue}>{value}%</span>
    </div>
  );
}

export default function LandingRobotClasses() {
  const gridRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) entry.target.classList.add(styles.cardVisible);
        });
      },
      { threshold: 0.1 }
    );
    const cards = gridRef.current?.querySelectorAll(`.${styles.card}`);
    cards?.forEach((c) => observer.observe(c));
    return () => observer.disconnect();
  }, []);

  return (
    <section className={styles.section} id="classes">
      <div className={styles.container}>
        <div className={styles.header}>
          <span className={styles.sectionTag}>// OPERATIONAL UNITS</span>
          <h2 className={styles.title}>FOUNDRY AGENT CLASSES</h2>
          <p className={styles.subtitle}>Six unit types. One hierarchy. Every foundry runs on the same protocol.</p>
        </div>

        <div className={styles.grid} ref={gridRef}>
          {CLASSES.map((cls, i) => {
            const Icon = cls.icon;
            return (
              <div
                key={cls.code}
                className={styles.card}
                style={{ transitionDelay: `${(i % 3) * 0.08}s` }}
              >
                <div className={styles.cardTop}>
                  <div className={styles.cardIconWrap}>
                    <Icon size={14} className={styles.cardIcon} />
                  </div>
                  <div className={styles.cardCode}>{cls.code}</div>
                  <div className={`${styles.cardState} ${styles[`state_${cls.stateColor}`]}`}>
                    {cls.state}
                  </div>
                </div>
                <div className={styles.cardDesignation}>{cls.designation}</div>
                <div className={styles.cardRole}>{cls.role}</div>
                <p className={styles.cardDesc}>{cls.description}</p>
                <div className={styles.cardStats}>
                  <StatBar label="AUTONOMY" value={cls.stats.autonomy} />
                  <StatBar label="EFFICIENCY" value={cls.stats.efficiency} />
                  <StatBar label="DURABILITY" value={cls.stats.durability} />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
