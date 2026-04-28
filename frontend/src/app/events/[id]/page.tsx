"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { MapPin } from "lucide-react";
import { authApi, eventsApi, usersApi } from "@/lib/api";
import { useAuthStore } from "@/lib/store";
import { Event, ParticipationStatus, User } from "@/types";

export default function EventDetailPage() {
  const router = useRouter();
  const params = useParams();
  const { user, setAuth } = useAuthStore();
  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentUserStatus, setCurrentUserStatus] = useState<ParticipationStatus | null>(null);

  const eventId = Number(params.id);

  const loadEvent = async () => {
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
      const data = await eventsApi.get(eventId);
      setEvent(data);
      const myParticipation = data.participations.find((p) => p.user_id === user?.id);
      if (myParticipation) {
        setCurrentUserStatus(myParticipation.status);
      }
    } catch (err) {
      console.error(err);
      router.push("/events");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEvent();
  }, [eventId, user]);

  async function handleJoin() {
    try {
      await eventsApi.join(eventId);
      setCurrentUserStatus("going");
      loadEvent();
    } catch (err: any) {
      alert(err.message);
    }
  }

  async function handleLeave() {
    try {
      await eventsApi.leave(eventId);
      setCurrentUserStatus("not_going");
      loadEvent();
    } catch (err: any) {
      alert(err.message);
    }
  }

  async function handleCancel() {
    try {
      await eventsApi.cancel(eventId);
      setCurrentUserStatus("not_answered");
      loadEvent();
    } catch (err: any) {
      alert(err.message);
    }
  }

  if (loading || !event) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <p>Загрузка...</p>
      </div>
    );
  }

  const going = event.participations.filter((p) => p.status === "going");
  const notGoing = event.participations.filter((p) => p.status === "not_going");
  const notAnswered = event.participations.filter((p) => p.status === "not_answered");

  return (
    <div className="container mx-auto px-4 py-6">
      <Button variant="ghost" onClick={() => router.push("/events")} className="mb-4">
        ← Назад
      </Button>
      <Card>
        <CardHeader>
          <CardTitle>{event.title}</CardTitle>
          <CardDescription>
            {event.start_date && event.end_date ? (
              <>
                {format(new Date(event.start_date), "d MMM", { locale: ru })} -{" "}
                {format(new Date(event.end_date), "d MMM yyyy", { locale: ru })}
              </>
            ) : (
              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-800">
                Без даты
              </span>
            )}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
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
            <div style={{ whiteSpace: 'pre-wrap' }}>
              <span className="font-medium">Описание:</span> {event.description}
            </div>
          )}
          <div className="space-y-3 mt-4">
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
                  handleJoin();
                } else if (clickX > 2 * third) {
                  handleLeave();
                } else {
                  handleCancel();
                }
              }}
            >
              <div className="absolute inset-0 flex">
                <div className={`w-1/3 transition-all duration-500 ${
                  currentUserStatus === "going" ? "bg-green-400/30 shadow-[0_0_30px_rgba(34,197,94,0.5)]" : "bg-green-400/10"
                }`} />
                <div className="w-1/3 bg-gray-200/50" />
                <div className={`w-1/3 transition-all duration-500 ${
                  currentUserStatus === "not_going" ? "bg-red-400/30 shadow-[0_0_30px_rgba(239,68,68,0.5)]" : "bg-red-400/10"
                }`} />
              </div>
              <div className={`absolute top-1 bottom-1 w-1/3 rounded-xl transition-all duration-300 ease-out ${
                currentUserStatus === "going"
                  ? "left-0 bg-gradient-to-r from-green-400 via-green-500 to-emerald-400 shadow-[0_0_20px_rgba(34,197,94,0.6),inset_0_1px_0_rgba(255,255,255,0.5)]"
                  : currentUserStatus === "not_going"
                  ? "left-2/3 bg-gradient-to-r from-red-400 via-red-500 to-rose-400 shadow-[0_0_20px_rgba(239,68,68,0.6),inset_0_1px_0_rgba(255,255,255,0.5)]"
                  : "left-1/3 bg-gradient-to-r from-gray-300 via-gray-400 to-slate-300 shadow-[0_0_15px_rgba(148,163,184,0.4),inset_0_1px_0_rgba(255,255,255,0.6)]"
              }`}>
                <div className="absolute inset-0 rounded-xl bg-gradient-to-b from-white/30 to-transparent" />
              </div>
              <div className="absolute inset-0 flex items-center justify-around text-sm font-semibold pointer-events-none z-10">
                <span className={`transition-all duration-300 ${
                  currentUserStatus === "going" ? "text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.3)] scale-105" : "text-green-900"
                }`}>
                  ✓ Я в деле
                </span>
                <span className={`transition-all duration-300 ${
                  currentUserStatus === "not_answered" ? "text-gray-900 font-bold" : "text-gray-600"
                }`}>
                  Едешь?
                </span>
                <span className={`transition-all duration-300 ${
                  currentUserStatus === "not_going" ? "text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.3)] scale-105" : "text-red-900"
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
                <div className="flex flex-col gap-1">
                  {going.map((p) => (
                    <div key={p.user.id} className="flex items-center gap-2 cursor-pointer hover:underline" onClick={() => router.push(`/profile/${p.user.id}`)}>
                      <div className="w-6 h-6 rounded-full" style={{ backgroundColor: p.user.color }} />
                      <span className="text-sm">{p.user.name}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-1.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                  <h4 className="text-xs font-semibold text-red-800">Нахер ({notGoing.length})</h4>
                </div>
                <div className="flex flex-col gap-1">
                  {notGoing.map((p) => (
                    <div key={p.user.id} className="flex items-center gap-2 cursor-pointer hover:underline" onClick={() => router.push(`/profile/${p.user.id}`)}>
                      <div className="w-6 h-6 rounded-full opacity-90" style={{ backgroundColor: p.user.color }} />
                      <span className="text-sm">{p.user.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </CardContent>
        {(user?.id === event.author_id || user?.role === "admin") && (
          <CardFooter>
            <Button variant="destructive" onClick={async () => {
              if (confirm("Удалить мероприятие?")) {
                await eventsApi.delete(eventId);
                router.push("/events");
              }
            }}>
              Удалить
            </Button>
          </CardFooter>
        )}
      </Card>
    </div>
  );
}