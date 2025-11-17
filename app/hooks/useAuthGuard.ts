"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@/app/contexts/UserContext";

interface UseAuthGuardOptions {
  requireAuth?: boolean;
  redirectTo?: string;
  redirectIfAuthenticated?: string;
}

/**
 * Hook para proteger rutas basado en el estado de autenticación
 * 
 * @param requireAuth - Si es true, requiere que el usuario esté autenticado
 * @param redirectTo - Ruta a la que redirigir si requireAuth es true y el usuario no está autenticado (default: "/pages/login")
 * @param redirectIfAuthenticated - Ruta a la que redirigir si requireAuth es false y el usuario está autenticado (default: "/pages/login/landing")
 * 
 * @returns { loading: boolean } - Indica si aún se está verificando el estado de autenticación
 */
export function useAuthGuard({
  requireAuth = false,
  redirectTo = "/pages/login",
  redirectIfAuthenticated = "/pages/login/landing",
}: UseAuthGuardOptions = {}) {
  const { user, loading } = useUser();
  const router = useRouter();

  useEffect(() => {
    // Esperar a que termine la verificación de autenticación
    if (loading) return;

    if (requireAuth) {
      // Ruta protegida: requiere autenticación
      if (!user) {
        router.replace(redirectTo);
      }
    } else {
      // Ruta pública: no debe estar autenticado
      if (user) {
        router.replace(redirectIfAuthenticated);
      }
    }
  }, [user, loading, requireAuth, redirectTo, redirectIfAuthenticated, router]);

  return { loading };
}

