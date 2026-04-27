export type UserRole = "admin" | "user";

export type ParticipationStatus = "going" | "not_going" | "not_answered";

export interface User {
  id: number;
  username: string;
  name: string;
  avatar: string | null;
  phone: string | null;
  telegram: string | null;
  color: string;
  role: UserRole;
  created_at: string;
}

export interface Vacation {
  id: number;
  user_id: number;
  start_date: string;
  end_date: string;
  description: string | null;
  user?: User;
}

export interface Event {
  id: number;
  author_id: number;
  title: string;
  description: string | null;
  image: string | null;
  location: string | null;
  start_date: string;
  end_date: string;
  created_at: string;
  participations: Participation[];
  author: User;
}

export interface Participation {
  event_id: number;
  user_id: number;
  status: ParticipationStatus;
  user: User;
}

export interface Token {
  access_token: string;
  token_type: string;
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface UserCreate {
  username: string;
  password: string;
  name: string;
}

export interface UserUpdate {
  name?: string;
  avatar?: string;
  phone?: string;
  telegram?: string;
  color?: string;
  role?: UserRole;
}

export interface VacationCreate {
  start_date: string;
  end_date: string;
  description?: string;
}

export interface VacationUpdate {
  start_date?: string;
  end_date?: string;
  description?: string;
}

export interface EventCreate {
  title: string;
  start_date: string;
  end_date: string;
  description?: string;
  location?: string;
}

export interface EventUpdate {
  title?: string;
  start_date?: string;
  end_date?: string;
  description?: string;
  location?: string;
}