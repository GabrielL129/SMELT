"use client";

import { useState, useEffect } from "react";
import styles from "./FoundryScene.module.css";
import type { Agent, Foundry } from "@/lib/supabase/types";

interface Props {
  agent: Agent;
  foundry: Foundry;
}

const STATE_LABELS: Record<string, string> = {
  idle: "STANDING BY",
  scanning: "SCANNING BATCH",
  hauling: "HAULING SCRAP",
  smelting: "ACTIVE SMELT",
  purging: "PURGE SEQUENCE",
  repairing: "SELF-REPAIR",
  overheated: "OVERHEAT DETECTED",
  alert: "ALERT MODE",
};

function RobotSVG({ state }: { state: string }) {
  const isActive = ["smelting", "hauling", "purging"].includes(state);
  const isAlert = ["overheated", "alert"].includes(state);
  const isScanning = state === "scanning";

  return (
    <svg
      viewBox="0 0 120 180"
      xmlns="http://www.w3.org/2000/svg"
      className={`${styles.robotSvg} ${isActive ? styles.robotActive : ""} ${isAlert ? styles.robotAlert : ""}`}
    >
      {/* Glow base */}
      <ellipse cx="60" cy="165" rx="30" ry="6" fill="rgba(255,107,26,0.15)" />

      {/* Legs */}
      <rect x="38" y="130" width="14" height="32" rx="2" fill="#2a2a2a" stroke="#444" strokeWidth="1"/>
      <rect x="68" y="130" width="14" height="32" rx="2" fill="#2a2a2a" stroke="#444" strokeWidth="1"/>
      {/* Feet */}
      <rect x="34" y="156" width="20" height="8" rx="1" fill="#222" stroke="#444" strokeWidth="1"/>
      <rect x="66" y="156" width="20" height="8" rx="1" fill="#222" stroke="#444" strokeWidth="1"/>

      {/* Body */}
      <rect x="28" y="72" width="64" height="62" rx="3" fill="#1e1e1e" stroke="#333" strokeWidth="1.5"/>

      {/* Body details */}
      <rect x="34" y="82" width="20" height="14" rx="1" fill="#111" stroke="#2a2a2a" strokeWidth="1"/>
      <rect x="66" y="82" width="20" height="14" rx="1" fill="#111" stroke="#2a2a2a" strokeWidth="1"/>

      {/* Chest core */}
      <rect x="44" y="102" width="32" height="22" rx="2" fill="#111" stroke="#333" strokeWidth="1"/>
      <circle
        cx="60" cy="113"
        r="8"
        fill={isAlert ? "rgba(255,32,32,0.2)" : "rgba(255,107,26,0.15)"}
        stroke={isAlert ? "#ff2020" : "#ff6b1a"}
        strokeWidth="1.5"
      />
      <circle
        cx="60" cy="113"
        r="4"
        fill={isAlert ? "#ff2020" : "#ff6b1a"}
        className={isActive ? styles.corePulse : ""}
      />

      {/* Heat vents */}
      <rect x="32" y="96" width="8" height="2" rx="1" fill="#333"/>
      <rect x="32" y="100" width="8" height="2" rx="1" fill="#333"/>
      <rect x="80" y="96" width="8" height="2" rx="1" fill="#333"/>
      <rect x="80" y="100" width="8" height="2" rx="1" fill="#333"/>

      {/* Arms */}
      <rect x="6" y="76" width="22" height="50" rx="3" fill="#1e1e1e" stroke="#333" strokeWidth="1.5"
        className={isActive ? styles.armLeft : ""}
      />
      <rect x="92" y="76" width="22" height="50" rx="3" fill="#1e1e1e" stroke="#333" strokeWidth="1.5"
        className={isActive ? styles.armRight : ""}
      />

      {/* Hands */}
      <rect x="6" y="118" width="22" height="12" rx="2" fill="#222" stroke="#333" strokeWidth="1"/>
      <rect x="92" y="118" width="22" height="12" rx="2" fill="#222" stroke="#333" strokeWidth="1"/>

      {/* Neck */}
      <rect x="50" y="62" width="20" height="12" rx="2" fill="#1a1a1a" stroke="#333" strokeWidth="1"/>

      {/* Head */}
      <rect x="26" y="18" width="68" height="46" rx="4" fill="#1e1e1e" stroke="#333" strokeWidth="1.5"/>

      {/* Visor */}
      <rect x="32" y="28" width="56" height="20" rx="2" fill="#111" stroke="#2a2a2a" strokeWidth="1"/>

      {/* Eyes */}
      <rect
        x="37" y="33" width="18" height="10" rx="1"
        fill={isAlert ? "rgba(255,32,32,0.3)" : isScanning ? "rgba(68,136,255,0.3)" : "rgba(255,107,26,0.2)"}
        stroke={isAlert ? "#ff2020" : isScanning ? "#4488ff" : "#ff6b1a"}
        strokeWidth="1"
        className={styles.eyeGlow}
      />
      <rect
        x="65" y="33" width="18" height="10" rx="1"
        fill={isAlert ? "rgba(255,32,32,0.3)" : isScanning ? "rgba(68,136,255,0.3)" : "rgba(255,107,26,0.2)"}
        stroke={isAlert ? "#ff2020" : isScanning ? "#4488ff" : "#ff6b1a"}
        strokeWidth="1"
        className={styles.eyeGlow}
      />

      {/* Eye pupils */}
      <rect
        x="43" y="36" width="6" height="4" rx="0.5"
        fill={isAlert ? "#ff2020" : isScanning ? "#4488ff" : "#ff6b1a"}
        className={styles.eyePupil}
      />
      <rect
        x="71" y="36" width="6" height="4" rx="0.5"
        fill={isAlert ? "#ff2020" : isScanning ? "#4488ff" : "#ff6b1a"}
        className={styles.eyePupil}
      />

      {/* Antenna */}
      <rect x="57" y="8" width="6" height="12" rx="1" fill="#1a1a1a" stroke="#333" strokeWidth="1"/>
      <circle
        cx="60" cy="7" r="4"
        fill={isAlert ? "rgba(255,32,32,0.3)" : "rgba(255,183,0,0.3)"}
        stroke={isAlert ? "#ff2020" : "#ffb700"}
        strokeWidth="1"
        className={isAlert ? styles.antennaAlert : styles.antennaPulse}
      />

      {/* Head details */}
      <rect x="30" y="54" width="60" height="2" rx="1" fill="#111" stroke="#2a2a2a" strokeWidth="0.5"/>
      <rect x="34" y="58" width="6" height="3" rx="0.5" fill="#222" stroke="#333" strokeWidth="0.5"/>
      <rect x="42" y="58" width="6" height="3" rx="0.5" fill="#222" stroke="#333" strokeWidth="0.5"/>

      {/* Shoulder armor */}
      <rect x="6" y="72" width="22" height="8" rx="2" fill="#222" stroke="#333" strokeWidth="1"/>
      <rect x="92" y="72" width="22" height="8" rx="2" fill="#222" stroke="#333" strokeWidth="1"/>

      {/* Scanning beam */}
      {isScanning && (
        <rect x="32" y="38" width="56" height="2" fill="rgba(68,136,255,0.6)"
          className={styles.scanBeam}
        />
      )}

      {/* Heat shimmer particles on smelting */}
      {isActive && (
        <>
          <circle cx="20" cy="60" r="2" fill="rgba(255,107,26,0.6)" className={styles.particle1} />
          <circle cx="100" cy="55" r="1.5" fill="rgba(255,183,0,0.5)" className={styles.particle2} />
          <circle cx="15" cy="80" r="1" fill="rgba(255,51,0,0.4)" className={styles.particle3} />
        </>
      )}
    </svg>
  );
}

export default function FoundryScene({ agent, foundry }: Props) {
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 3000);
    return () => clearInterval(id);
  }, []);

  const heatPct = foundry.heat;
  const isHot = heatPct > 70;

  return (
    <div className={styles.scene}>
      {/* Ambient glow based on heat */}
      <div
        className={styles.ambientGlow}
        style={{ opacity: heatPct / 200 }}
      />

      {/* Header */}
      <div className={styles.sceneHeader}>
        <span className={styles.sceneLabel}>FOUNDRY PRIME — LIVE VIEW</span>
        <span className={styles.sceneLive}>
          <span className={styles.sceneLiveDot} />
          LIVE
        </span>
      </div>

      {/* Main scene */}
      <div className={styles.sceneMain}>
        {/* Conveyor left */}
        <div className={styles.conveyorLeft}>
          <div className={styles.conveyorLabel}>INTAKE</div>
          <div className={styles.conveyorTrack}>
            <div className={styles.conveyorBelt} />
            <div className={styles.scrapBlock} />
            <div className={styles.scrapBlockSmall} />
          </div>
        </div>

        {/* Robot center */}
        <div className={styles.robotContainer}>
          <div className={styles.robotPlatform} />
          <RobotSVG state={agent.state} />
          <div className={styles.robotLabel}>
            <span className={styles.robotName}>{agent.name}</span>
            <span className={styles.robotState}>
              {STATE_LABELS[agent.state] || agent.state.toUpperCase()}
            </span>
          </div>
        </div>

        {/* Furnace right */}
        <div className={styles.furnaceContainer}>
          <div className={styles.furnaceLabel}>FURNACE-A1</div>
          <div className={`${styles.furnace} ${isHot ? styles.furnaceHot : ""}`}>
            <div className={styles.furnaceDoor}>
              <div className={styles.furnaceDoorGlow} />
            </div>
            <div className={styles.furnaceTempBar}>
              <div
                className={styles.furnaceTempFill}
                style={{ height: `${heatPct}%` }}
              />
            </div>
            <div className={styles.furnaceStack}>
              <div className={styles.smoke1} />
              <div className={styles.smoke2} />
              <div className={styles.smoke3} />
            </div>
          </div>
          <div className={styles.furnaceTemp}>
            {Math.round(heatPct * 16)}°C
          </div>
        </div>
      </div>

      {/* Floor */}
      <div className={styles.floor}>
        <div className={styles.floorLine} />
        <div className={styles.floorGlow} />
      </div>

      {/* State badge */}
      <div className={styles.stateBadge}>
        <span className={`${styles.stateBadgeText} ${styles[`state_${agent.state}`]}`}>
          ● {agent.state.toUpperCase()}
        </span>
        <span className={styles.stateBadgeMode}>{agent.mode.toUpperCase()} MODE</span>
      </div>
    </div>
  );
}
