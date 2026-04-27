"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Event } from "@/types";
import { X } from "lucide-react";

interface EventModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: {
    title: string;
    start_date: string;
    end_date: string;
    description: string;
    location: string;
    route: string;
  }) => Promise<void>;
  initialData?: Partial<Event>;
  mode: "create" | "edit";
}

export function EventModal({ isOpen, onClose, onSave, initialData, mode }: EventModalProps) {
  const [noDate, setNoDate] = useState(false);
  const [form, setForm] = useState({
    title: "",
    start_date: "",
    end_date: "",
    description: "",
    location: "",
    route: "",
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (initialData) {
      setForm({
        title: initialData.title || "",
        start_date: initialData.start_date || "",
        end_date: initialData.end_date || "",
        description: initialData.description || "",
        location: initialData.location || "",
        route: initialData.route || "",
      });
      setNoDate(!initialData.start_date && !initialData.end_date);
    } else {
      setForm({ title: "", start_date: "", end_date: "", description: "", location: "", route: "" });
      setNoDate(false);
    }
  }, [initialData, isOpen]);

  if (!isOpen) return null;

  async function handleSubmit() {
    if (!form.title.trim()) {
      alert("Введите название");
      return;
    }
    setSaving(true);
    try {
      await onSave({
        title: form.title,
        start_date: noDate ? "" : form.start_date,
        end_date: noDate ? "" : form.end_date,
        description: form.description,
        location: form.location,
        route: form.route,
      });
      onClose();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center" onClick={onClose}>
      <Card className="w-full max-w-md" onClick={(e) => e.stopPropagation()}>
        <CardHeader className="relative">
          <CardTitle>{mode === "create" ? "Новая поездка" : "Редактирование"}</CardTitle>
          <Button variant="ghost" size="icon" className="absolute top-2 right-2" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm">Название</label>
            <Input
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="Например: Поездка на озеро"
            />
          </div>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="noDate"
              checked={noDate}
              onChange={(e) => setNoDate(e.target.checked)}
              className="w-4 h-4"
            />
            <label htmlFor="noDate" className="text-sm">Без даты</label>
          </div>
          {!noDate && (
            <>
              <div className="space-y-2">
                <label className="text-sm">Начало</label>
                <Input
                  type="date"
                  value={form.start_date}
                  onChange={(e) => setForm({ ...form, start_date: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm">Конец</label>
                <Input
                  type="date"
                  value={form.end_date}
                  onChange={(e) => setForm({ ...form, end_date: e.target.value })}
                />
              </div>
            </>
          )}
          <div className="space-y-2">
            <label className="text-sm">Место</label>
            <Input
              value={form.location}
              onChange={(e) => setForm({ ...form, location: e.target.value })}
              placeholder="Например: озеро Тургояк"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm">Маршрут</label>
            <Input
              value={form.route}
              onChange={(e) => setForm({ ...form, route: e.target.value })}
              placeholder="Ссылка на маршрут"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm">Описание</label>
            <Textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
          </div>
          <div className="flex gap-2">
            <Button onClick={handleSubmit} disabled={saving}>
              {saving ? "Сохранение..." : mode === "create" ? "Создать" : "Сохранить"}
            </Button>
            <Button variant="outline" onClick={onClose}>
              Отмена
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}