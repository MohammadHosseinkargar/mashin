import { promises as fs } from "fs";
import path from "path";
import { randomUUID } from "crypto";
import type {
  ConsultationInput, ConsultationRequest, ExchangeRate, ImportFee, ImportFeeInput, ImportSettings,
  RequestStatus, SiteSettings, Vehicle, VehicleInput, VehicleQuery,
} from "../types";
import { applyVehicleQuery, DEFAULT_IMPORT_SETTINGS, DEFAULT_SETTINGS, vehicleTitle, type Store } from "./store";
import { SEED_FEES, SEED_VEHICLES } from "./seed";

interface DbFile {
  vehicles: Vehicle[];
  fees: ImportFee[];
  requests: ConsultationRequest[];
  rate: ExchangeRate;
  settings: SiteSettings;
  importSettings: ImportSettings;
}

const FILE = path.join(process.cwd(), ".data", "db.json");
const g = globalThis as unknown as { __jsonLock?: Promise<unknown> };

const now = () => new Date().toISOString();

function seed(): DbFile {
  const t = now();
  return {
    vehicles: SEED_VEHICLES.map((v, i) => ({
      ...v,
      id: randomUUID(),
      createdAt: new Date(Date.now() - i * 3_600_000).toISOString(),
      updatedAt: t,
    })),
    fees: SEED_FEES.map((f) => ({ ...f, id: randomUUID(), createdAt: t })),
    requests: [],
    rate: { rate: 17000, source: "مقدار نمونه (دستی)", isManual: true, lastUpdated: t },
    settings: { ...DEFAULT_SETTINGS, updatedAt: t },
    importSettings: { ...DEFAULT_IMPORT_SETTINGS },
  };
}

async function readRaw(): Promise<DbFile | null> {
  try {
    return JSON.parse(await fs.readFile(FILE, "utf8")) as DbFile;
  } catch (e) {
    if ((e as NodeJS.ErrnoException).code === "ENOENT") return null;
    // فایل خراب است: نسخه‌ی پشتیبان بگیر و از نو بساز
    try { await fs.rename(FILE, `${FILE}.corrupt-${Date.now()}`); } catch {}
    return null;
  }
}

async function write(db: DbFile): Promise<void> {
  await fs.mkdir(path.dirname(FILE), { recursive: true });
  const tmp = `${FILE}.${randomUUID()}.tmp`;
  await fs.writeFile(tmp, JSON.stringify(db, null, 2), "utf8");
  await fs.rename(tmp, FILE);
}

/** همه‌ی عملیات‌های نوشتن (و ساخت اولیه) پشت‌سرهم اجرا می‌شوند تا داده‌ای گم نشود. */
function locked<T>(fn: () => Promise<T>): Promise<T> {
  const next = (g.__jsonLock ?? Promise.resolve()).then(fn, fn);
  g.__jsonLock = next.catch(() => undefined);
  return next;
}

async function read(): Promise<DbFile> {
  const existing = await readRaw();
  if (existing) return existing;
  return locked(async () => {
    const again = await readRaw();
    if (again) return again;
    const fresh = seed();
    await write(fresh);
    return fresh;
  });
}

function mutate<T>(fn: (db: DbFile) => T | Promise<T>): Promise<T> {
  return locked(async () => {
    const db = (await readRaw()) ?? seed();
    const result = await fn(db);
    await write(db);
    return result;
  });
}

export const jsonStore: Store = {
  async listVehicles(q: VehicleQuery = {}) {
    return applyVehicleQuery((await read()).vehicles, q);
  },
  async getVehicle(id) {
    return (await read()).vehicles.find((v) => v.id === id) ?? null;
  },
  createVehicle: (input: VehicleInput) =>
    mutate((db) => {
      const v: Vehicle = { ...input, id: randomUUID(), createdAt: now(), updatedAt: now() };
      db.vehicles.unshift(v);
      return v;
    }),
  updateVehicle: (id, patch) =>
    mutate((db) => {
      const i = db.vehicles.findIndex((v) => v.id === id);
      if (i < 0) return null;
      db.vehicles[i] = { ...db.vehicles[i], ...patch, id, updatedAt: now() };
      return db.vehicles[i];
    }),
  deleteVehicle: (id) =>
    mutate((db) => {
      const before = db.vehicles.length;
      db.vehicles = db.vehicles.filter((v) => v.id !== id);
      db.requests = db.requests.map((r) => (r.vehicleId === id ? { ...r, vehicleId: null } : r));
      return db.vehicles.length < before;
    }),
  async listBrands(publishedOnly) {
    const set = new Set((await read()).vehicles.filter((v) => !publishedOnly || v.isPublished).map((v) => v.brand));
    return [...set].sort((a, b) => a.localeCompare(b, "fa"));
  },
  async listByExternalIds(ids) {
    if (!ids.length) return [];
    const set = new Set(ids.map(String));
    return (await read()).vehicles.filter((v) => set.has(String(v.specifications.externalId ?? "")));
  },

  async getRate() {
    return (await read()).rate;
  },
  setRate: (rate, source, isManual) =>
    mutate((db) => {
      db.rate = { rate, source, isManual, lastUpdated: now() };
      return db.rate;
    }),

  async listFees() {
    return (await read()).fees;
  },
  createFee: (input: ImportFeeInput) =>
    mutate((db) => {
      const f: ImportFee = { ...input, id: randomUUID(), createdAt: now() };
      db.fees.push(f);
      return f;
    }),
  updateFee: (id, patch) =>
    mutate((db) => {
      const i = db.fees.findIndex((f) => f.id === id);
      if (i < 0) return null;
      db.fees[i] = { ...db.fees[i], ...patch, id };
      return db.fees[i];
    }),
  deleteFee: (id) =>
    mutate((db) => {
      const before = db.fees.length;
      db.fees = db.fees.filter((f) => f.id !== id);
      return db.fees.length < before;
    }),

  async listRequests() {
    return [...(await read()).requests].sort((a, b) => b.submittedAt.localeCompare(a.submittedAt));
  },
  createRequest: (input: ConsultationInput) =>
    mutate((db) => {
      const vehicle = input.vehicleId ? db.vehicles.find((v) => v.id === input.vehicleId) : undefined;
      const r: ConsultationRequest = {
        id: randomUUID(),
        name: input.name,
        phone: input.phone,
        message: input.message ?? "",
        vehicleId: vehicle?.id ?? null,
        vehicleTitle: vehicle ? vehicleTitle(vehicle) : null,
        status: "pending",
        submittedAt: now(),
      };
      db.requests.unshift(r);
      return r;
    }),
  updateRequestStatus: (id, status: RequestStatus) =>
    mutate((db) => {
      const r = db.requests.find((x) => x.id === id);
      if (!r) return null;
      r.status = status;
      return r;
    }),
  deleteRequest: (id) =>
    mutate((db) => {
      const before = db.requests.length;
      db.requests = db.requests.filter((r) => r.id !== id);
      return db.requests.length < before;
    }),

  async getSettings() {
    return { ...DEFAULT_SETTINGS, ...(await read()).settings };
  },
  saveSettings: (patch) =>
    mutate((db) => {
      db.settings = { ...DEFAULT_SETTINGS, ...db.settings, ...patch, updatedAt: now() };
      return db.settings;
    }),

  async getImportSettings() {
    return { ...DEFAULT_IMPORT_SETTINGS, ...(await read()).importSettings };
  },
  saveImportSettings: (patch) =>
    mutate((db) => {
      db.importSettings = { ...DEFAULT_IMPORT_SETTINGS, ...db.importSettings, ...patch };
      return db.importSettings;
    }),

  async stats() {
    const db = await read();
    return {
      vehicles: db.vehicles.length,
      published: db.vehicles.filter((v) => v.isPublished).length,
      requests: db.requests.length,
      pendingRequests: db.requests.filter((r) => r.status === "pending").length,
    };
  },
};
