import { useState, useEffect } from "react";

const CACHE_KEY = "forex_php_usd";
const CACHE_TTL = 30 * 60 * 1000; // 30 minutes

interface CachedRate {
  rate: number;
  timestamp: number;
}

function getCachedRate(): number | null {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const cached: CachedRate = JSON.parse(raw);
    if (Date.now() - cached.timestamp < CACHE_TTL) return cached.rate;
  } catch {}
  return null;
}

function setCachedRate(rate: number) {
  localStorage.setItem(CACHE_KEY, JSON.stringify({ rate, timestamp: Date.now() }));
}

let fetchPromise: Promise<number> | null = null;

async function fetchLiveRate(): Promise<number> {
  const res = await fetch("https://open.er-api.com/v6/latest/PHP");
  if (!res.ok) throw new Error("Forex API error");
  const data = await res.json();
  const rate = data.rates?.USD as number;
  if (!rate) throw new Error("USD rate not found");
  setCachedRate(rate);
  return rate;
}

export function usePhpToUsd() {
  const [rate, setRate] = useState<number | null>(getCachedRate);
  const [loading, setLoading] = useState(!rate);

  useEffect(() => {
    if (rate) return; // already have cached rate
    if (!fetchPromise) {
      fetchPromise = fetchLiveRate().finally(() => { fetchPromise = null; });
    }
    fetchPromise
      .then((r) => setRate(r))
      .catch(() => {
        // Fallback rate if API fails
        setRate(1 / 56);
      })
      .finally(() => setLoading(false));
  }, [rate]);

  const convert = (php: number) => (rate ? php * rate : php / 56);

  return { convert, rate, loading };
}
