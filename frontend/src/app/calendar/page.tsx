"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, startOfDay, isSameDay, eachMonthOfInterval, endOfYear } from "date-fns";
import { ru } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { authApi, vacationsApi, eventsApi, ApiError } from "@/lib/api";
import { useAuthStore } from "@/lib/store";
import { Vacation, Event, User, ParticipationStatus } from "@/types";
import { X, Users, MapPin } from "lucide-react";
import { EventModal } from "@/components/EventModal";
import Holidays from "date-holidays";

const hd = new Holidays("RU");
const WEEK_DAYS = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"];

const isWeekend = (day: Date) => {
  const dayOfWeek = day.getDay();
  return dayOfWeek === 0 || dayOfWeek === 6;
};

const isHoliday = (day: Date) => {
  const holidays = hd.isHoliday(day);
  return holidays && holidays.length > 0;
};

export default function CalendarPage() {
  const router = useRouter();
  const { user, setAuth } = useAuthStore();
  const [vacations, setVacations] = useState<Vacation[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);
  const [showVacationForm, setShowVacationForm] = useState(false);
  const [showEventModal, setShowEventModal] = useState(false);
  const [newVacation, setNewVacation] = useState({ start_date: "", end_date: "", description: "" });
  const [loading, setLoading] = useState(true);
  const [hiddenUsers, setHiddenUsers] = useState<number[]>([]);
  const [eventStatuses, setEventStatuses] = useState<Record<number, ParticipationStatus>>({});

  const loadData = useCallback(async () => {
    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
      console.log("[Calendar] loadData: token exists =", !!token, "user exists =", !!user);
      if (!token) {
        router.push("/login");
        return;
      }
      let currentUser = user;
      if (!currentUser) {
        console.log("[Calendar] Fetching user data...");
        const u = await authApi.me();
        console.log("[Calendar] User data fetched:", u.username);
        setAuth(u, token);
        currentUser = u;
      }
      console.log("[Calendar] Fetching vacations and events...");
      const [v, e] = await Promise.all([
        vacationsApi.list(),
        eventsApi.list(),
      ]);
      console.log("[Calendar] Data fetched successfully");
      setVacations(v);
      setEvents(e);
      const statuses: Record<number, ParticipationStatus> = {};
      e.forEach((event: Event) => {
        const myParticipation = event.participations.find((p) => p.user_id === currentUser?.id);
        statuses[event.id] = myParticipation?.status ?? "not_answered";
      });
      setEventStatuses(statuses);
    } catch (err: any) {
      console.error("[Calendar] Error in loadData:", err);
      if (err instanceof ApiError && (err.status === 401 || err.status === 403)) {
        console.log("[Calendar] Auth error, redirecting to login");
        router.push("/login");
      } else {
        console.error("Failed to load calendar data:", err);
      }
    } finally {
      setLoading(false);
    }
  }, [router, user, setAuth]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const getVacationsForDay = (day: Date) => {
    return vacations.filter((v) => {
      if (hiddenUsers.includes(v.user_id)) return false;
      
      // Парсим даты отпуска из строк
      const [sy, sm, sd] = v.start_date.split('-').map(Number);
      const [ey, em, ed] = v.end_date.split('-').map(Number);
      const startDate = new Date(sy, sm - 1, sd);
      const endDate = new Date(ey, em - 1, ed);
      
      // Проверяем, попадает ли день в интервал (включая границы)
      const dayNorm = startOfDay(day);
      const startNorm = startOfDay(startDate);
      const endNorm = startOfDay(endDate);
      
      const result = dayNorm >= startNorm && dayNorm <= endNorm;
      
      // Отладочный вывод (только для первого отпуска и проблемных дней)
      if (v.id === 3 || v.id === 4) { // ID вашего отпуска
        console.log(`[Calendar] Vacation ${v.id}: ${v.start_date} - ${v.end_date}`);
        console.log(`[Calendar] Day: ${format(day, 'yyyy-MM-dd')}, DayNorm: ${dayNorm.toISOString()}`);
        console.log(`[Calendar] Start: ${format(startDate, 'yyyy-MM-dd')}, StartNorm: ${startNorm.toISOString()}`);
        console.log(`[Calendar] End: ${format(endDate, 'yyyy-MM-dd')}, EndNorm: ${endNorm.toISOString()}`);
        console.log(`[Calendar] Result (day >= start && day <= end): ${result}`);
        console.log(`[Calendar] dayNorm >= startNorm: ${dayNorm >= startNorm}, dayNorm <= endNorm: ${dayNorm <= endNorm}`);
      }
      
      return result;
    });
  };

  const getEventsForDay = (day: Date) => {
    return events.filter((e) => {
      if (!e.start_date || !e.end_date) return false;
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

  async function handleCancel(eventId: number) {
    try {
      await eventsApi.cancel(eventId);
      setEventStatuses((prev) => ({ ...prev, [eventId]: "not_answered" }));
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
          <Button variant="outline" onClick={() => setShowEventModal(true)}> + Поездка</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {eachMonthOfInterval({
          start: startOfMonth(new Date()),
          end: endOfYear(new Date())
        }).map((monthDate) => {
          const monthStart = startOfMonth(monthDate);
          const monthEnd = endOfMonth(monthDate);
          const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });
          const startDay = daysInMonth[0].getDay() || 7;
          const paddingDays = Array(startDay - 1).fill(null);
          return (
            <div key={monthDate.toISOString()}>
              <div className="text-center font-semibold mb-2">{format(monthDate, "MMMM yyyy", { locale: ru })}</div>
              <div className="grid grid-cols-7 gap-1 mb-2">
                {WEEK_DAYS.map((day) => (
                  <div key={day} className="text-center font-medium text-xs p-1">
                    {day}
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-7 gap-1">
                {paddingDays.map((_, i) => (
                  <div key={`pad-${monthDate.toISOString()}-${i}`} className="min-h-[60px] bg-muted/20" />
                ))}
                {daysInMonth.map((day) => {
                  const dayVacations = getVacationsForDay(day);
                  const dayEvents = getEventsForDay(day);
                  return (
                    <div
                      key={day.toISOString()}
                      className={`min-h-[60px] border p-1 cursor-pointer hover:bg-muted/30 ${
                        isHoliday(day)
                          ? "bg-red-100 dark:bg-red-900/30"
                          : isWeekend(day)
                          ? "bg-blue-50 dark:bg-blue-900/20"
                          : ""
                      }`}
                      onClick={() => setSelectedDay(day)}
                    >
                      <div className="text-sm font-medium">{format(day, "d")}</div>
                      {dayVacations.slice(0, 2).map((v) => (
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
            </div>
          );
        })}
      </div>

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
                  getEventsForDay(selectedDay).map((ev) => {
                    const going = ev.participations.filter((p) => p.status === "going");
                    const notGoing = ev.participations.filter((p) => p.status === "not_going");
                    const currentStatus = eventStatuses[ev.id];
                    return (
                      <div key={ev.id} className="border rounded-lg p-3 mb-3">
                        <div className="font-medium">🏍 {ev.title}</div>
                        <div className="text-sm text-muted-foreground">
                          {ev.start_date && ev.end_date ? (
                            <>
                              {format(new Date(ev.start_date), "d MMM")} - {format(new Date(ev.end_date), "d MMM yyyy")}
                            </>
                          ) : (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-800">
                              Без даты
                            </span>
                          )}
                        </div>
                        {ev.location && (
                          <div className="text-sm flex items-center gap-1 mt-1">
                            <MapPin className="h-3 w-3" />
                            {ev.location.startsWith("http") ? (
                              <a href={ev.location} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">
                                Место
                              </a>
                            ) : (
                              <span>{ev.location}</span>
                            )}
                          </div>
                        )}
                        {ev.route && (
                          <div className="text-sm flex items-center gap-1 mt-1">
                            <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
                              </svg>
                            {ev.route.startsWith("http") ? (
                              <a href={ev.route} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">
                                Маршрут
                              </a>
                            ) : (
                              <span>{ev.route}</span>
                            )}
                          </div>
                        )}
                        {ev.description && (
                          <div className="text-sm text-muted-foreground mt-1">{ev.description}</div>
                        )}
                        <div className="space-y-3 mt-3">
                          <div
                            className="w-full h-14 rounded-2xl relative cursor-pointer select-none overflow-hidden
                                   bg-white/20 backdrop-blur-xl border border-white/30
                                   shadow-[inset_0_1px_1px_rgba(255,255,255,0.4),0_4px_16px_rgba(0,0,0,0.1)]
                                   hover:shadow-[inset_0_1px_1px_rgba(255,255,255,0.6),0_8px_24px_rgba(0,0,0,0.15)]
                                   transition-all duration-300 ease-out"
                            onClick={(e) => {
                              const rect = e.currentTarget.getBoundingClientRect();
                              const clickX = e.clientX - rect.left;
                              const third = rect.width / 3;
                              if (clickX < third) {
                                handleJoin(ev.id);
                              } else if (clickX > 2 * third) {
                                handleLeave(ev.id);
                              } else {
                                handleCancel(ev.id);
                              }
                            }}
                          >
                            <div className="absolute inset-0 flex">
                              <div className={`w-1/3 transition-all duration-500 ${
                                currentStatus === "going" ? "bg-green-400/30 shadow-[0_0_30px_rgba(34,197,94,0.5)]" : "bg-green-400/10"
                              }`} />
                              <div className="w-1/3 bg-gray-200/50" />
                              <div className={`w-1/3 transition-all duration-500 ${
                                currentStatus === "not_going" ? "bg-red-400/30 shadow-[0_0_30px_rgba(239,68,68,0.5)]" : "bg-red-400/10"
                              }`} />
                            </div>
                            <div className={`absolute top-1 bottom-1 w-1/3 rounded-xl transition-all duration-300 ease-out ${
                              currentStatus === "going"
                                ? "left-0 bg-gradient-to-r from-green-400 via-green-500 to-emerald-400 shadow-[0_0_20px_rgba(34,197,94,0.6),inset_0_1px_0_rgba(255,255,255,0.5)]"
                                : currentStatus === "not_going"
                                ? "left-2/3 bg-gradient-to-r from-red-400 via-red-500 to-rose-400 shadow-[0_0_20px_rgba(239,68,68,0.6),inset_0_1px_0_rgba(255,255,255,0.5)]"
                                : "left-1/3 bg-gradient-to-r from-gray-300 via-gray-400 to-slate-300 shadow-[0_0_15px_rgba(148,163,184,0.4),inset_0_1px_0_rgba(255,255,255,0.6)]"
                            }`}>
                              <div className="absolute inset-0 rounded-xl bg-gradient-to-b from-white/30 to-transparent" />
                            </div>
                            <div className="absolute inset-0 flex items-center justify-around text-sm font-semibold pointer-events-none z-10">
                              <span className={`transition-all duration-300 ${
                                currentStatus === "going" ? "text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.3)] scale-105" : "text-green-900"
                              }`}>
                                ✓ Я в деле
                              </span>
                              <span className={`transition-all duration-300 ${
                                currentStatus === "not_answered" ? "text-gray-900 font-bold" : "text-gray-600"
                              }`}>
                                Едешь?
                              </span>
                              <span className={`transition-all duration-300 ${
                                currentStatus === "not_going" ? "text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.3)] scale-105" : "text-red-900"
                              }`}>
                                ✗ Нахер
                              </span>
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1">
                              <div className="flex items-center gap-1.5">
                                <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                                <h4 className="text-xs font-semibold text-green-800">Я в деле ({going.length})</h4>
                              </div>
                              <div className="flex flex-wrap gap-1">
                                {going.map((p) => (
                                  <span
                                    key={p.user.id}
                                    className="text-xs px-2.5 py-1 rounded-full text-white font-medium shadow-[0_2px_8px_rgba(0,0,0,0.15)] hover:scale-105 transition-transform"
                                    style={{ backgroundColor: p.user.color }}
                                  >
                                    {p.user.name}
                                  </span>
                                ))}
                              </div>
                            </div>
                            <div className="space-y-1">
                              <div className="flex items-center gap-1.5">
                                <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                                <h4 className="text-xs font-semibold text-red-800">Нахер ({notGoing.length})</h4>
                              </div>
                              <div className="flex flex-wrap gap-1">
                                {notGoing.map((p) => (
                                  <span
                                    key={p.user.id}
                                    className="text-xs px-2.5 py-1 rounded-full text-white font-medium opacity-90 shadow-[0_2px_8px_rgba(0,0,0,0.15)] hover:scale-105 transition-transform"
                                    style={{ backgroundColor: p.user.color }}
                                  >
                                    {p.user.name}
                                  </span>
                                ))}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
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

      <EventModal
        isOpen={showEventModal}
        onClose={() => setShowEventModal(false)}
        onSave={async (data) => {
          await eventsApi.create(data);
          loadData();
        }}
        mode="create"
      />
    </div>
  );
}