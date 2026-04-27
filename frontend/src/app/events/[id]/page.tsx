"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
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
            {format(new Date(event.start_date), "d MMM", { locale: ru })} -{" "}
            {format(new Date(event.end_date), "d MMM yyyy", { locale: ru })}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {event.location && (
            <p>
              <span className="font-medium">📍 Место:</span> {event.location}
            </p>
          )}
          {event.description && (
            <p>
              <span className="font-medium">Описание:</span> {event.description}
            </p>
          )}
          <div className="flex gap-2">
            {currentUserStatus === "going" ? (
              <Button variant="outline" onClick={handleLeave}>
                Не поеду
              </Button>
            ) : (
              <Button onClick={handleJoin}>Поеду</Button>
            )}
          </div>

          <div className="space-y-4">
            <h3 className="font-medium">Участники</h3>
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-green-600">Едут ({going.length})</h4>
              {going.length === 0 ? (
                <p className="text-sm text-muted-foreground">Пока никто не подтвердил</p>
              ) : (
                going.map((p) => (
                  <div
                    key={p.user.id}
                    className="flex items-center gap-2 cursor-pointer hover:underline"
                    onClick={() => router.push(`/profile/${p.user.id}`)}
                  >
                    <div
                      className="w-8 h-8 rounded-full"
                      style={{ backgroundColor: p.user.color }}
                    />
                    <span>{p.user.name}</span>
                  </div>
                ))
              )}
            </div>
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-red-600">Не едут ({notGoing.length})</h4>
              {notGoing.map((p) => (
                <div
                  key={p.user.id}
                  className="flex items-center gap-2 cursor-pointer hover:underline"
                  onClick={() => router.push(`/profile/${p.user.id}`)}
                >
                  <div
                    className="w-8 h-8 rounded-full"
                    style={{ backgroundColor: p.user.color }}
                  />
                  <span>{p.user.name}</span>
                </div>
              ))}
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