"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { authApi, usersApi } from "@/lib/api";
import { useAuthStore } from "@/lib/store";
import { User } from "@/types";

const COLORS = [
  "#3b82f6", "#ef4444", "#22c55e", "#eab308", "#a855f7",
  "#ec4899", "#06b6d4", "#f97316", "#6366f1", "#14b8a6",
];

export default function ProfilePage() {
  const router = useRouter();
  const { user, setAuth } = useAuthStore();
  const [profile, setProfile] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({
    name: "",
    phone: "",
    telegram: "",
    color: "#3b82f6",
  });
  const [hasChanges, setHasChanges] = useState(false);

  const loadProfile = async () => {
    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
      if (!token) {
        router.push("/login");
        return;
      }
      if (!user) {
        const u = await authApi.me();
        setAuth(u, token);
        setProfile(u);
        setForm({ name: u.name, phone: u.phone || "", telegram: u.telegram || "", color: u.color });
      } else {
        setProfile(user);
        setForm({ name: user.name, phone: user.phone || "", telegram: user.telegram || "", color: user.color });
      }
    } catch (err) {
      router.push("/login");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProfile();
  }, [user]);

  async function handleSave() {
    try {
      if (!profile) return;
      await usersApi.update(profile.id, form);
      const updated = await authApi.me();
      setAuth(updated, localStorage.getItem("token")!);
      setHasChanges(false);
    } catch (err: any) {
      alert(err.message);
    }
  }

  function handleCancel() {
    if (!profile) return;
    setForm({ name: profile.name, phone: profile.phone || "", telegram: profile.telegram || "", color: profile.color });
    setHasChanges(false);
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
      <h1 className="text-2xl font-bold mb-6">Профиль</h1>
      <Card>
        <CardHeader>
          <CardTitle>Информация</CardTitle>
          <CardDescription>@{profile?.username}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm">Имя</label>
            <Input
              value={form.name}
              onChange={(e) => { setForm({ ...form, name: e.target.value }); setHasChanges(true); }}
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm">Телефон</label>
            <Input
              value={form.phone}
              onChange={(e) => { setForm({ ...form, phone: e.target.value }); setHasChanges(true); }}
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm">Telegram</label>
            <Input
              value={form.telegram}
              onChange={(e) => { setForm({ ...form, telegram: e.target.value }); setHasChanges(true); }}
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm">Цвет</label>
            <div className="flex gap-2">
              {COLORS.map((c) => (
                <div
                  key={c}
                  className={`w-8 h-8 rounded-full cursor-pointer ${form.color === c ? "ring-2 ring-offset-2" : ""}`}
                  style={{ backgroundColor: c }}
                  onClick={() => { setForm({ ...form, color: c }); setHasChanges(true); }}
                />
              ))}
            </div>
          </div>
          <div className="flex gap-2">
            <Button onClick={handleSave} disabled={!hasChanges}>Сохранить</Button>
            <Button variant="outline" onClick={handleCancel} disabled={!hasChanges}>
              Отмена
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}