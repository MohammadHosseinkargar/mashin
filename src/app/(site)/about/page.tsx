import type { Metadata } from "next";
import { Eye, Gem, Scale, Target } from "lucide-react";
import { Reveal, Stagger, StaggerItem } from "@/components/motion";
import { LinkButton, SectionTitle } from "@/components/ui";
import { Faq } from "@/components/faq";

export const metadata: Metadata = { title: "درباره ما", description: "با مستقر خودرو و روش شفاف ما در واردات خودرو از امارات آشنا شوید." };

const VALUES = [
  { icon: Eye, title: "شفافیت", text: "همه‌ی هزینه‌ها پیش از خرید روی میز است؛ هیچ هزینه‌ی پنهانی وجود ندارد." },
  { icon: Scale, title: "صداقت", text: "وضعیت واقعی خودرو و سوابق آن را همان‌طور که هست به شما می‌گوییم." },
  { icon: Gem, title: "کیفیت", text: "فقط خودروهایی را پیشنهاد می‌دهیم که خودمان با خیال راحت می‌خریم." },
  { icon: Target, title: "تعهد", text: "تا تحویل نهایی خودرو، پیگیر پرونده‌ی شما هستیم." },
];
const FAQ = [
  { q: "قیمت نهایی چطور محاسبه می‌شود؟", a: "قیمت درهمی خودرو در نرخ روز درهم ضرب می‌شود و سپس هزینه‌های حمل، بیمه، ترخیص و کارمزد خدمات به آن افزوده می‌شود. جزئیات هر خودرو در صفحه‌ی همان خودرو نمایش داده می‌شود." },
  { q: "آیا قیمت‌های نمایش‌داده‌شده قطعی است؟", a: "قیمت‌ها برآوردی هستند و به نرخ روز ارز و شرایط ترخیص وابسته‌اند. پیش از هر پرداخت، قیمت قطعی به‌صورت مکتوب به شما اعلام می‌شود." },
  { q: "چقدر طول می‌کشد تا خودرو تحویل شود؟", a: "زمان تحویل به نوع خودرو، حمل و ترخیص بستگی دارد. کارشناس ما زمان‌بندی دقیق را هنگام ثبت سفارش اعلام می‌کند." },
  { q: "اگر خودروی مدنظرم در کاتالوگ نبود چه کنم؟", a: "فرم درخواست مشاوره را پر کنید؛ خودروی موردنظر شما را در بازار امارات جست‌وجو و بهترین گزینه‌ها را پیشنهاد می‌دهیم." },
];

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-5xl px-4 pt-32 sm:px-6 sm:pt-40">
      <Reveal>
        <SectionTitle eyebrow="درباره ما" title={<>واردات خودرو، <span className="gradient-text">بدون ابهام</span></>} text="مستقر خودرو با یک هدف ساده شکل گرفت: خرید خودرو از امارات باید به اندازه‌ی خرید از یک نمایشگاه معتبر، شفاف و قابل‌اعتماد باشد." />
      </Reveal>
      <Reveal delay={0.1}>
        <p className="mb-14 max-w-3xl leading-9 text-muted">ما فرایند انتخاب، بازرسی، خرید، حمل و ترخیص را برای شما مدیریت می‌کنیم و قیمت نهایی را با نرخ روز و تمام هزینه‌ها، از همان ابتدا نشان می‌دهیم تا تصمیم‌گیری برایتان ساده و بی‌دغدغه باشد.</p>
      </Reveal>

      <Stagger className="grid gap-5 sm:grid-cols-2">
        {VALUES.map((v) => (
          <StaggerItem key={v.title} className="card-surface border-glow group flex gap-5 rounded-3xl p-6 transition-transform duration-500 hover:-translate-y-1.5">
            <span className="grid size-14 shrink-0 place-items-center rounded-2xl bg-gold/12 text-gold transition-transform duration-500 group-hover:rotate-6 group-hover:scale-110"><v.icon className="size-7" /></span>
            <div><h3 className="mb-2 text-lg font-bold">{v.title}</h3><p className="text-sm leading-7 text-muted">{v.text}</p></div>
          </StaggerItem>
        ))}
      </Stagger>

      <section className="mt-24">
        <Reveal><SectionTitle center eyebrow="پرسش‌های متداول" title="هر چه باید بدانید" /></Reveal>
        <Reveal><Faq items={FAQ} /></Reveal>
      </section>

      <Reveal>
        <div className="mt-20 flex flex-col items-center gap-5 rounded-[2rem] border border-gold/20 bg-gradient-to-b from-gold/10 to-transparent p-10 text-center">
          <h2 className="text-2xl font-black">آماده‌اید خودروی بعدی‌تان را پیدا کنیم؟</h2>
          <div className="flex flex-wrap justify-center gap-3"><LinkButton href="/catalog" size="lg">کاتالوگ خودرو</LinkButton><LinkButton href="/contact" variant="outline" size="lg">تماس با ما</LinkButton></div>
        </div>
      </Reveal>
    </div>
  );
}
