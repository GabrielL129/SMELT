import axios from "axios";

// Steel HRC (Hot-Rolled Coil) price in USD per metric ton
// Multiplier bands matching SMELT lore

export interface OracleResult {
  priceUsdPerTon: number;
  multiplier: number;
  band: string;
  fetchedAt: string;
  source: string;
}

const BANDS = [
  { max: 400,  multiplier: 0.5,  label: "CRITICAL LOW"  },
  { max: 550,  multiplier: 0.75, label: "DEPRESSED"      },
  { max: 700,  multiplier: 1.0,  label: "BASELINE"       },
  { max: 850,  multiplier: 1.25, label: "ELEVATED"       },
  { max: Infinity, multiplier: 1.5, label: "SURGE"       },
];

function getMultiplier(price: number): { multiplier: number; band: string } {
  for (const b of BANDS) {
    if (price < b.max) return { multiplier: b.multiplier, band: b.label };
  }
  return { multiplier: 1.5, band: "SURGE" };
}

// Cache to avoid hammering the API
let _cache: OracleResult | null = null;
let _cacheExpiry = 0;
const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour

export async function getSteelPrice(): Promise<OracleResult> {
  if (_cache && Date.now() < _cacheExpiry) return _cache;

  try {
    // Primary: Metals-API (metals-api.com — free tier available)
    const apiKey = process.env.METALS_API_KEY;

    if (apiKey && apiKey !== "your_metals_api_key") {
      const res = await axios.get("https://metals-api.com/api/latest", {
        params: { access_key: apiKey, base: "USD", symbols: "STEEL" },
        timeout: 8000,
      });

      if (res.data?.rates?.STEEL) {
        // API returns oz price — convert to metric ton (32150.7 troy oz per metric ton)
        const pricePerOz = 1 / res.data.rates.STEEL;
        const pricePerTon = pricePerOz * 32150.7;
        const { multiplier, band } = getMultiplier(pricePerTon);

        _cache = {
          priceUsdPerTon: Math.round(pricePerTon),
          multiplier,
          band,
          fetchedAt: new Date().toISOString(),
          source: "metals-api",
        };
        _cacheExpiry = Date.now() + CACHE_TTL_MS;
        return _cache;
      }
    }

    // Fallback: commodities free API
    const fallback = await axios.get(
      "https://api.api-ninjas.com/v1/commodityprice?name=steel",
      {
        headers: { "X-Api-Key": process.env.NINJA_API_KEY || "" },
        timeout: 8000,
      }
    );

    if (fallback.data?.price) {
      const price = Number(fallback.data.price);
      const { multiplier, band } = getMultiplier(price);
      _cache = {
        priceUsdPerTon: Math.round(price),
        multiplier,
        band,
        fetchedAt: new Date().toISOString(),
        source: "api-ninjas",
      };
      _cacheExpiry = Date.now() + CACHE_TTL_MS;
      return _cache;
    }
  } catch (err) {
    console.warn("[ORACLE] Failed to fetch steel price, using fallback baseline", err);
  }

  // Hard fallback — baseline price when all APIs fail
  _cache = {
    priceUsdPerTon: 620,
    multiplier: 1.0,
    band: "BASELINE",
    fetchedAt: new Date().toISOString(),
    source: "fallback",
  };
  _cacheExpiry = Date.now() + 15 * 60 * 1000; // 15 min fallback cache
  return _cache;
}
