"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, addMonths, subMonths, isWithinInterval, startOfYear, endOfYear, eachMonthOfInterval, startOfDay, isSameDay } from "date-fns";
import { ru } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { authApi, vacationsApi, eventsApi } from "@/lib/api";
import { useAuthStore } from "@/lib/store";
import { Vacation, Event, User, ParticipationStatus } from "@/types";
import { X, Users, MapPin } from "lucide-react";

const MONTH_NAMES = ["Январь", "Февраль", "Март", "Апрель", "Май", "Июнь", "Июль", "Август", "Сентябрь", "Октябрь", "Ноябрь", "Декабрь"];
const WEEK_DAYS = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"];

export default function CalendarPage() {
  const router = useRouter();
  const { user, setAuth } = useAuthStore();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<"month" | "year">("month");
  const [vacations, setVacations] = useState<Vacation[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);
  const [showVacationForm, setShowVacationForm] = useState(false);
  const [newVacation, setNewVacation] = useState({ start_date: "", end_date: "", description: "" });
  const [loading, setLoading] = useState(true);
  const [hiddenUsers, setHiddenUsers] = useState<number[]>([]);
  const [eventStatuses, setEventStatuses] = useState<Record<number, ParticipationStatus>>({});

  const loadData = useCallback(async () => {
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
      const [v, e, u] = await Promise.all([
        vacationsApi.list(),
        eventsApi.list(),
        authApi.me().then(() => []).catch(() => []),
      ]);
      setVacations(v);
      setEvents(e);
      const statuses: Record<number, ParticipationStatus> = {};
      e.forEach((event: Event) => {
        const myParticipation = event.participations.find((p) => p.user_id === user?.id);
        if (myParticipation) {
          statuses[event.id] = myParticipation.status;
        }
      });
      setEventStatuses(statuses);
    } catch (err) {
      router.push("/login");
    } finally {
      setLoading(false);
    }
  }, [router, user, setAuth]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });
  const startDay = daysInMonth[0].getDay() || 7;
  const paddingDays = Array(startDay - 1).fill(null);

  const getVacationsForDay = (day: Date) => {
    return vacations.filter((v) => {
      if (hiddenUsers.includes(v.user_id)) return false;
      const start = new Date(v.start_date);
      const end = new Date(v.end_date);
      return isWithinInterval(day, { start, end });
    });
  };

  const getEventsForDay = (day: Date) => {
    return events.filter((e) => {
      const start = startOfDay(new Date(e.start_date));
      const end = startOfDay(new Date(e.end_date));
      const dayNorm = startOfDay(day);
      return isSameDay(dayNorm, start) || isSameDay(dayNorm, end) || (dayNorm > start && dayNorm < end);
    });
  };

  async function handleCreateVacation() {
    try {
      await vacationsApi.create(newVacation);
      setShowVacationForm(false);
      setNewVacation({ start_date: "", end_date: "", description: "" });
      loadData();
    } catch (err: any) {
      alert(err.message);
    }
  }

  async function handleJoin(eventId: number) {
    try {
      await eventsApi.join(eventId);
      setEventStatuses((prev) => ({ ...prev, [eventId]: "going" }));
      loadData();
    } catch (err: any) {
      alert(err.message);
    }
  }

  async function handleLeave(eventId: number) {
    try {
      await eventsApi.leave(eventId);
      setEventStatuses((prev) => ({ ...prev, [eventId]: "not_going" }));
      loadData();
    } catch (err: any) {
      alert(err.message);
    }
  }

  function toggleUser(userId: number) {
    setHiddenUsers((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]
    );
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
        <h1 className="text-2xl font-bold">Календарь</h1>
        <div className="flex gap-2">
          <Button onClick={() => setShowVacationForm(true)}> + Отпуск</Button>
          <Button variant="outline" onClick={() => router.push("/events")}> + Поездка</Button>
          <Button variant={viewMode === "month" ? "default" : "outline"} onClick={() => setViewMode("month")}>
            Месяц
          </Button>
          <Button variant={viewMode === "year" ? "default" : "outline"} onClick={() => setViewMode("year")}>
            Год
          </Button>
        </div>
      </div>

      <div className="flex items-center justify-between mb-4">
        <Button variant="outline" onClick={() => setCurrentDate(subMonths(currentDate, 1))}>
          ←
        </Button>
        <h2 className="text-xl font-semibold">
          {viewMode === "month" ? format(currentDate, "MMMM yyyy", { locale: ru }) : currentDate.getFullYear()}
        </h2>
        <Button variant="outline" onClick={() => setCurrentDate(addMonths(currentDate, 1))}>
          →
        </Button>
      </div>

      {viewMode === "month" && (
        <>
          <div className="grid grid-cols-7 gap-1 mb-2">
            {WEEK_DAYS.map((day) => (
              <div key={day} className="text-center font-medium text-sm p-2">
                {day}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-1">
            {paddingDays.map((_, i) => (
              <div key={`pad-${i}`} className="min-h-[80px] bg-muted/20" />
            ))}
            {daysInMonth.map((day) => {
              const dayVacations = getVacationsForDay(day);
              const dayEvents = getEventsForDay(day);
              return (
                <div
                  key={day.toISOString()}
                  className="min-h-[80px] border p-1 cursor-pointer hover:bg-muted/30"
                  onClick={() => setSelectedDay(day)}
                >
                  <div className="text-sm font-medium">{format(day, "d")}</div>
                  {dayVacations.slice(0, 3).map((v, i) => (
                    <div
                      key={v.id}
                      className="text-xs px-1 truncate"
                      style={{ backgroundColor: v.user?.color || "#3b82f6", color: "#fff" }}
                    >
                      {v.user?.name}
                    </div>
                  ))}
                  {dayEvents.map((e) => (
                    <div key={e.id} className="text-xs bg-primary text-primary-foreground px-1 truncate">
                      🏍 {e.title}
                    </div>
                  ))}
                </div>
              );
            })}
          </div>
        </>
      )}

      {viewMode === "year" && (
        <div className="grid grid-cols-3 gap-4">
          {eachMonthOfInterval({
            start: startOfYear(currentDate),
            end: endOfYear(currentDate),
          }).map((month) => {
            const monthVacations = vacations.filter((v) => {
              const start = new Date(v.start_date);
              const end = new Date(v.end_date);
              return month.getMonth() === start.getMonth();
            });
            const monthEvents = events.filter((e) => {
              const start = new Date(e.start_date);
              return month.getMonth() === start.getMonth();
            });
            return (
              <div
                key={month.toISOString()}
                className="border p-2 cursor-pointer hover:bg-muted/30"
                onClick={() => {
                  setCurrentDate(month);
                  setViewMode("month");
                }}
              >
                <div className="font-medium">{MONTH_NAMES[month.getMonth()]}</div>
                <div className="text-sm text-muted-foreground">
                  {monthVacations.length} отпусков
                </div>
                {monthEvents.map((e) => (
                  <div key={e.id} className="text-sm text-primary">
                    🏍 {e.title} ({format(new Date(e.start_date), "d MMM")})
                  </div>
                ))}
              </div>
            );
          })}
        </div>
      )}

      {selectedDay && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center" onClick={() => setSelectedDay(null)}>
          <Card className="w-full max-w-lg max-h-[80vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <CardHeader className="relative">
              <CardTitle>{format(selectedDay, "d MMMM yyyy", { locale: ru })}</CardTitle>
              <Button variant="ghost" size="icon" className="absolute top-2 right-2" onClick={() => setSelectedDay(null)}>
                <X className="h-4 w-4" />
              </Button>
            </CardHeader>
            <CardContent>
              <div className="mb-4">
                <h3 className="font-medium mb-2">Отпуска</h3>
                {getVacationsForDay(selectedDay).length === 0 ? (
                  <p className="text-sm text-muted-foreground">Нет отпусков</p>
                ) : (
                  getVacationsForDay(selectedDay).map((v) => (
                    <div key={v.id} className="text-sm">
                      <span style={{ color: v.user?.color }}>{v.user?.name}</span>:{" "}
                      {format(new Date(v.start_date), "d.M")} - {format(new Date(v.end_date), "d.M")}
                      {v.description && <span className="text-muted-foreground"> ({v.description})</span>}
                    </div>
                  ))
                )}
              </div>
              <div className="mb-4">
                <h3 className="font-medium mb-2">Мероприятия</h3>
                {getEventsForDay(selectedDay).length === 0 ? (
                  <p className="text-sm text-muted-foreground">Нет мероприятий</p>
                ) : (
                  getEventsForDay(selectedDay).map((e) => {
                    const going = e.participations.filter((p) => p.status === "going");
                    const notGoing = e.participations.filter((p) => p.status === "not_going");
                    const currentStatus = eventStatuses[e.id];
                    return (
                      <div key={e.id} className="border rounded-lg p-3 mb-3">
                        <div className="font-medium">🏍 {e.title}</div>
                        <div className="text-sm text-muted-foreground">
                          {format(new Date(e.start_date), "d MMM")} - {format(new Date(e.end_date), "d MMM yyyy")}
                        </div>
                        {e.location && (
                          <div className="text-sm flex items-center gap-1 mt-1">
                            <MapPin className="h-3 w-3" /> {e.location}
                          </div>
                        )}
                        {e.description && (
                          <div className="text-sm text-muted-foreground mt-1">{e.description}</div>
                        )}
                        <div className="flex gap-2 mt-2">
                          {currentStatus === "going" ? (
                            <Button size="sm" variant="outline" onClick={() => handleLeave(e.id)}>
                              Не еду
                            </Button>
                          ) : (
                            <Button size="sm" onClick={() => handleJoin(e.id)}>
                              Еду
                            </Button>
                          )}
                        </div>
                        <div className="mt-2">
                          <div className="text-sm flex items-center gap-1">
                            <Users className="h-3 w-3" />{" "}
                            <span className="text-green-600">{going.length} едет</span>
                            <span className="text-red-600 ml-2">{notGoing.length} не едет</span>
                          </div>
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
                          <div className="flex flex-wrap gap-1 mt-1">
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
                        )}
                      </div>
                    );
                  })
                )}
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={() => {
                    setShowVacationForm(true);
                    setNewVacation({
                      start_date: format(selectedDay, "yyyy-MM-dd"),
                      end_date: format(selectedDay, "yyyy-MM-dd"),
                      description: "",
                    });
                  }}
                >
                  Добавить отпуск
                </Button>
                <Button variant="outline" onClick={() => router.push(`/events?date=${format(selectedDay, "yyyy-MM-dd")}`)}>
                  Создать поездку
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {showVacationForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center" onClick={() => setShowVacationForm(false)}>
          <Card className="w-full max-w-md" onClick={(e) => e.stopPropagation()}>
            <CardHeader className="relative">
              <CardTitle>Новый отпуск</CardTitle>
              <Button variant="ghost" size="icon" className="absolute top-2 right-2" onClick={() => setShowVacationForm(false)}>
                <X className="h-4 w-4" />
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm">Начало</label>
                <Input
                  type="date"
                  value={newVacation.start_date}
                  onChange={(e) => setNewVacation({ ...newVacation, start_date: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm">Конец</label>
                <Input
                  type="date"
                  value={newVacation.end_date}
                  onChange={(e) => setNewVacation({ ...newVacation, end_date: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm">Описание</label>
                <Input
                  value={newVacation.description}
                  onChange={(e) => setNewVacation({ ...newVacation, description: e.target.value })}
                  placeholder="Например: Отпуск"
                />
              </div>
              <div className="flex gap-2">
                <Button onClick={handleCreateVacation}>Сохранить</Button>
                <Button variant="outline" onClick={() => setShowVacationForm(false)}>
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