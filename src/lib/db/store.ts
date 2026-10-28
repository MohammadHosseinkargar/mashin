import type {
  ConsultationInput, ConsultationRequest, ExchangeRate, ImportFee, ImportFeeInput, ImportSettings,
  RequestStatus, SiteSettings, Vehicle, VehicleInput, VehicleQuery,
} from "../types";

export interface Stats {
  vehicles: number;
  published: number;
  requests: number;
  pendingRequests: number;
}

export interface Store {
  listVehicles(q?: VehicleQuery): Promise<{ items: Vehicle[]; total: number }>;
  getVehicle(id: string): Promise<Vehicle | null>;
  createVehicle(input: VehicleInput): Promise<Vehicle>;
  updateVehicle(id: string, patch: Partial<VehicleInput>): Promise<Vehicle | null>;
  deleteVehicle(id: string): Promise<boolean>;
  listBrands(publishedOnly: boolean): Promise<string[]>;
  /** دریافت خودروها با شناسه‌ی خارجی دسته‌ای (تطبیق سریع در همگام‌سازی) */
  listByExternalIds(ids: string[]): Promise<Vehicle[]>;

  getRate(): Promise<ExchangeRate>;
  setRate(rate: number, source: string, isManual: boolean): Promise<ExchangeRate>;

  listFees(): Promise<ImportFee[]>;
  createFee(input: ImportFeeInput): Promise<ImportFee>;
  updateFee(id: string, patch: Partial<ImportFeeInput>): Promise<ImportFee | null>;
  deleteFee(id: string): Promise<boolean>;

  listRequests(): Promise<ConsultationRequest[]>;
  createRequest(input: ConsultationInput): Promise<ConsultationRequest>;
  updateRequestStatus(id: string, status: RequestStatus): Promise<ConsultationRequest | null>;
  deleteRequest(id: string): Promise<boolean>;

  getSettings(): Promise<SiteSettings>;
  saveSettings(patch: Partial<Omit<SiteSettings, "updatedAt">>): Promise<SiteSettings>;

  getImportSettings(): Promise<ImportSettings>;
  saveImportSettings(patch: Partial<ImportSettings>): Promise<ImportSettings>;

  stats(): Promise<Stats>;
}

export function vehicleTitle(v: Pick<Vehicle, "brand" | "model" | "modelYear">): string {
  return `${v.brand} ${v.model} ${v.modelYear}`;
}

/** فیلتر و مرتب‌سازی مشترک (برای ذخیره‌ساز JSON) */
export function applyVehicleQuery(all: Vehicle[], q: VehicleQuery = {}): { items: Vehicle[]; total: number } {
  const s = q.search?.trim().toLowerCase();
  let list = all.filter((v) => {
    if (q.publishedOnly && !v.isPublished) return false;
    if (q.brand && v.brand !== q.brand) return false;
    if (q.fuelType && v.fuelType !== q.fuelType) return false;
    if (q.transmission && v.transmission !== q.transmission) return false;
    if (q.status && v.status !== q.status) return false;
    if (q.yearMin && v.modelYear < q.yearMin) return false;
    if (q.yearMax && v.modelYear > q.yearMax) return false;
    if (q.yearOnly && v.modelYear < 2022) return false;
    if (q.priceMin && v.aedPrice < q.priceMin) return false;
    if (q.priceMax && v.aedPrice > q.priceMax) return false;
    if (s && !`${v.brand} ${v.model} ${v.description}`.toLowerCase().includes(s)) return false;
    return true;
  });
  const sorters: Record<string, (a: Vehicle, b: Vehicle) => number> = {
    newest: (a, b) => b.createdAt.localeCompare(a.createdAt),
    price_asc: (a, b) => a.aedPrice - b.aedPrice,
    price_desc: (a, b) => b.aedPrice - a.aedPrice,
    year_desc: (a, b) => b.modelYear - a.modelYear,
    mileage_asc: (a, b) => a.mileage - b.mileage,
  };
  list = [...list].sort(sorters[q.sort ?? "newest"] ?? sorters.newest);
  const total = list.length;
  const offset = q.offset ?? 0;
  const limit = q.limit ?? 100;
  return { items: list.slice(offset, offset + limit), total };
}

export const DEFAULT_SETTINGS: Omit<SiteSettings, "updatedAt"> = {
  siteTitle: "ترنم شرق چابهار",
  siteDescription: "ترنم شرق چابهار؛ واردات خودرو از امارات با قیمت شفاف، حمل مطمئن و پیگیری تا ترخیص، از دروازه‌ی جنوب‌شرق ایران.",
  whatsappNumber: "",
  whatsappMessage: "سلام، برای مشاوره‌ی خرید خودرو از امارات پیام می‌دهم.",
  contactEmail: "",
  contactPhone: "",
  address: "چابهار، استان سیستان و بلوچستان",
};

export const DEFAULT_IMPORT_SETTINGS: ImportSettings = {
  enabled: false,
  lastSyncAt: null,
  lastError: null,
  cursorPage: 1,
  totalPages: 0,
  totalResults: 0,
  cursorFails: 0,
  totalImported: 0,
  totalUpdated: 0,
};
