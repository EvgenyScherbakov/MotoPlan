"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { authApi, usersApi } from "@/lib/api";
import { useAuthStore } from "@/lib/store";
import { User } from "@/types";

export default function UserProfilePage() {
  const router = useRouter();
  const params = useParams();
  const { user, setAuth } = useAuthStore();
  const [profile, setProfile] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const userId = Number(params.id);

  useEffect(() => {
    async function load() {
      try {
        const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
        if (!token) {
          router.push("/login");
          return;
        }
        if (!user) {
          const u = await authApi.me();
          setAuth(u, token);
        }
        const data = await usersApi.get(userId);
        setProfile(data);
      } catch (err) {
        router.push("/calendar");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [userId, user, router, setAuth]);

  if (loading || !profile) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <p>Загрузка...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6">
      <Button variant="ghost" onClick={() => router.back()} className="mb-4">
        ← Назад
      </Button>
      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <div
              className="w-16 h-16 rounded-full"
              style={{ backgroundColor: profile.color }}
            />
            <div>
              <CardTitle>{profile.name}</CardTitle>
              <CardDescription>@{profile.username}</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {profile.phone && (
            <p>
              <span className="font-medium">Телефон:</span> {profile.phone}
            </p>
          )}
          {profile.telegram && (
            <p>
              <span className="font-medium">Telegram:</span> {profile.telegram}
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}