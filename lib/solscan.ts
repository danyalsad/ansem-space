/**
 * Solscan Pro API v2 client (server-side only).
 * Free-tier keys may return 401 until activated or upgraded — callers should fall back.
 */

const BASE = "https://pro-api.solscan.io/v2.0";

export interface SolscanHolder {
  address: string;
  owner: string;
  amount: number;
  decimals: number;
  rank: number;
  value?: number;
  percentage?: number;
}

export interface SolscanHoldersResult {
  total: number;
  items: SolscanHolder[];
}

interface SolscanResponse<T> {
  success: boolean;
  data?: T;
  errors?: { code: number; message: string };
}

export type SolscanFetchResult<T> =
  | { ok: true; data: T }
  | { ok: false; upgradeRequired: boolean; message: string };

async function solscanGet<T>(apiKey: string, path: string): Promise<SolscanFetchResult<T>> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { token: apiKey, accept: "application/json" },
    cache: "no-store",
  });

  if (!res.ok) {
    let message = `HTTP ${res.status}`;
    try {
      const json = (await res.json()) as SolscanResponse<T>;
      message = json.errors?.message ?? message;
      const upgradeRequired =
        res.status === 401 && /upgrade/i.test(message);
      return { ok: false, upgradeRequired, message };
    } catch {
      return { ok: false, upgradeRequired: res.status === 401, message };
    }
  }

  const json = (await res.json()) as SolscanResponse<T>;
  if (!json.success || !json.data) {
    return {
      ok: false,
      upgradeRequired: /upgrade/i.test(json.errors?.message ?? ""),
      message: json.errors?.message ?? "Solscan request failed",
    };
  }
  return { ok: true, data: json.data };
}

/** Top token holders + total count (Pro / Lite plans). */
export async function fetchTokenHolders(
  apiKey: string,
  address: string,
  pageSize = 40
): Promise<SolscanFetchResult<SolscanHoldersResult>> {
  return solscanGet<SolscanHoldersResult>(
    apiKey,
    `/token/holders?address=${address}&page=1&page_size=${pageSize}`
  );
}

/** Token metadata (name, symbol, supply, etc.). */
export async function fetchTokenMeta(
  apiKey: string,
  address: string
): Promise<SolscanFetchResult<Record<string, unknown>>> {
  return solscanGet<Record<string, unknown>>(apiKey, `/token/meta?address=${address}`);
}