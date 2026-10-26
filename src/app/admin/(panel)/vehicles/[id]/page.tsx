import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { PageHeader } from "@/components/admin-shell";
import { VehicleForm } from "@/components/vehicle-form";

export const metadata = { title: "ویرایش خودرو" };
export const dynamic = "force-dynamic";

export default async function EditVehiclePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const v = await db.getVehicle(id);
  if (!v) notFound();
  return (<><PageHeader title={`ویرایش ${v.brand} ${v.model}`} /><VehicleForm vehicle={v} /></>);
}
