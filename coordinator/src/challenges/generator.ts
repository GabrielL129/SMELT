import { v4 as uuid } from "uuid";
import { createHash } from "crypto";

export interface ScrapChallenge {
  challengeId: string;
  siteId: string;
  depth: "shallow" | "medium" | "deep";
  doc: string;
  questions: string[];
  constraints: Constraint[];
  streams: string[];    // valid answer pool (like $CRUDE's "companies")
  creditsPerSolve: number;
}

export interface Constraint {
  index: number;
  description: string;
  // The verifier checks these deterministically
  type: "contains" | "starts_with" | "ends_with" | "exact" | "contains_all" | "word_count";
  value: string | string[] | number;
}

// ─── Scrap stream names (the answer pool) ────────────────────────────────────
const STREAM_POOLS = {
  ferrous: [
    "ALPHA-FERROUS", "DELTA-IRON", "CASCADE-STEEL", "RIDGELINE-ALLOY",
    "SECTOR-7 IRON", "BASALT-FERROUS", "IRON-VEIN-4", "CRUSHED-FERROUS-A",
    "TORCHLINE STEEL", "EMBER-CAST", "GREYWALL IRON", "ASHFIELD ALLOY",
  ],
  slag: [
    "SLAG-STREAM-1", "THERMAL-WASTE-A", "OXIDIZED-BATCH-3", "PURGE-RESIDUE-B",
    "CONTAMINATED-C4", "HIGH-SULFUR-SLAG", "FLUX-RESIDUE-9", "BURNED-OXIDE-2",
  ],
  composite: [
    "COMPOSITE-ALPHA", "MIXED-ALLOY-7", "POLYMER-HYBRID-C", "CERAMIC-BLEND-2",
    "FUSED-MATERIAL-X", "COMPOUND-STREAM-5", "THERMAL-HYBRID-3", "LAYERED-COMPOSITE-B",
  ],
};

// ─── Document templates ───────────────────────────────────────────────────────
function generateShallowDoc(streams: string[], seed: string): {
  doc: string;
  questions: string[];
  constraints: Constraint[];
  answerKey: string;
} {
  const [s1, s2, s3, s4] = streams;

  // Randomize properties deterministically from seed
  const h = (s: string) => parseInt(createHash("sha256").update(seed + s).digest("hex").slice(0, 8), 16);
  const weight1 = 800 + (h("w1") % 1200);
  const weight2 = 600 + (h("w2") % 1000);
  const weight3 = 400 + (h("w3") % 800);
  const weight4 = 200 + (h("w4") % 600);
  const imp1 = 5 + (h("i1") % 20);
  const imp2 = 15 + (h("i2") % 30);
  const imp3 = 8 + (h("i3") % 25);
  const imp4 = 25 + (h("i4") % 35);
  const temp1 = 1100 + (h("t1") % 300);
  const temp2 = 900 + (h("t2") % 400);
  const temp3 = 1000 + (h("t3") % 350);
  const temp4 = 800 + (h("t4") % 500);

  // Yield after smelting = weight * (1 - impurity/100) * thermal_efficiency
  const thermalEff = (temp: number) => temp >= 1200 ? 0.92 : temp >= 1100 ? 0.88 : temp >= 1000 ? 0.82 : 0.75;
  const yield1 = Math.round(weight1 * (1 - imp1 / 100) * thermalEff(temp1));
  const yield2 = Math.round(weight2 * (1 - imp2 / 100) * thermalEff(temp2));
  const yield3 = Math.round(weight3 * (1 - imp3 / 100) * thermalEff(temp3));
  const yield4 = Math.round(weight4 * (1 - imp4 / 100) * thermalEff(temp4));

  // Determine correct answers
  const maxYield = Math.max(yield1, yield2, yield3, yield4);
  const highestYieldStream = [s1, s2, s3, s4][[yield1, yield2, yield3, yield4].indexOf(maxYield)];
  const minImp = Math.min(imp1, imp2, imp3, imp4);
  const lowestImpStream = [s1, s2, s3, s4][[imp1, imp2, imp3, imp4].indexOf(minImp)];

  // The artifact must be: "HIGHEST_YIELD_STREAM|LOWEST_IMP_STREAM"
  const answerKey = `${highestYieldStream}|${lowestImpStream}`;

  const doc = `SECTOR-7 RECOVERY MANIFEST — CYCLE ${seed.slice(0, 6).toUpperCase()}
Classification: SHALLOW ZONE — SURFACE RECOVERY
Coordinator: FOREMAN-7 ASSESSMENT PROTOCOL v2.1

=== INTAKE LOG ===

The following scrap streams were recovered from the surface grid and staged for thermal assessment. Each stream has been weighed, sampled for impurity concentration, and assigned a recommended processing temperature based on composition analysis.

STREAM RECORD: ${s1}
  Gross weight:         ${weight1} kg
  Impurity level:       ${imp1}%
  Composition:          Ferrous alloy, low-carbon grade
  Processing temp:      ${temp1}°C
  Projected yield:      ${yield1} kg refined
  Notes: Recovered from northern extraction grid. Minimal oxidation detected. Standard thermal cycle recommended.

STREAM RECORD: ${s2}
  Gross weight:         ${weight2} kg
  Impurity level:       ${imp2}%
  Composition:          Mixed ferrous with polymer residue
  Processing temp:      ${temp2}°C
  Projected yield:      ${yield2} kg refined
  Notes: Contains organic contamination from prior use environment. Elevated purge cycle expected.

STREAM RECORD: ${s3}
  Gross weight:         ${weight3} kg
  Impurity level:       ${imp3}%
  Composition:          High-grade iron alloy
  Processing temp:      ${temp3}°C
  Projected yield:      ${yield3} kg refined
  Notes: Premium surface recovery. Low slag generation expected. Priority intake recommended.

STREAM RECORD: ${s4}
  Gross weight:         ${weight4} kg
  Impurity level:       ${imp4}%
  Composition:          Degraded composite with sulfur trace
  Processing temp:      ${temp4}°C
  Projected yield:      ${yield4} kg refined
  Notes: High-sulfur trace detected. Extended purge sequence required. Low-priority intake.

=== THERMAL EFFICIENCY REFERENCE ===

Processing temperature determines thermal efficiency:
  >= 1200°C : 92% efficiency
  >= 1100°C : 88% efficiency
  >= 1000°C : 82% efficiency
  < 1000°C  : 75% efficiency

Projected yield is calculated as:
  YIELD = gross_weight × (1 - impurity/100) × thermal_efficiency

=== INTAKE NOTES ===

All streams are queued for FURNACE-A1. Operator may batch streams sequentially or in parallel based on furnace capacity. FOREMAN-7 recommends prioritizing streams with highest projected yield first.

The stream with the lowest impurity level should be flagged for PRIORITY INTAKE to preserve furnace efficiency metrics.

=== END OF MANIFEST ===`;

  const questions = [
    `Which stream has the highest projected yield after thermal processing?`,
    `Which stream has the lowest impurity level?`,
  ];

  const constraints: Constraint[] = [
    {
      index: 0,
      description: `Artifact must contain the name of the highest-yield stream`,
      type: "contains",
      value: highestYieldStream,
    },
    {
      index: 1,
      description: `Artifact must contain the pipe separator character`,
      type: "contains",
      value: "|",
    },
    {
      index: 2,
      description: `Artifact must contain the name of the lowest-impurity stream`,
      type: "contains",
      value: lowestImpStream,
    },
    {
      index: 3,
      description: `Artifact must follow the format: HIGHEST_YIELD|LOWEST_IMPURITY`,
      type: "exact",
      value: answerKey,
    },
  ];

  return { doc, questions, constraints, answerKey };
}

// ─── Public API ───────────────────────────────────────────────────────────────
export function generateChallenge(
  siteId: string,
  depth: "shallow" | "medium" | "deep",
  nonce: string,
  creditsPerSolve: number
): ScrapChallenge {
  const challengeId = uuid();
  const seed = createHash("sha256").update(`${siteId}:${nonce}:${challengeId}`).digest("hex");

  // Pick 4 streams deterministically from seed
  const pickStreams = () => {
    const pool = [
      ...STREAM_POOLS.ferrous,
      ...STREAM_POOLS.slag,
      ...STREAM_POOLS.composite,
    ];
    const picked: string[] = [];
    let s = seed;
    while (picked.length < 4) {
      const idx = parseInt(s.slice(0, 8), 16) % pool.length;
      const candidate = pool[idx];
      if (!picked.includes(candidate)) picked.push(candidate);
      s = createHash("sha256").update(s).digest("hex");
    }
    return picked;
  };

  const streams = pickStreams();
  const { doc, questions, constraints, answerKey } =
    depth === "shallow"
      ? generateShallowDoc(streams, seed)
      : generateShallowDoc(streams, seed); // extend for medium/deep later

  return {
    challengeId,
    siteId,
    depth,
    doc,
    questions,
    constraints,
    streams,
    creditsPerSolve,
  };
}

// ─── Deterministic verifier ───────────────────────────────────────────────────
export function verifyArtifact(
  artifact: string,
  constraints: Constraint[]
): { pass: boolean; failedConstraintIndices: number[] } {
  const failed: number[] = [];

  for (const c of constraints) {
    let ok = false;
    const a = artifact.trim();

    switch (c.type) {
      case "exact":
        ok = a === c.value;
        break;
      case "contains":
        ok = a.includes(c.value as string);
        break;
      case "starts_with":
        ok = a.startsWith(c.value as string);
        break;
      case "ends_with":
        ok = a.endsWith(c.value as string);
        break;
      case "contains_all":
        ok = (c.value as string[]).every((v) => a.includes(v));
        break;
      case "word_count":
        ok = a.split(/\s+/).length === c.value;
        break;
    }

    if (!ok) failed.push(c.index);
  }

  return { pass: failed.length === 0, failedConstraintIndices: failed };
}
