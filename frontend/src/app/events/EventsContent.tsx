"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { authApi, eventsApi, vacationsApi } from "@/lib/api";
import { useAuthStore } from "@/lib/store";
import { Event, ParticipationStatus, Vacation } from "@/types";
import { X, Pencil, MapPin, Check, Trash2, Navigation } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { EventModal } from "@/components/EventModal";

export function EventsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, setAuth } = useAuthStore();
  const [events, setEvents] = useState<Event[]>([]);
  const [vacations, setVacations] = useState<Vacation[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingEventId, setEditingEventId] = useState<number | null>(null);
  const [eventStatuses, setEventStatuses] = useState<Record<number, ParticipationStatus>>({});

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
      const [eventsData, vacationsData] = await Promise.all([
        eventsApi.list(),
        vacationsApi.list()
      ]);
      setEvents(eventsData);
      setVacations(vacationsData);
      const statuses: Record<number, ParticipationStatus> = {};
      eventsData.forEach((event) => {
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
      setShowForm(true);
    }
    loadEvents();
  }, [searchParams]);

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
      const updateData: Record<string, string | undefined> = {
        title: event.title,
      };
      if (event.start_date) updateData.start_date = event.start_date;
      if (event.end_date) updateData.end_date = event.end_date;
      if (event.description) updateData.description = event.description;
      if (event.location) updateData.location = event.location;
      if (event.route) updateData.route = event.route;
      await eventsApi.update(eventId, updateData);
      setEditingEventId(null);
      loadEvents();
    } catch (err: any) {
      alert(err.message);
    }
  }

  async function handleDeleteVacation(vacationId: number) {
    if (!confirm("Удалить отпуск?")) return;
    try {
      await vacationsApi.delete(vacationId);
      loadEvents();
    } catch (err: any) {
      alert(err.message);
    }
  }

  async function handleDeleteEvent(eventId: number) {
    if (!confirm("Удалить поездку?")) return;
    try {
      await eventsApi.delete(eventId);
      loadEvents();
    } catch (err: any) {
      alert(err.message);
    }
  }

  async function handleDeleteAllUserVacations(userId: number) {
    if (!confirm("Удалить все отпуска этого пользователя?")) return;
    try {
      const userVacations = vacations.filter(v => v.user_id === userId);
      for (const v of userVacations) {
        await vacationsApi.delete(v.id);
      }
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
                    <div className="flex gap-3 text-sm">
                      {event.start_date && event.end_date ? (
                        <span>
                          {format(new Date(event.start_date), "d MMM", { locale: ru })}
                          {event.start_date !== event.end_date && (
                            <> - {format(new Date(event.end_date), "d MMM yyyy", { locale: ru })}</>
                          )}
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-800">
                          Без даты
                        </span>
                      )}
                    </div>
                  </CardDescription>
                  {(user?.id === event.author_id || user?.role === "admin") && (
                    <div className="absolute top-2 right-2 flex gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          if (isEditing) {
                            handleUpdateEvent(event.id);
                          } else {
                            setEditingEventId(event.id);
                          }
                        }}
                      >
                        {isEditing ? <Check className="h-4 w-4" /> : <Pencil className="h-4 w-4" />}
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeleteEvent(event.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </CardHeader>
                <CardContent className="space-y-2">
                  {isEditing ? (
                    <>
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            id={`noDate-${event.id}`}
                            checked={!event.start_date && !event.end_date}
                            onChange={(e) => {
                              const updated = events.map((ev) =>
                                ev.id === event.id
                                  ? { ...ev, start_date: e.target.checked ? "" : "", end_date: e.target.checked ? "" : "" }
                                  : ev
                              );
                              setEvents(updated);
                            }}
                            className="w-4 h-4"
                          />
                          <label htmlFor={`noDate-${event.id}`} className="text-sm">Без даты</label>
                        </div>
                        {event.start_date || event.end_date ? (
                          <div className="flex items-center gap-2">
                            <div className="space-y-1">
                              <label className="text-xs text-muted-foreground">Начало</label>
                              <Input
                                type="date"
                                value={event.start_date || ""}
                                onChange={(e) => {
                                  const updated = events.map((ev) => ev.id === event.id ? { ...ev, start_date: e.target.value } : ev);
                                  setEvents(updated);
                                }}
                                className="h-8 text-sm"
                              />
                            </div>
                            <div className="space-y-1">
                              <label className="text-xs text-muted-foreground">Конец</label>
                              <Input
                                type="date"
                                value={event.end_date || ""}
                                onChange={(e) => {
                                  const updated = events.map((ev) => ev.id === event.id ? { ...ev, end_date: e.target.value } : ev);
                                  setEvents(updated);
                                }}
                                className="h-8 text-sm"
                              />
                            </div>
                          </div>
                        ) : null}
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
                        <label className="text-sm">Маршрут</label>
                        <Input
                          value={event.route || ""}
                          onChange={(e) => {
                            const updated = events.map((ev) => ev.id === event.id ? { ...ev, route: e.target.value } : ev);
                            setEvents(updated);
                          }}
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm">Описание</label>
                        <Textarea
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
                      {event.location && (
                        event.location.startsWith("http") ? (
                          <a href={event.location} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-500 hover:underline flex items-center gap-1">
                            <MapPin className="h-3 w-3" /> Место
                          </a>
                        ) : (
                          <p className="text-sm flex items-center gap-1">
                            <MapPin className="h-3 w-3" /> {event.location}
                          </p>
                        )
                      )}
                      {event.route && (
                        <a href={event.route} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-500 hover:underline flex items-center gap-1">
                          <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
                          </svg>
                          Маршрут
                        </a>
                      )}
                      {event.description && (
                        <div className="text-sm text-muted-foreground prose prose-sm dark:prose-invert">
                          <ReactMarkdown remarkPlugins={[remarkGfm]}>{event.description}</ReactMarkdown>
                        </div>
                      )}
                      <div className="flex gap-2 mt-2">
                        <span className="text-sm text-green-600">{going.length} едет</span>
                        <span className="text-sm text-red-600">{notGoing.length} не едет</span>
                      </div>
                      {going.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-1">
                          {going.map((p) => (
                            <div
                              key={p.user.id}
                              className="text-xs px-1 py-0.5 rounded"
                              style={{ backgroundColor: p.user.color, color: "#fff" }}
                            >
                              {p.user.name}
                            </div>
                          ))}
                        </div>
                      )}
                      {notGoing.length > 0 && (
                        <>
                          <div className="border-t my-2" />
                          <div className="flex flex-wrap gap-1">
                            {notGoing.map((p) => (
                              <div
                                key={p.user.id}
                                className="text-xs px-1 py-0.5 rounded opacity-60"
                                style={{ backgroundColor: p.user.color, color: "#fff" }}
                              >
                                {p.user.name}
                              </div>
                            ))}
                          </div>
                        </>
                      )}
                    </>
                  )}
                </CardContent>
                {!isEditing && (
                  <CardFooter className="justify-start pt-0">
                    <div className="flex gap-2">
                      <Button
                        variant={currentStatus === "going" ? "default" : "outline"}
                        size="sm"
                        onClick={() => handleJoin(event.id)}
                      >
                        Еду
                      </Button>
                      <Button
                        variant={currentStatus === "not_going" ? "default" : "outline"}
                        size="sm"
                        onClick={() => handleLeave(event.id)}
                      >
                        Не еду
                      </Button>
                    </div>
                  </CardFooter>
                )}
              </Card>
            );
          })}
        </div>
      )}

      <div className="mt-8">
        <h2 className="text-xl font-bold mb-4">Отпуска</h2>
        {vacations.length === 0 ? (
          <p className="text-muted-foreground">Нет запланированных отпусков</p>
        ) : (
          <div className="space-y-2">
            {(() => {
              const grouped: Record<number, Vacation[]> = {};
              vacations.forEach((v) => {
                if (!grouped[v.user_id]) grouped[v.user_id] = [];
                grouped[v.user_id].push(v);
              });
              return Object.entries(grouped).map(([userId, userVacations]) => {
                const firstUser = userVacations[0].user;
                const canDelete = parseInt(userId) === user?.id || user?.role === "admin";
                return (
                  <div key={userId} className="border rounded-lg p-3">
                    <div className="font-medium flex items-center justify-between">
                      <span style={{ color: firstUser?.color }}>{firstUser?.name || "Пользователь"}</span>
                      {canDelete && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteAllUserVacations(parseInt(userId))}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                    <div className="text-sm text-muted-foreground mt-1">
                      {userVacations.map((v) => (
                        <div key={v.id} className="flex items-center gap-2">
                          <span>
                            {format(new Date(v.start_date), "d MMM")} - {format(new Date(v.end_date), "d MMM yyyy")}
                            {v.description && <span> ({v.description})</span>}
                          </span>
                          {canDelete && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 w-6 p-0"
                              onClick={() => handleDeleteVacation(v.id)}
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                );
              });
            })()}
          </div>
        )}
      </div>

      <EventModal
        isOpen={showForm}
        onClose={() => setShowForm(false)}
        onSave={async (data) => {
          await eventsApi.create(data);
          loadEvents();
        }}
        mode="create"
      />
    </div>
  );
}