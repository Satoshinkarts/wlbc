import { useState, useEffect } from "react";

const CACHE_KEY = "forex_php_usd";
const CACHE_TTL = 30 * 60 * 1000; // 30 minutes

interface CachedRate {
  rate: number;
  timestamp: number;
  apiUpdated: string; // ISO date string from API
}

function getCached(): CachedRate | null {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const cached: CachedRate = JSON.parse(raw);
    if (Date.now() - cached.timestamp < CACHE_TTL) return cached;
  } catch {}
  return null;
}

function setCache(rate: number, apiUpdated: string) {
  const entry: CachedRate = { rate, timestamp: Date.now(), apiUpdated };
  localStorage.setItem(CACHE_KEY, JSON.stringify(entry));
}

let fetchPromise: Promise<CachedRate> | null = null;

async function fetchLiveRate(): Promise<CachedRate> {
  const res = await fetch("https://open.er-api.com/v6/latest/PHP");
  if (!res.ok) throw new Error("Forex API error");
  const data = await res.json();
  const rate = data.rates?.USD as number;
  if (!rate) throw new Error("USD rate not found");
  const apiUpdated = data.time_last_update_utc || new Date().toISOString();
  setCache(rate, apiUpdated);
  return { rate, timestamp: Date.now(), apiUpdated };
}

export function usePhpToUsd() {
  const cached = getCached();
  const [rate, setRate] = useState<number | null>(cached?.rate ?? null);
  const [apiUpdated, setApiUpdated] = useState<string | null>(cached?.apiUpdated ?? null);
  const [loading, setLoading] = useState(!cached);

  useEffect(() => {
    if (rate) return;
    if (!fetchPromise) {
      fetchPromise = fetchLiveRate().finally(() => { fetchPromise = null; });
    }
    fetchPromise
      .then((r) => {
        setRate(r.rate);
        setApiUpdated(r.apiUpdated);
      })
      .catch(() => {
        setRate(1 / 56);
        setApiUpdated(null);
      })
      .finally(() => setLoading(false));
  }, [rate]);

  const convert = (php: number) => (rate ? php * rate : php / 56);

  return { convert, rate, loading, apiUpdated };
}
