"use client";

import { useEffect } from "react";

export function GlobalHeadScript() {
  useEffect(() => {
    // iOS Safari viewport shrink when keyboard opens — prevent jumpy resizing
    const setViewport = () => {
      const v = document.querySelector("meta[name=viewport]");
      if (!v) return;
      // dynamic viewport fit so that Safari does not shrink on keyboard
      v.setAttribute("content", "width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover");
    };
    setViewport();
    window.addEventListener("resize", setViewport, { passive: true });
    window.addEventListener("focus", setViewport, { passive: true });
    return () => {
      window.removeEventListener("resize", setViewport);
      window.removeEventListener("focus", setViewport);
    };
  }, []);

  return (
    <>
      <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover" />
      <link rel="manifest" href="/manifest.json" />
      <link rel="apple-touch-icon" href="/icon-192.png" />
      <meta name="apple-mobile-web-app-capable" content="yes" />
      <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
      <meta name="apple-mobile-web-app-title" content="ترنم شرق" />
      <link rel="mask-icon" href="/safari-pinned-tab.svg" color="#f6bd4f" />
      <meta name="theme-color" content="#070a12" />
    </>
  );
}
