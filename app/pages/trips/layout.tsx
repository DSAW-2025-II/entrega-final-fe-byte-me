"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";

export default function TripsLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // Interceptar eventos de navegación hacia atrás
    const handlePopState = () => {
      if (pathname?.startsWith("/pages/trips")) {
        router.push("/pages/login/landing");
      }
    };

    window.addEventListener("popstate", handlePopState);

    return () => {
      window.removeEventListener("popstate", handlePopState);
    };
  }, [pathname, router]);

  return <>{children}</>;
}

