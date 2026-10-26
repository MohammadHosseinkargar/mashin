"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui";

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => { console.error(error); }, [error]);
  return (
    <div className="mx-auto flex min-h-dvh max-w-md flex-col items-center justify-center gap-4 px-4 text-center">
      <h1 className="text-2xl font-black">مشکلی پیش آمد</h1>
      <p className="text-muted">خطایی غیرمنتظره رخ داد. لطفاً دوباره تلاش کنید.</p>
      <Button onClick={reset}>تلاش دوباره</Button>
    </div>
  );
}
