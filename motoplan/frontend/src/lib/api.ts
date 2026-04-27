import { Token, LoginRequest, UserCreate, User, UserUpdate, Vacation, VacationCreate, VacationUpdate, Event, EventCreate, EventUpdate } from "@/types";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";

class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
  const headers: HeadersInit = {
    "Content-Type": "application/json",
    ...options.headers,
  };
  if (token) {
    (headers as Record<string, string>)["Authorization"] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: "Unknown error" }));
    throw new ApiError(response.status, error.detail || "Request failed");
  }

  if (response.status === 204) {
    return {} as T;
  }

  return response.json();
}

export async function requestWithToken<T>(path: string, token: string, options: RequestInit = {}): Promise<T> {
  const headers: HeadersInit = {
    "Content-Type": "application/json",
    ...options.headers,
    "Authorization": `Bearer ${token}`,
  };

  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: "Unknown error" }));
    throw new ApiError(response.status, error.detail || "Request failed");
  }

  return response.json();
}

export const authApi = {
  register: async (data: UserCreate): Promise<{ user: User; token: Token }> => {
    await request<User>("/auth/register", { method: "POST", body: JSON.stringify(data) });
    const token = await request<Token>("/auth/login", { method: "POST", body: JSON.stringify({ username: data.username, password: data.password }) });
    const user = await requestWithToken<User>("/auth/me", token.access_token);
    return { user, token };
  },

  login: (data: LoginRequest) =>
    request<Token>("/auth/login", { method: "POST", body: JSON.stringify(data) }),

  me: () => request<User>("/auth/me"),
};

export const usersApi = {
  list: () => request<User[]>("/users/"),

  get: (id: number) => request<User>(`/users/${id}`),

  update: (id: number, data: UserUpdate) =>
    request<User>(`/users/${id}`, { method: "PATCH", body: JSON.stringify(data) }),

  delete: (id: number) => request<void>(`/users/${id}`, { method: "DELETE" }),
};

export const vacationsApi = {
  list: (params?: { user_id?: number; start_date?: string; end_date?: string }) => {
    const query = params ? "?" + new URLSearchParams(params as Record<string, string>).toString() : "";
    return request<Vacation[]>(`/vacations/${query}`);
  },

  create: (data: VacationCreate) =>
    request<Vacation>("/vacations/", { method: "POST", body: JSON.stringify(data) }),

  update: (id: number, data: VacationUpdate) =>
    request<Vacation>(`/vacations/${id}`, { method: "PATCH", body: JSON.stringify(data) }),

  delete: (id: number) => request<void>(`/vacations/${id}`, { method: "DELETE" }),
};

export const eventsApi = {
  list: (params?: { start_date?: string; end_date?: string }) => {
    const query = params ? "?" + new URLSearchParams(params as Record<string, string>).toString() : "";
    return request<Event[]>(`/events/${query}`);
  },

  get: (id: number) => request<Event>(`/events/${id}`),

  create: (data: EventCreate) =>
    request<Event>("/events/", { method: "POST", body: JSON.stringify(data) }),

  update: (id: number, data: EventUpdate) =>
    request<Event>(`/events/${id}`, { method: "PATCH", body: JSON.stringify(data) }),

  delete: (id: number) => request<void>(`/events/${id}`, { method: "DELETE" }),

  join: (id: number) => request<{ message: string }>(`/events/${id}/join`, { method: "POST" }),

  leave: (id: number) => request<{ message: string }>(`/events/${id}/leave`, { method: "POST" }),
};