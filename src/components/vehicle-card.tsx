import Link from "next/link";
import { ArrowLeft, Fuel, Gauge, Settings2 } from "lucide-react";
import type { ImportFee, Vehicle } from "@/lib/types";
import { calcPrice } from "@/lib/pricing";
import { compactToman, FUEL_LABEL, formatAed, STATUS_LABEL, toFa, TRANS_LABEL, toFaPlain } from "@/lib/format";
import { Badge } from "./ui";
import { CarArt } from "./car-art";
import { Tilt } from "./motion";

export function VehicleCard({ vehicle: v, rate, fees }: { vehicle: Vehicle; rate: number; fees: ImportFee[] }) {
  const price = calcPrice(v.aedPrice, rate, fees);
  const tone = v.status === "available" ? "mint" : v.status === "order" ? "gold" : "rose";
  return (
    <Tilt className="h-full">
      <Link href={`/catalog/${v.id}`} className="group card-surface border-glow relative flex h-full flex-col overflow-hidden rounded-3xl transition-shadow duration-500 hover:shadow-[0_30px_60px_-20px_rgb(0_0_0/.8),0_0_0_1px_rgb(246_189_79/.25)]">
        <div className="relative aspect-[16/10] overflow-hidden">
          {v.images[0] ? (
            <img src={v.images[0]} alt={`${v.brand} ${v.model}`} loading="lazy" className="size-full object-cover transition-transform duration-700 group-hover:scale-110" />
          ) : (
            <CarArt brand={v.brand} className="size-full" />
          )}
          <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-surface to-transparent" />
          <div className="absolute start-3 top-3"><Badge tone={tone} className="backdrop-blur-md shrink-0">{STATUS_LABEL[v.status]}</Badge></div>
          <div className="absolute end-3 top-3 rounded-full bg-black/55 px-3 py-1 text-xs font-bold backdrop-blur-md shrink-0">{toFaPlain(v.modelYear)}</div>
        </div>
        <div className="flex flex-1 flex-col gap-4 p-5">
          <div>
            <p className="text-xs font-semibold text-gold">{v.brand}</p>
            <h3 className="mt-1 text-lg font-bold leading-snug truncate transition-colors group-hover:text-gold" dir="auto">{v.model}</h3>
          </div>
          <ul className="flex flex-wrap gap-x-4 gap-y-2 text-xs text-muted">
            <li className="flex items-center gap-1.5"><Gauge className="size-3.5 text-faint" />{toFa(v.mileage)} کیلومتر</li>
            <li className="flex items-center gap-1.5"><Fuel className="size-3.5 text-faint" />{FUEL_LABEL[v.fuelType]}</li>
            <li className="flex items-center gap-1.5"><Settings2 className="size-3.5 text-faint" />{TRANS_LABEL[v.transmission]}</li>
          </ul>
          <div className="mt-auto flex items-end justify-between gap-3 border-t border-line pt-4">
            <div>
              <p className="text-[11px] text-faint">برآورد قیمت نهایی در ایران</p>
              <p className="mt-0.5 text-base font-black gradient-text">{rate > 0 ? compactToman(price.totalToman) : "استعلام قیمت"}</p>
              <p className="text-[11px] text-faint">{formatAed(v.aedPrice)} در امارات</p>
            </div>
            <span className="grid size-10 place-items-center rounded-full bg-white/6 transition-all duration-300 group-hover:bg-gold group-hover:text-[#1a1204] group-hover:-translate-x-1">
              <ArrowLeft className="size-4" />
            </span>
          </div>
        </div>
      </Link>
    </Tilt>
  );
}
