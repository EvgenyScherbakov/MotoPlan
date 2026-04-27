"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { authApi, usersApi } from "@/lib/api";
import { useAuthStore } from "@/lib/store";
import { User } from "@/types";

export default function AdminPage() {
  const router = useRouter();
  const { user, setAuth } = useAuthStore();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  const loadUsers = async () => {
    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
      if (!token) {
        router.push("/login");
        return;
      }
      if (!user) {
        const u = await authApi.me();
        setAuth(u, token);
        if (u.role !== "admin") {
          router.push("/calendar");
          return;
        }
      } else if (user.role !== "admin") {
        router.push("/calendar");
        return;
      }
      const data = await usersApi.list();
      setUsers(data);
    } catch (err) {
      router.push("/login");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, [user, router, setAuth]);

  async function handleDelete(userId: number) {
    if (!confirm("Удалить пользователя?")) return;
    try {
      await usersApi.delete(userId);
      loadUsers();
    } catch (err: any) {
      alert(err.message);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <p>Загрузка...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold mb-6">Управление пользователями</h1>
      <Card>
        <CardHeader>
          <CardTitle>Все пользователи</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {users.map((u) => (
              <div key={u.id} className="flex items-center justify-between p-2 border">
                <div className="flex items-center gap-2">
                  <div
                    className="w-8 h-8 rounded-full"
                    style={{ backgroundColor: u.color }}
                  />
                  <div>
                    <p className="font-medium">{u.name}</p>
                    <p className="text-sm text-muted-foreground">@{u.username}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm">{u.role}</span>
                  <Button variant="outline" onClick={() => router.push(`/profile/${u.id}`)}>
                    Профиль
                  </Button>
                  {u.id !== user?.id && (
                    <Button variant="destructive" size="sm" onClick={() => handleDelete(u.id)}>
                      Удалить
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}