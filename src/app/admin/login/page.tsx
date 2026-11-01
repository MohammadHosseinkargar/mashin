"use client";

import { motion } from "motion/react";
import { Eye, EyeOff, Lock, LogIn, User } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { toast } from "sonner";
import { api } from "@/lib/client-api";
import { Button, Input } from "@/components/ui";
import { Logo } from "@/components/site-header";

function LoginForm() {
  const router = useRouter();
  const sp = useSearchParams();
  const [username, setU] = useState("");
  const [password, setP] = useState("");
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const [shake, setShake] = useState(0);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (loading) return;
    setLoading(true);
    try {
      await api("/api/admin/login", { method: "POST", json: { username, password } });
      // رفرش کامل صفحه برای اطمینان از اینکه کوکی نشست اعمال شده و میدلور recognising session است
      window.location.href = (sp.get("redirect") && sp.get("redirect")!.startsWith("/admin") && !sp.get("redirect")!.startsWith("//")) ? sp.get("redirect")! : "/admin";
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "ورود ناموفق بود.");
      setShake((s) => s + 1);
      setLoading(false);
    }
  }

  return (
    <motion.form
      key={shake} onSubmit={submit}
      initial={{ opacity: 0, y: 30, scale: 0.96 }} animate={shake ? { x: [0, -12, 12, -8, 8, 0], opacity: 1, y: 0, scale: 1 } : { opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: shake ? 0.45 : 0.7, ease: [0.22, 1, 0.36, 1] }}
      className="glass relative w-full max-w-md space-y-5 rounded-[2rem] p-8 shadow-2xl"
    >
      <div className="flex flex-col items-center gap-3 pb-2 text-center">
        <Logo title="ترنم شرق چابهار" />
        <p className="text-sm text-muted">برای ورود به پنل مدیریت، اطلاعات خود را وارد کنید.</p>
      </div>
      <label className="block space-y-2"><span className="text-sm text-muted">نام کاربری</span>
        <div className="relative"><User className="pointer-events-none absolute start-4 top-1/2 size-5 -translate-y-1/2 text-faint" /><Input required autoFocus dir="ltr" autoComplete="username" value={username} onChange={(e) => setU(e.target.value)} className="ps-12 text-end" /></div>
      </label>
      <label className="block space-y-2"><span className="text-sm text-muted">رمز عبور</span>
        <div className="relative"><Lock className="pointer-events-none absolute start-4 top-1/2 size-5 -translate-y-1/2 text-faint" />
          <Input required dir="ltr" type={show ? "text" : "password"} autoComplete="current-password" value={password} onChange={(e) => setP(e.target.value)} className="px-12 text-end" />
          <button type="button" onClick={() => setShow((s) => !s)} aria-label={show ? "پنهان کردن رمز" : "نمایش رمز"} className="absolute end-3 top-1/2 grid size-8 -translate-y-1/2 place-items-center rounded-lg text-faint hover:text-ink">{show ? <EyeOff className="size-5" /> : <Eye className="size-5" />}</button>
        </div>
      </label>
      <Button type="submit" size="lg" loading={loading} className="w-full"><LogIn className="size-5" />ورود</Button>
    </motion.form>
  );
}

export default function LoginPage() {
  return (
    <div className="noise relative isolate grid min-h-dvh place-items-center overflow-hidden p-4">
      <div className="bg-grid absolute inset-0 -z-10" />
      <div className="absolute start-[10%] top-[10%] -z-10 size-96 rounded-full bg-gold/15 blur-[120px] animate-float-slow" />
      <div className="absolute end-[10%] bottom-[10%] -z-10 size-96 rounded-full bg-sky/15 blur-[120px] animate-float" />
      <Suspense fallback={null}><LoginForm /></Suspense>
    </div>
  );
}
