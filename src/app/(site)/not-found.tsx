import { SearchX } from "lucide-react";
import { LinkButton } from "@/components/ui";

export default function NotFound() {
  return (
    <div className="mx-auto flex max-w-xl flex-col items-center gap-5 px-4 py-20 text-center sm:py-28">
      <div className="grid size-20 place-items-center rounded-3xl bg-gold/10 text-gold"><SearchX className="size-10" /></div>
      <h1 className="text-4xl font-black gradient-text">۴۰۴</h1>
      <p className="text-muted">صفحه‌ی موردنظر پیدا نشد یا دیگر در دسترس نیست.</p>
      <div className="flex gap-3"><LinkButton href="/">صفحه‌ی اصلی</LinkButton><LinkButton href="/catalog" variant="outline">کاتالوگ</LinkButton></div>
    </div>
  );
}
