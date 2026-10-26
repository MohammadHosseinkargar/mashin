"use client";

import { useCallback, useEffect, useState } from "react";
import { api } from "./client-api";

/** بارگذاری داده از API با وضعیت loading/error و امکان بارگذاری دوباره */
export function useResource<T>(url: string | null) {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(Boolean(url));

  useEffect(() => {
    if (!url) return;
    let alive = true;
    api<T>(url)
      .then((d) => { if (alive) { setData(d); setError(null); } })
      .catch((e) => { if (alive) setError(e instanceof Error ? e.message : "خطا در دریافت اطلاعات"); })
      .finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
  }, [url]);

  const reload = useCallback(async () => {
    if (!url) return;
    try { setData(await api<T>(url)); setError(null); }
    catch (e) { setError(e instanceof Error ? e.message : "خطا در دریافت اطلاعات"); }
  }, [url]);

  return { data, setData, error, loading, reload };
}
