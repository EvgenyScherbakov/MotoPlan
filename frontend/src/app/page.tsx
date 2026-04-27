"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/lib/store";
import { authApi } from "@/lib/api";

export default function Home() {
  const router = useRouter();
  const { user, token, setAuth } = useAuthStore();

  useEffect(() => {
    async function loadAuth() {
      const storedToken = typeof window !== "undefined" ? localStorage.getItem("token") : null;
      if (storedToken && !user) {
        try {
          const userData = await authApi.me();
          setAuth(userData, storedToken);
        } catch {
          router.push("/login");
        }
      } else if (!storedToken) {
        router.push("/login");
      } else {
        router.push("/calendar");
      }
    }
    loadAuth();
  }, []);

  return (
    <div className="flex items-center justify-center min-h-[50vh]">
      <p className="text-muted-foreground">Загрузка...</p>
    </div>
  );
}