import { PageHeader } from "@/components/admin-shell";
import { VehicleForm } from "@/components/vehicle-form";

export const metadata = { title: "افزودن خودرو" };

export default function NewVehiclePage() {
  return (<><PageHeader title="افزودن خودرو" text="اطلاعات خودرو را وارد کنید." /><VehicleForm /></>);
}
