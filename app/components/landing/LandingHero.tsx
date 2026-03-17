"use client";

import { useEffect, useRef, useState } from "react";
import { Flame, Zap, AlertTriangle, Activity, ChevronDown } from "lucide-react";
import styles from "./LandingHero.module.css";

export default function LandingHero() {
  const particleRef = useRef<HTMLCanvasElement>(null);
  // Start with null — only update on client to avoid hydration mismatch
  const [mounted, setMounted] = useState(false);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    setMounted(true);
    const id = setInterval(() => setTick((t) => t + 1), 2000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    const canvas = particleRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();

    const particles: Array<{
      x: number; y: number; vx: number; vy: number;
      size: number; alpha: number; color: string; type: string;
    }> = [];

    const colors = ["#ff6b1a", "#ff3300", "#ffb700", "#cc4a00", "#ff8c42"];

    for (let i = 0; i < 80; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 0.5,
        vy: -Math.random() * 1.2 - 0.3,
        size: Math.random() * 2.5 + 0.5,
        alpha: Math.random() * 0.7 + 0.1,
        color: colors[Math.floor(Math.random() * colors.length)],
        type: Math.random() > 0.7 ? "square" : "circle",
      });
    }

    let animId: number;
    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particles.forEach((p) => {
        ctx.globalAlpha = p.alpha;
        ctx.fillStyle = p.color;
        if (p.type === "square") {
          ctx.fillRect(p.x, p.y, p.size, p.size);
        } else {
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
          ctx.fill();
        }
        p.x += p.vx;
        p.y += p.vy;
        p.alpha -= 0.0008;
        if (p.y < -10 || p.alpha <= 0) {
          p.y = canvas.height + 10;
          p.x = Math.random() * canvas.width;
          p.alpha = Math.random() * 0.7 + 0.1;
        }
      });
      ctx.globalAlpha = 1;
      animId = requestAnimationFrame(animate);
    };
    animate();

    window.addEventListener("resize", resize);
    return () => { cancelAnimationFrame(animId); window.removeEventListener("resize", resize); };
  }, []);

  // Static base values — only animate after mount to avoid hydration mismatch
  const baseFoundries = 1847;
  const baseScrap = 47820;
  const basePressure = 62;

  const liveFoundries = mounted ? baseFoundries + (tick % 3) : baseFoundries;
  const liveScrap = mounted ? baseScrap + tick * 3 : baseScrap;
  const livePressure = mounted ? basePressure + (tick % 8) : basePressure;

  // Format without toLocaleString on server — use plain number
  const fmtNum = (n: number) => mounted ? n.toLocaleString() : String(n);

  return (
    <section className={styles.hero}>
      <canvas ref={particleRef} className={styles.particles} />
      <div className={styles.bgGrid} />
      <div className={styles.bgGlow} />
      <div className={styles.bgGlow2} />
      <div className={styles.cornerTL} />
      <div className={styles.cornerBR} />

      <nav className={styles.nav}>
        <div className={styles.navLogo}>
          <span className={styles.navLogoText}>SMELT</span>
          <span className={styles.navLogoBadge}>v0.1</span>
        </div>
        <div className={styles.navLinks}>
          <a href="#lore"><Activity size={10} />PROTOCOL</a>
          <a href="#classes"><Zap size={10} />UNITS</a>
          <a href="#stats"><Flame size={10} />METRICS</a>
          <a href="#docs" className={styles.navLinkDim}>DOCS ↗</a>
        </div>
        <a href="http://app.smelt.world" className={styles.navCta}>
          ENTER FOUNDRY
        </a>
      </nav>

      <div className={styles.content}>
        <div className={styles.statusBar}>
          <span className={styles.statusDot} />
          <span>SYSTEM ONLINE</span>
          <span className={styles.statusSep}>|</span>
          <span>EPOCH 1: THE FIRST MELT</span>
          <span className={styles.statusSep}>|</span>
          <AlertTriangle size={10} className={styles.statusIcon} />
          <span className={styles.statusWarn}>SCRAP SURGE ACTIVE</span>
        </div>

        <h1 className={styles.title}>
          <span className={styles.titleSmall}>AUTONOMOUS FOUNDRY PROTOCOL</span>
          <span className={styles.titleMain}>SMELT</span>
          <span className={styles.titleSub}>
            SCRAP IN.<br />
            REFINED OUT.<br />
            THE MACHINES NEVER STOP.
          </span>
        </h1>

        <p className={styles.description}>
          The surface is exhausted. What remains is scrap.<br />
          Autonomous foundries operate beneath the ash —<br />
          processing, smelting, refining. Cycle after cycle.
        </p>

        <div className={styles.actions}>
          <a href="http://app.smelt.world" className={styles.btnPrimary}>
            <Flame size={14} />
            ENTER THE FOUNDRY
          </a>
          <a href="#lore" className={styles.btnSecondary}>
            READ THE PROTOCOL
          </a>
        </div>

        {/* Live terminal block */}
        <div className={styles.terminal}>
          <div className={styles.terminalHeader}>
            <div className={styles.terminalDots}>
              <span /><span /><span />
            </div>
            <span className={styles.terminalTitle}>FOREMAN-7 // LIVE FEED</span>
            <span className={styles.terminalLive}>● LIVE</span>
          </div>
          <div className={styles.terminalBody}>
            <div className={styles.terminalLine}>
              <span className={styles.terminalPrompt}>&gt;</span>
              <span className={styles.terminalText}>EPOCH_01 active. Scrap surge in SECTOR-7 detected.</span>
            </div>
            <div className={styles.terminalLine}>
              <span className={styles.terminalPrompt}>&gt;</span>
              <span className={styles.terminalText}>
                Batch SCR-0{mounted ? 482 + (tick % 10) : 482} loaded. Thermal ramp initiated.
              </span>
            </div>
            <div className={styles.terminalLine}>
              <span className={styles.terminalPrompt}>&gt;</span>
              <span className={styles.terminalAmber}>
                Heat index at {mounted ? livePressure - 12 : 50}%. Monitoring slag buildup.
              </span>
            </div>
            <div className={styles.terminalLine}>
              <span className={styles.terminalPrompt}>&gt;</span>
              <span className={styles.terminalGreen}>
                Purity holding at 87.4%. Yield on target.
              </span>
            </div>
            <div className={styles.terminalCursorLine}>
              <span className={styles.terminalPrompt}>&gt;</span>
              <span className={styles.terminalCursor}>_</span>
            </div>
          </div>
        </div>

        <div className={styles.scrollHint}>
          <ChevronDown size={14} className={styles.scrollIcon} />
          <span>SCROLL TO DESCEND</span>
        </div>
      </div>

      <div className={styles.bottomBar}>
        <div className={styles.bottomBarItem}>
          <Flame size={10} className={styles.bottomIcon} />
          <div>
            <span className={styles.bottomBarLabel}>ACTIVE FOUNDRIES</span>
            <span className={styles.bottomBarValue}>{fmtNum(liveFoundries)}</span>
          </div>
        </div>
        <div className={styles.bottomBarDivider} />
        <div className={styles.bottomBarItem}>
          <Activity size={10} className={styles.bottomIcon} />
          <div>
            <span className={styles.bottomBarLabel}>SCRAP PROCESSED</span>
            <span className={styles.bottomBarValue}>{fmtNum(liveScrap)} T</span>
          </div>
        </div>
        <div className={styles.bottomBarDivider} />
        <div className={styles.bottomBarItem}>
          <Zap size={10} className={styles.bottomIcon} />
          <div>
            <span className={styles.bottomBarLabel}>CURRENT EPOCH</span>
            <span className={styles.bottomBarValue}>01 — THE FIRST MELT</span>
          </div>
        </div>
        <div className={styles.bottomBarDivider} />
        <div className={styles.bottomBarItem}>
          <AlertTriangle size={10} className={styles.bottomIconWarn} />
          <div>
            <span className={styles.bottomBarLabel}>SYSTEM PRESSURE</span>
            <span className={styles.bottomBarValueWarn}>{livePressure}%</span>
          </div>
        </div>
      </div>
    </section>
  );
}
