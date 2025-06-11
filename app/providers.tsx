"use client";

import { useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";

export function AnalyticsProvider() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    const url = pathname + searchParams.toString();
    (window as any).gtag?.("config", "G-ZH4ZGWTKDY", {
      page_path: url,
    });
  }, [pathname, searchParams]);

  return null;
}
