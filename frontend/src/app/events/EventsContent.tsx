"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { authApi, eventsApi } from "@/lib/api";
import { useAuthStore } from "@/lib/store";
import { Event, ParticipationStatus } from "@/types";
import { X, Pencil, MapPin } from "lucide-react";

export function EventsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, setAuth } = useAuthStore();
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingEventId, setEditingEventId] = useState<number | null>(null);
  const [eventStatuses, setEventStatuses] = useState<Record<number, ParticipationStatus>>({});
  const [newEvent, setNewEvent] = useState({
    title: "",
    start_date: "",
    end_date: "",
    description: "",
    location: "",
  });

  const loadEvents = async () => {
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
      const data = await eventsApi.list();
      setEvents(data);
      const statuses: Record<number, ParticipationStatus> = {};
      data.forEach((event) => {
        const myParticipation = event.participations.find((p) => p.user_id === user?.id);
        if (myParticipation) {
          statuses[event.id] = myParticipation.status;
        }
      });
      setEventStatuses(statuses);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const date = searchParams.get("date");
    if (date) {
      setNewEvent((prev) => ({ ...prev, start_date: date, end_date: date }));
      setShowForm(true);
    }
    loadEvents();
  }, [searchParams]);

  async function handleCreateEvent() {
    try {
      await eventsApi.create(newEvent);
      setShowForm(false);
      setNewEvent({ title: "", start_date: "", end_date: "", description: "", location: "" });
      loadEvents();
    } catch (err: any) {
      alert(err.message);
    }
  }

  async function handleJoin(eventId: number) {
    try {
      await eventsApi.join(eventId);
      setEventStatuses((prev) => ({ ...prev, [eventId]: "going" }));
      loadEvents();
    } catch (err: any) {
      alert(err.message);
    }
  }

  async function handleLeave(eventId: number) {
    try {
      await eventsApi.leave(eventId);
      setEventStatuses((prev) => ({ ...prev, [eventId]: "not_going" }));
      loadEvents();
    } catch (err: any) {
      alert(err.message);
    }
  }

  async function handleUpdateEvent(eventId: number) {
    try {
      const event = events.find((e) => e.id === eventId);
      if (!event) return;
      await eventsApi.update(eventId, {
        title: event.title,
        start_date: event.start_date,
        end_date: event.end_date,
        description: event.description || undefined,
        location: event.location || undefined,
      });
      setEditingEventId(null);
      loadEvents();
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
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Поездки</h1>
        <Button onClick={() => setShowForm(true)}>Создать поездку</Button>
      </div>

      {events.length === 0 ? (
        <p className="text-muted-foreground">Нет запланированных поездок</p>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {events.map((event) => {
            const going = event.participations.filter((p) => p.status === "going");
            const notGoing = event.participations.filter((p) => p.status === "not_going");
            const isEditing = editingEventId === event.id;
            const currentStatus = eventStatuses[event.id];
            return (
              <Card key={event.id}>
                <CardHeader className="relative">
                  {isEditing ? (
                    <Input
                      value={event.title}
                      onChange={(e) => {
                        const updated = events.map((ev) => ev.id === event.id ? { ...ev, title: e.target.value } : ev);
                        setEvents(updated);
                      }}
                      className="text-lg font-bold"
                    />
                  ) : (
                    <CardTitle>
                      <Link href={`/events/${event.id}`} className="hover:underline">
                        {event.title}
                      </Link>
                    </CardTitle>
                  )}
                  <CardDescription>
                    {format(new Date(event.start_date), "d MMM", { locale: ru })} -{" "}
                    {format(new Date(event.end_date), "d MMM yyyy", { locale: ru })}
                  </CardDescription>
                  {(user?.id === event.author_id || user?.role === "admin") && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute top-2 right-2"
                      onClick={() => {
                        if (isEditing) {
                          handleUpdateEvent(event.id);
                        } else {
                          setEditingEventId(event.id);
                        }
                      }}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                  )}
                </CardHeader>
                <CardContent className="space-y-2">
                  {isEditing ? (
                    <>
                      <div className="space-y-2">
                        <label className="text-sm">Начало</label>
                        <Input
                          type="date"
                          value={event.start_date}
                          onChange={(e) => {
                            const updated = events.map((ev) => ev.id === event.id ? { ...ev, start_date: e.target.value } : ev);
                            setEvents(updated);
                          }}
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm">Конец</label>
                        <Input
                          type="date"
                          value={event.end_date}
                          onChange={(e) => {
                            const updated = events.map((ev) => ev.id === event.id ? { ...ev, end_date: e.target.value } : ev);
                            setEvents(updated);
                          }}
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm">Место</label>
                        <Input
                          value={event.location || ""}
                          onChange={(e) => {
                            const updated = events.map((ev) => ev.id === event.id ? { ...ev, location: e.target.value } : ev);
                            setEvents(updated);
                          }}
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm">Описание</label>
                        <Input
                          value={event.description || ""}
                          onChange={(e) => {
                            const updated = events.map((ev) => ev.id === event.id ? { ...ev, description: e.target.value } : ev);
                            setEvents(updated);
                          }}
                        />
                      </div>
                    </>
                  ) : (
                    <>
                      {event.location && <p className="text-sm">📍 {event.location}</p>}
                      {event.description && <p className="text-sm text-muted-foreground">{event.description}</p>}
                      <div className="flex gap-2 mt-2">
                        <span className="text-sm text-green-600">{going.length} едет</span>
                        <span className="text-sm text-red-600">{notGoing.length} не едет</span>
                      </div>
                    </>
                  )}
                </CardContent>
                {!isEditing && (
                  <CardFooter>
                    {currentStatus === "going" ? (
                      <Button variant="outline" size="sm" onClick={() => handleLeave(event.id)}>
                        Не еду
                      </Button>
                    ) : (
                      <Button size="sm" onClick={() => handleJoin(event.id)}>
                        Еду
                      </Button>
                    )}
                  </CardFooter>
                )}
              </Card>
            );
          })}
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center" onClick={() => setShowForm(false)}>
          <Card className="w-full max-w-md" onClick={(e) => e.stopPropagation()}>
            <CardHeader className="relative">
              <CardTitle>Новая поездка</CardTitle>
              <Button variant="ghost" size="icon" className="absolute top-2 right-2" onClick={() => setShowForm(false)}>
                <X className="h-4 w-4" />
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm">Название</label>
                <Input
                  value={newEvent.title}
                  onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })}
                  placeholder="Например: Поездка на озеро"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm">Начало</label>
                <Input
                  type="date"
                  value={newEvent.start_date}
                  onChange={(e) => setNewEvent({ ...newEvent, start_date: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm">Конец</label>
                <Input
                  type="date"
                  value={newEvent.end_date}
                  onChange={(e) => setNewEvent({ ...newEvent, end_date: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm">Место</label>
                <Input
                  value={newEvent.location}
                  onChange={(e) => setNewEvent({ ...newEvent, location: e.target.value })}
                  placeholder="Например: озеро Тургояк"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm">Описание</label>
                <Input
                  value={newEvent.description}
                  onChange={(e) => setNewEvent({ ...newEvent, description: e.target.value })}
                />
              </div>
              <div className="flex gap-2">
                <Button onClick={handleCreateEvent}>Создать</Button>
                <Button variant="outline" onClick={() => setShowForm(false)}>
                  Отмена
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}