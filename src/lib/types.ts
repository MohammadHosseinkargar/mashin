export type FuelType = "petrol" | "diesel" | "electric" | "hybrid";
export type Transmission = "manual" | "automatic";
export type VehicleStatus = "available" | "order" | "unavailable";
export type FeeType = "fixed" | "percentage";
export type FeeCurrency = "AED" | "Toman" | "Rial";
export type RequestStatus = "pending" | "contacted" | "converted";

export interface Vehicle {
  id: string;
  brand: string;
  model: string;
  modelYear: number;
  aedPrice: number;
  images: string[];
  specifications: Record<string, string | number | boolean>;
  mileage: number;
  engineCapacity: number;
  fuelType: FuelType;
  transmission: Transmission;
  features: string[];
  description: string;
  status: VehicleStatus;
  isPublished: boolean;
  createdAt: string;
  updatedAt: string;
}
export type VehicleInput = Omit<Vehicle, "id" | "createdAt" | "updatedAt">;

export interface ExchangeRate {
  rate: number; // تومان به ازای هر ۱ درهم
  source: string;
  isManual: boolean;
  lastUpdated: string;
}

export interface ImportFee {
  id: string;
  name: string;
  type: FeeType;
  value: number;
  currency: FeeCurrency;
  isEnabled: boolean;
  description: string;
  createdAt: string;
}
export type ImportFeeInput = Omit<ImportFee, "id" | "createdAt">;

export interface ConsultationRequest {
  id: string;
  name: string;
  phone: string;
  vehicleId: string | null;
  vehicleTitle: string | null;
  message: string;
  status: RequestStatus;
  submittedAt: string;
}
export type ConsultationInput = Pick<ConsultationRequest, "name" | "phone" | "message"> & {
  vehicleId?: string | null;
};

export interface SiteSettings {
  siteTitle: string;
  siteDescription: string;
  whatsappNumber: string;
  whatsappMessage: string;
  contactEmail: string;
  contactPhone: string;
  address: string;
  updatedAt: string;
}

export interface ImportSettings {
  enabled: boolean;
  lastSyncAt: string | null;
  lastError: string | null;
  /** شماره‌ی صفحه‌ای که دسته‌ی بعد از آن ادامه می‌دهد (چرخه‌ی کامل همه‌ی صفحه‌ها) */
  cursorPage: number;
  /** تعداد کل صفحه‌های نتایج؛ ۰ یعنی نامشخص */
  totalPages: number;
  /** مجموع نتایج جست‌وجو در Dubicars؛ ۰ یعنی نامشخص */
  totalResults: number;
  /** خطاهای پیاپی مسدودسازی روی صفحه‌ی جاری (جلوگیری از گیر کردن cursor) */
  cursorFails: number;
  totalImported: number;
  totalUpdated: number;
}

export interface VehicleQuery {
  publishedOnly?: boolean;
  search?: string;
  brand?: string;
  fuelType?: string;
  transmission?: string;
  status?: string;
  yearMin?: number;
  yearMax?: number;
  priceMin?: number; // درهم
  priceMax?: number; // درهم
  sort?: "newest" | "price_asc" | "price_desc" | "year_desc" | "mileage_asc";
  limit?: number;
  offset?: number;
}

export interface PriceLine {
  id: string;
  name: string;
  description: string;
  type: FeeType;
  rawValue: number;
  currency: FeeCurrency;
  amountToman: number;
}
export interface PriceBreakdown {
  aed: number;
  rate: number;
  baseToman: number;
  lines: PriceLine[];
  feesToman: number;
  totalToman: number;
}
