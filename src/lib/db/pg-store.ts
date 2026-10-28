import { Pool } from "pg";
import type {
  ConsultationInput, ConsultationRequest, ExchangeRate, ImportFee, ImportFeeInput, ImportSettings,
  RequestStatus, SiteSettings, Vehicle, VehicleInput, VehicleQuery,
} from "../types";
import { DEFAULT_IMPORT_SETTINGS, DEFAULT_SETTINGS, vehicleTitle, type Store } from "./store";
import { SEED_FEES, SEED_VEHICLES } from "./seed";

const SCHEMA = `
CREATE TABLE IF NOT EXISTS vehicles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brand VARCHAR(100) NOT NULL,
  model VARCHAR(200) NOT NULL,
  model_year INTEGER NOT NULL,
  aed_price NUMERIC(14,2) NOT NULL,
  images TEXT[] NOT NULL DEFAULT '{}',
  specifications JSONB NOT NULL DEFAULT '{}',
  mileage INTEGER NOT NULL DEFAULT 0,
  engine_capacity INTEGER NOT NULL DEFAULT 0,
  fuel_type VARCHAR(20) NOT NULL DEFAULT 'petrol',
  transmission VARCHAR(20) NOT NULL DEFAULT 'automatic',
  features TEXT[] NOT NULL DEFAULT '{}',
  description TEXT NOT NULL DEFAULT '',
  status VARCHAR(20) NOT NULL DEFAULT 'available',
  is_published BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_vehicles_brand ON vehicles(brand);
CREATE INDEX IF NOT EXISTS idx_vehicles_published ON vehicles(is_published);
CREATE INDEX IF NOT EXISTS idx_vehicles_created ON vehicles(created_at DESC);

CREATE TABLE IF NOT EXISTS exchange_rates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rate NUMERIC(14,2) NOT NULL,
  source VARCHAR(200) NOT NULL,
  is_manual BOOLEAN NOT NULL DEFAULT true,
  last_updated TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS import_fees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(200) NOT NULL,
  type VARCHAR(20) NOT NULL,
  value NUMERIC(16,2) NOT NULL,
  currency VARCHAR(20) NOT NULL,
  is_enabled BOOLEAN NOT NULL DEFAULT true,
  description TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS consultation_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(200) NOT NULL,
  phone VARCHAR(50) NOT NULL,
  vehicle_id UUID REFERENCES vehicles(id) ON DELETE SET NULL,
  vehicle_title VARCHAR(400),
  message TEXT NOT NULL DEFAULT '',
  status VARCHAR(20) NOT NULL DEFAULT 'pending',
  submitted_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_requests_submitted ON consultation_requests(submitted_at DESC);

CREATE TABLE IF NOT EXISTS app_kv (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
`;

const g = globalThis as unknown as { __pgPool?: Pool; __pgReady?: Promise<void> };

function pool(): Pool {
  if (!g.__pgPool) {
    g.__pgPool = new Pool({ connectionString: process.env.DATABASE_URL, max: 10, idleTimeoutMillis: 30_000, connectionTimeoutMillis: 5_000 });
    g.__pgPool.on("error", (e) => console.error("[pg] idle client error", e));
  }
  return g.__pgPool;
}

async function init(): Promise<void> {
  const p = pool();
  await p.query(SCHEMA);
  const seeded = await p.query("SELECT 1 FROM app_kv WHERE key = 'seeded'");
  if (seeded.rowCount === 0) {
    await p.query("INSERT INTO exchange_rates (rate, source, is_manual) VALUES (17000, 'مقدار نمونه (دستی)', true)");
    for (const f of SEED_FEES) {
      await p.query("INSERT INTO import_fees (name,type,value,currency,is_enabled,description) VALUES ($1,$2,$3,$4,$5,$6)", [f.name, f.type, f.value, f.currency, f.isEnabled, f.description]);
    }
    if (process.env.SEED_DEMO === "true") {
      for (const v of SEED_VEHICLES) await insertVehicle(v);
    }
    await p.query("INSERT INTO app_kv (key, value) VALUES ('seeded', 'true') ON CONFLICT (key) DO NOTHING");
  }
}

function ready(): Promise<void> {
  if (!g.__pgReady) {
    g.__pgReady = init().catch((e) => {
      g.__pgReady = undefined; // اجازه‌ی تلاش دوباره
      throw e;
    });
  }
  return g.__pgReady;
}

async function q<T = Record<string, unknown>>(text: string, params: unknown[] = []): Promise<T[]> {
  await ready();
  return (await pool().query(text, params)).rows as T[];
}

/* ---------- mapping ---------- */
type Row = Record<string, any>; // eslint-disable-line @typescript-eslint/no-explicit-any
const iso = (d: unknown) => (d instanceof Date ? d.toISOString() : String(d));

const toVehicle = (r: Row): Vehicle => ({
  id: r.id, brand: r.brand, model: r.model, modelYear: r.model_year, aedPrice: Number(r.aed_price),
  images: r.images ?? [], specifications: r.specifications ?? {}, mileage: r.mileage, engineCapacity: r.engine_capacity,
  fuelType: r.fuel_type, transmission: r.transmission, features: r.features ?? [], description: r.description ?? "",
  status: r.status, isPublished: r.is_published, createdAt: iso(r.created_at), updatedAt: iso(r.updated_at),
});
const toFee = (r: Row): ImportFee => ({
  id: r.id, name: r.name, type: r.type, value: Number(r.value), currency: r.currency, isEnabled: r.is_enabled,
  description: r.description ?? "", createdAt: iso(r.created_at),
});
const toRequest = (r: Row): ConsultationRequest => ({
  id: r.id, name: r.name, phone: r.phone, vehicleId: r.vehicle_id, vehicleTitle: r.vehicle_title,
  message: r.message ?? "", status: r.status, submittedAt: iso(r.submitted_at),
});

async function insertVehicle(v: VehicleInput): Promise<Vehicle> {
  const res = await pool().query(
    `INSERT INTO vehicles (brand,model,model_year,aed_price,images,specifications,mileage,engine_capacity,fuel_type,transmission,features,description,status,is_published)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14) RETURNING *`,
    [v.brand, v.model, v.modelYear, v.aedPrice, v.images, JSON.stringify(v.specifications ?? {}), v.mileage, v.engineCapacity,
      v.fuelType, v.transmission, v.features, v.description, v.status, v.isPublished],
  );
  return toVehicle(res.rows[0]);
}

const VEHICLE_COLUMNS: Record<string, string> = {
  brand: "brand", model: "model", modelYear: "model_year", aedPrice: "aed_price", images: "images",
  specifications: "specifications", mileage: "mileage", engineCapacity: "engine_capacity", fuelType: "fuel_type",
  transmission: "transmission", features: "features", description: "description", status: "status", isPublished: "is_published",
};
const FEE_COLUMNS: Record<string, string> = {
  name: "name", type: "type", value: "value", currency: "currency", isEnabled: "is_enabled", description: "description",
};

function buildUpdate(patch: Record<string, unknown>, columns: Record<string, string>, extra = ""): { set: string; values: unknown[] } | null {
  const sets: string[] = [];
  const values: unknown[] = [];
  for (const [k, col] of Object.entries(columns)) {
    if (patch[k] === undefined) continue;
    values.push(k === "specifications" ? JSON.stringify(patch[k]) : patch[k]);
    sets.push(`${col} = $${values.length}`);
  }
  if (sets.length === 0) return null;
  return { set: sets.join(", ") + extra, values };
}

const SORT_SQL: Record<string, string> = {
  newest: "created_at DESC",
  price_asc: "aed_price ASC, created_at DESC",
  price_desc: "aed_price DESC, created_at DESC",
  year_desc: "model_year DESC, created_at DESC",
  mileage_asc: "mileage ASC, created_at DESC",
};

async function getKv<T>(key: string, fallback: T): Promise<T> {
  const rows = await q<{ value: T }>("SELECT value FROM app_kv WHERE key = $1", [key]);
  return rows[0] ? { ...fallback, ...rows[0].value } : fallback;
}
async function setKv<T extends object>(key: string, value: T): Promise<void> {
  await q("INSERT INTO app_kv (key, value, updated_at) VALUES ($1,$2,NOW()) ON CONFLICT (key) DO UPDATE SET value = $2, updated_at = NOW()", [key, JSON.stringify(value)]);
}

export const pgStore: Store = {
  async listVehicles(query: VehicleQuery = {}) {
    const where: string[] = [];
    const p: unknown[] = [];
    const add = (sql: string, val: unknown) => { p.push(val); where.push(sql.replace("?", `$${p.length}`)); };
    if (query.publishedOnly) where.push("is_published = true");
    if (query.brand) add("brand = ?", query.brand);
    if (query.fuelType) add("fuel_type = ?", query.fuelType);
    if (query.transmission) add("transmission = ?", query.transmission);
    if (query.status) add("status = ?", query.status);
    if (query.yearMin) add("model_year >= ?", query.yearMin);
    if (query.yearMax) add("model_year <= ?", query.yearMax);
    if (query.priceMin) add("aed_price >= ?", query.priceMin);
    if (query.priceMax) add("aed_price <= ?", query.priceMax);
    if (query.search?.trim()) {
      p.push(`%${query.search.trim().replace(/[%_\\]/g, "\\$&")}%`);
      where.push(`(brand ILIKE $${p.length} OR model ILIKE $${p.length} OR description ILIKE $${p.length})`);
    }
    const w = where.length ? `WHERE ${where.join(" AND ")}` : "";
    const order = SORT_SQL[query.sort ?? "newest"] ?? SORT_SQL.newest;
    const limit = Math.min(Math.max(query.limit ?? 100, 1), 500);
    const offset = Math.max(query.offset ?? 0, 0);
    const [items, count] = await Promise.all([
      q<Row>(`SELECT * FROM vehicles ${w} ORDER BY ${order} LIMIT ${limit} OFFSET ${offset}`, p),
      q<Row>(`SELECT COUNT(*)::int AS n FROM vehicles ${w}`, p),
    ]);
    return { items: items.map(toVehicle), total: count[0]?.n ?? 0 };
  },
  async getVehicle(id) {
    if (!/^[0-9a-f-]{36}$/i.test(id)) return null;
    const rows = await q<Row>("SELECT * FROM vehicles WHERE id = $1", [id]);
    return rows[0] ? toVehicle(rows[0]) : null;
  },
  async createVehicle(input) {
    await ready();
    return insertVehicle(input);
  },
  async updateVehicle(id, patch) {
    if (!/^[0-9a-f-]{36}$/i.test(id)) return null;
    const u = buildUpdate(patch as Record<string, unknown>, VEHICLE_COLUMNS, ", updated_at = NOW()");
    if (!u) return this.getVehicle(id);
    const rows = await q<Row>(`UPDATE vehicles SET ${u.set} WHERE id = $${u.values.length + 1} RETURNING *`, [...u.values, id]);
    return rows[0] ? toVehicle(rows[0]) : null;
  },
  async deleteVehicle(id) {
    if (!/^[0-9a-f-]{36}$/i.test(id)) return false;
    const rows = await q("DELETE FROM vehicles WHERE id = $1 RETURNING id", [id]);
    return rows.length > 0;
  },
  async listBrands(publishedOnly) {
    const rows = await q<Row>(`SELECT DISTINCT brand FROM vehicles ${publishedOnly ? "WHERE is_published = true" : ""}`);
    return rows.map((r) => r.brand as string).sort((a, b) => a.localeCompare(b, "fa"));
  },
  async listByExternalIds(ids) {
    if (!ids.length) return [];
    const rows = await q<Row>("SELECT * FROM vehicles WHERE specifications->>'externalId' = ANY($1::text[])", [ids.map(String)]);
    return rows.map(toVehicle);
  },

  async getRate(): Promise<ExchangeRate> {
    const rows = await q<Row>("SELECT * FROM exchange_rates ORDER BY last_updated DESC LIMIT 1");
    const r = rows[0];
    return r
      ? { rate: Number(r.rate), source: r.source, isManual: r.is_manual, lastUpdated: iso(r.last_updated) }
      : { rate: 0, source: "تنظیم نشده", isManual: true, lastUpdated: new Date().toISOString() };
  },
  async setRate(rate, source, isManual) {
    const rows = await q<Row>("INSERT INTO exchange_rates (rate, source, is_manual) VALUES ($1,$2,$3) RETURNING *", [rate, source, isManual]);
    const r = rows[0];
    return { rate: Number(r.rate), source: r.source, isManual: r.is_manual, lastUpdated: iso(r.last_updated) };
  },

  async listFees() {
    return (await q<Row>("SELECT * FROM import_fees ORDER BY created_at ASC")).map(toFee);
  },
  async createFee(f: ImportFeeInput) {
    const rows = await q<Row>(
      "INSERT INTO import_fees (name,type,value,currency,is_enabled,description) VALUES ($1,$2,$3,$4,$5,$6) RETURNING *",
      [f.name, f.type, f.value, f.currency, f.isEnabled, f.description],
    );
    return toFee(rows[0]);
  },
  async updateFee(id, patch) {
    if (!/^[0-9a-f-]{36}$/i.test(id)) return null;
    const u = buildUpdate(patch as Record<string, unknown>, FEE_COLUMNS);
    if (!u) return (await this.listFees()).find((f) => f.id === id) ?? null;
    const rows = await q<Row>(`UPDATE import_fees SET ${u.set} WHERE id = $${u.values.length + 1} RETURNING *`, [...u.values, id]);
    return rows[0] ? toFee(rows[0]) : null;
  },
  async deleteFee(id) {
    if (!/^[0-9a-f-]{36}$/i.test(id)) return false;
    return (await q("DELETE FROM import_fees WHERE id = $1 RETURNING id", [id])).length > 0;
  },

  async listRequests() {
    return (await q<Row>("SELECT * FROM consultation_requests ORDER BY submitted_at DESC")).map(toRequest);
  },
  async createRequest(input: ConsultationInput) {
    const vehicle = input.vehicleId ? await this.getVehicle(input.vehicleId) : null;
    const rows = await q<Row>(
      "INSERT INTO consultation_requests (name, phone, vehicle_id, vehicle_title, message) VALUES ($1,$2,$3,$4,$5) RETURNING *",
      [input.name, input.phone, vehicle?.id ?? null, vehicle ? vehicleTitle(vehicle) : null, input.message ?? ""],
    );
    return toRequest(rows[0]);
  },
  async updateRequestStatus(id, status: RequestStatus) {
    if (!/^[0-9a-f-]{36}$/i.test(id)) return null;
    const rows = await q<Row>("UPDATE consultation_requests SET status = $1 WHERE id = $2 RETURNING *", [status, id]);
    return rows[0] ? toRequest(rows[0]) : null;
  },
  async deleteRequest(id) {
    if (!/^[0-9a-f-]{36}$/i.test(id)) return false;
    return (await q("DELETE FROM consultation_requests WHERE id = $1 RETURNING id", [id])).length > 0;
  },

  async getSettings(): Promise<SiteSettings> {
    return getKv("settings", { ...DEFAULT_SETTINGS, updatedAt: new Date().toISOString() });
  },
  async saveSettings(patch) {
    const merged = { ...(await this.getSettings()), ...patch, updatedAt: new Date().toISOString() };
    await setKv("settings", merged);
    return merged;
  },

  async getImportSettings(): Promise<ImportSettings> {
    return getKv("import_settings", { ...DEFAULT_IMPORT_SETTINGS });
  },
  async saveImportSettings(patch) {
    const merged = { ...(await this.getImportSettings()), ...patch };
    await setKv("import_settings", merged);
    return merged;
  },

  async stats() {
    const rows = await q<Row>(`SELECT
      (SELECT COUNT(*)::int FROM vehicles) AS vehicles,
      (SELECT COUNT(*)::int FROM vehicles WHERE is_published) AS published,
      (SELECT COUNT(*)::int FROM consultation_requests) AS requests,
      (SELECT COUNT(*)::int FROM consultation_requests WHERE status = 'pending') AS pending`);
    const r = rows[0];
    return { vehicles: r.vehicles, published: r.published, requests: r.requests, pendingRequests: r.pending };
  },
};
