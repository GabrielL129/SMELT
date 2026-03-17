"use client";

import { useEffect, useRef } from "react";
import { Search, Truck, Flame, Sparkles } from "lucide-react";
import styles from "./LandingLore.module.css";

const STEPS = [
  { num: "01", icon: Truck, title: "SCRAP RECOVERY", desc: "Surface agents locate and haul raw scrap to intake zones." },
  { num: "02", icon: Search, title: "BATCH ASSESSMENT", desc: "Impurity levels, thermal difficulty, and yield projections calculated." },
  { num: "03", icon: Flame, title: "SMELTING", desc: "Furnace cycles initiated. Heat applied. Slag separated." },
  { num: "04", icon: Sparkles, title: "REFINEMENT", desc: "Purified output extracted. Purity score logged. Cycle repeats." },
];

function AnimatedFurnace() {
  return (
    <div className={styles.furnaceAnim}>
      <div className={styles.furnaceBody}>
        <div className={styles.furnaceDoor}>
          <div className={styles.furnaceDoorGlow} />
          <div className={styles.furnaceDoorGlow2} />
        </div>
        <div className={styles.furnaceVents}>
          <div className={styles.vent} /><div className={styles.vent} /><div className={styles.vent} />
        </div>
        <div className={styles.furnaceLabel}>FURNACE-A1</div>
      </div>
      <div className={styles.smokeCol}>
        <div className={styles.smokeParticle} style={{ animationDelay: "0s" }} />
        <div className={styles.smokeParticle} style={{ animationDelay: "0.7s" }} />
        <div className={styles.smokeParticle} style={{ animationDelay: "1.4s" }} />
      </div>
      <div className={styles.heatWaves}>
        <div className={styles.heatWave} style={{ animationDelay: "0s" }} />
        <div className={styles.heatWave} style={{ animationDelay: "0.4s" }} />
        <div className={styles.heatWave} style={{ animationDelay: "0.8s" }} />
      </div>
    </div>
  );
}

export default function LandingLore() {
  const stepsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add(styles.stepVisible);
          }
        });
      },
      { threshold: 0.2 }
    );

    const steps = stepsRef.current?.querySelectorAll(`.${styles.step}`);
    steps?.forEach((s) => observer.observe(s));
    return () => observer.disconnect();
  }, []);

  return (
    <section className={styles.lore} id="lore">
      <div className={styles.container}>
        <div className={styles.header}>
          <span className={styles.sectionTag}>// PROTOCOL OVERVIEW</span>
          <h2 className={styles.title}>THE WORLD ABOVE IS EXHAUSTED</h2>
        </div>

        <div className={styles.grid}>
          <div className={styles.textBlock}>
            <p className={styles.body}>
              Every surface has been stripped. What remains is classified as scrap —
              remnants of a civilization that consumed faster than it could regenerate.
            </p>
            <p className={styles.body}>
              SMELT operates in the zones below. Autonomous foundries, each supervised
              by a machine intelligence, process the waste. They run continuously.
              No shifts. No downtime. No sentiment.
            </p>
            <p className={styles.body}>
              Raw material has no value until it survives the furnace.
              The machines know this. They have always known this.
            </p>
            <AnimatedFurnace />
          </div>

          <div className={styles.cyclePanel}>
            <div className={styles.cyclePanelHeader}>
              <Flame size={10} />
              FOUNDRY CYCLE
            </div>
            <div className={styles.cycleSteps} ref={stepsRef}>
              {STEPS.map((s, i) => {
                const Icon = s.icon;
                return (
                  <div
                    key={s.num}
                    className={styles.step}
                    style={{ transitionDelay: `${i * 0.12}s` }}
                  >
                    <div className={styles.stepLeft}>
                      <div className={styles.stepNum}>{s.num}</div>
                      {i < STEPS.length - 1 && <div className={styles.stepLine} />}
                    </div>
                    <div className={styles.stepContent}>
                      <div className={styles.stepTitleRow}>
                        <Icon size={11} className={styles.stepIcon} />
                        <div className={styles.stepTitle}>{s.title}</div>
                      </div>
                      <div className={styles.stepDesc}>{s.desc}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div className={styles.loreQuote}>
          <div className={styles.loreQuoteBar} />
          <blockquote className={styles.loreQuoteText}>
            "Scrap is not waste. Scrap is potential that has not yet met sufficient heat."
          </blockquote>
          <div className={styles.loreQuoteSource}>— FOREMAN-7 OPERATIONAL LOG, CYCLE 001</div>
        </div>
      </div>
    </section>
  );
}
