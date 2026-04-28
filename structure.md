# MotoPlan — Структура проекта

## Общее описание

**MotoPlan** — полнофункциональное веб-приложение для мотоклуба, позволяющее участникам:
- Планировать и координировать совместные поездки (мероприятия)
- Управлять графиком отпусков
- Видеть календарь доступности других участников
- Отмечать своё участие в поездках ("Еду" / "Не еду")

## Стек технологий

### Backend
| Компонент | Технология |
|-----------|------------|
| Framework | FastAPI 0.109+ |
| ASGI Server | Uvicorn |
| ORM | SQLAlchemy 2.0+ (async) |
| База данных | PostgreSQL 16 (async via asyncpg) |
| Аутентификация | JWT (python-jose) + bcrypt |
| Валидация | Pydantic 2.5+ |
| Миграции | Alembic |

### Frontend
| Компонент | Технология |
|-----------|------------|
| Framework | Next.js 15.1 (App Router) |
| UI Library | React 19 |
| Язык | TypeScript 5.7 |
| Стилизация | Tailwind CSS 3.4 |
| Управление состоянием | Zustand 5.0 |
| Иконки | Lucide React |
| Работа с датами | date-fns |
| UI-компоненты | Radix UI (primitives) |

---

## Структура файлов

```
MotoPlan/
│
├── backend/                           # FastAPI приложение
│   ├── app/
│   │   ├── __init__.py
│   │   ├── main.py                    # Точка входа FastAPI app
│   │   ├── api/                       # Роутеры API endpoints
│   │   │   ├── __init__.py
│   │   │   ├── auth.py                # /auth/* — регистрация, вход, me
│   │   │   ├── users.py               # /users/* — CRUD пользователей
│   │   │   ├── vacations.py          # /vacations/* — CRUD отпусков
│   │   │   └── events.py             # /events/* — CRUD + join/leave
│   │   ├── core/                      # Конфигурация и безопасность
│   │   │   ├── config.py              # Настройки приложения (Settings)
│   │   │   └── security.py            # JWT, хеширование паролей
│   │   ├── db/
│   │   │   └── database.py            # SQLAlchemy async engine + session
│   │   ├── models/
│   │   │   └── models.py              # ORM модели (User, Vacation, Event, Participation)
│   │   └── schemas/
│   │       └── schemas.py             # Pydantic schemas (запросы/ответы)
│   ├── uploads/                       # Загруженные изображения мероприятий
│   ├── Dockerfile
│   └── requirements.txt               # Python зависимости
│
├── frontend/                          # Next.js приложение
│   ├── src/
│   │   ├── app/                      # App Router страницы
│   │   │   ├── layout.tsx            # Корневой layout с навигацией
│   │   │   ├── page.tsx              # Главная (редирект на login/calendar)
│   │   │   ├── globals.css           # Глобальные стили Tailwind
│   │   │   ├── login/
│   │   │   │   └── page.tsx          # Страница входа
│   │   │   ├── register/
│   │   │   │   └── page.tsx          # Страница регистрации
│   │   │   ├── calendar/
│   │   │   │   └── page.tsx          # Календарь (текущий месяц + до конца года)
│   │   │   ├── events/
│   │   │   │   ├── page.tsx          # Список мероприятий (поддержка переноса строк)
│   │   │   │   ├── EventsContent.tsx # Основной компонент событий (место/маршрут как ссылки)
│   │   │   │   └── [id]/
│   │   │   │       └── page.tsx      # Детали мероприятия (место/маршрут как ссылки, перенос строк)
│   │   │   ├── profile/
│   │   │   │   ├── page.tsx          # Редактирование своего профиля
│   │   │   │   └── [id]/
│   │   │   │       └── page.tsx      # Просмотр чужого профиля
│   │   │   └── admin/
│   │   │       └── page.tsx          # Админ-панель (управление пользователями)
│   │   ├── components/               # UI компоненты
│   │   │   └── ui/
│   │   │       ├── button.tsx
│   │   │       ├── card.tsx
│   │   │       └── input.tsx
│   │   ├── lib/                      # Утилиты и API клиент
│   │   │   ├── api.ts               # Fetch wrapper с JWT auth header
│   │   │   ├── store.ts             # Zustand store (user state)
│   │   │   └── utils.ts             # cn() утилита (clsx + tailwind-merge)
│   │   └── types/
│   │       └── index.ts              # TypeScript интерфейсы
│   ├── public/                       # Статические файлы
│   ├── .next/                        # Next.js build artifacts
│   ├── node_modules/
│   ├── package.json
│   ├── package-lock.json
│   ├── tsconfig.json
│   ├── next.config.ts
│   ├── tailwind.config.ts
│   ├── postcss.config.mjs
│   ├── Dockerfile
│   └── .dockerignore
│
├── docker-compose.yml                # Оркестрация сервисов
├── PLAN.md                           # План реализации
└── .gitignore
```

---

## Модель базы данных

### ER-диаграмма

```
┌──────────────────────┐      ┌──────────────────────┐
│        users         │      │      vacations       │
├──────────────────────┤      ├──────────────────────┤
│ id (PK, int)         │──┐   │ id (PK, int)         │
│ username (unique)    │  │   │ user_id (FK → users) │
│ password_hash        │  └──>│ start_date           │
│ name                 │      │ end_date             │
│ avatar (url)         │      │ description          │
│ phone                │      └──────────────────────┘
│ telegram             │
│ color (#hex)         │
│ role (admin/user)    │
│ created_at           │
└──────────────────────┘
       │
       │              ┌──────────────────────┐
│              │        events        │
                       ├──────────────────────┤
                       │ id (PK, int)         │
                       │ author_id (FK → users)│
                       │ title                │
                       │ description          │
                       │ image (url)          │
                       │ location (url)       │
                       │ route (url)          │
                       │ start_date           │
                       │ end_date            │
                       │ created_at          │
                       └──────────────────────┘
                                │
                                ▼
                      ┌──────────────────────┐
                      │   participation      │
                      ├──────────────────────┤
                      │ id (PK, int)         │
                      │ event_id (FK → events)│
                      │ user_id (FK → users)  │
                      │ status (enum)         │
                      └──────────────────────┘
```

### Таблицы

#### `users`
| Поле | Тип | Описание |
|------|-----|----------|
| id | INTEGER PK | Идентификатор |
| username | VARCHAR UNIQUE | Логин |
| password_hash | VARCHAR | Хеш пароля (bcrypt) |
| name | VARCHAR | Имя участника |
| avatar | VARCHAR | URL аватара |
| phone | VARCHAR | Телефон |
| telegram | VARCHAR | Telegram username |
| color | VARCHAR | Цвет в календаре (hex) |
| role | ENUM | `admin` или `user` |
| created_at | TIMESTAMP | Дата регистрации |

#### `vacations`
| Поле | Тип | Описание |
|------|-----|----------|
| id | INTEGER PK | Идентификатор |
| user_id | INTEGER FK | Владелец отпуска |
| start_date | DATE | Начало отпуска |
| end_date | DATE | Конец отпуска |
| description | TEXT | Описание |

#### `events`
| Поле | Тип | Описание |
|------|-----|----------|
| id | INTEGER PK | Идентификатор |
| author_id | INTEGER FK | Организатор |
| title | VARCHAR | Название поездки |
| description | TEXT | Описание |
| image | VARCHAR | URL изображения |
| location | VARCHAR | Место проведения (ссылка на карту) |
| route | VARCHAR | Ссылка на маршрут |
| start_date | TIMESTAMP | Начало |
| end_date | TIMESTAMP | Конец |
| created_at | TIMESTAMP | Дата создания |

#### `participation`
| Поле | Тип | Описание |
|------|-----|----------|
| id | INTEGER PK | Идентификатор |
| event_id | INTEGER FK | Мероприятие |
| user_id | INTEGER FK | Участник |
| status | ENUM | `going` / `not_going` / `not_answered` |

---

## API Endpoints

**Базовый URL**: `/api/v1`

### Аутентификация `/auth`

| Метод | Путь | Описание | Auth |
|-------|------|----------|------|
| POST | `/auth/register` | Регистрация нового пользователя | Нет |
| POST | `/auth/login` | Вход, возврат JWT токена | Нет |
| GET | `/auth/me` | Данные текущего пользователя | Да |

### Пользователи `/users`

| Метод | Путь | Описание | Auth |
|-------|------|----------|------|
| GET | `/users/` | Список всех пользователей | Admin |
| GET | `/users/{id}` | Получить пользователя по ID | Да |
| PATCH | `/users/{id}` | Обновить данные пользователя | Да |
| DELETE | `/users/{id}` | Удалить пользователя | Admin |

### Отпуска `/vacations`

| Метод | Путь | Описание | Auth |
|-------|------|----------|------|
| GET | `/vacations/` | Список отпусков (фильтр по user_id, датам) | Да |
| POST | `/vacations/` | Создать отпуск | Да |
| PATCH | `/vacations/{id}` | Обновить отпуск | Да |
| DELETE | `/vacations/{id}` | Удалить отпуск | Да |

### Мероприятия `/events`

| Метод | Путь | Описание | Auth |
|-------|------|----------|------|
| GET | `/events/` | Список мероприятий | Да |
| GET | `/events/{id}` | Детали мероприятия | Да |
| POST | `/events/` | Создать мероприятие | Да |
| PATCH | `/events/{id}` | Обновить мероприятие | Да |
| DELETE | `/events/{id}` | Удалить мероприятие | Да |
| POST | `/events/{id}/join` | Присоединиться ("Еду") | Да |
| POST | `/events/{id}/leave` | Отменить участие ("Не еду") | Да |
| POST | `/events/{id}/image` | Загрузить изображение | Да |

---

## Frontend маршруты

| Путь | Компонент | Назначение |
|------|-----------|------------|
| `/` | `page.tsx` | Главная — редирект в зависимости от auth |
| `/login` | `login/page.tsx` | Форма входа |
| `/register` | `register/page.tsx` | Форма регистрации |
| `/calendar` | `calendar/page.tsx` | Календарь (текущий месяц + до конца года) с событиями и отпусками |
| `/events` | `events/page.tsx` | Список мероприятий + управление отпусками (поддержка переноса строк) |
| `/events/[id]` | `events/[id]/page.tsx` | Детальная карточка мероприятия (место/маршрут как ссылки) |
| `/profile` | `profile/page.tsx` | Редактирование своего профиля |
| `/profile/[id]` | `profile/[id]/page.tsx` | Просмотр профиля другого участника |
| `/admin` | `admin/page.tsx` | Админ-панель (управление пользователями) |

---

## Docker Compose сервисы

| Сервис | Image | Ports | Описание |
|--------|-------|-------|----------|
| `postgres` | postgres:16-alpine | 5432 | База данных |
| `backend` | Dockerfile | 8000 | FastAPI приложение |
| `frontend` | Dockerfile | 3000 | Next.js приложение |

### Переменные окружения

**Backend**:
- `DATABASE_URL`: `postgresql+asyncpg://motoplan:motoplan@postgres:5432/motoplan`
- `SECRET_KEY`: ключ для JWT
- `UPLOAD_DIR`: `/app/uploads`

**Frontend**:
- `NEXT_PUBLIC_API_URL`: `http://backend:8000/api/v1`

---

## Ключевые файлы

| Путь | Назначение |
|------|------------|
| `backend/app/main.py` | Инициализация FastAPI app |
| `backend/app/models/models.py` | SQLAlchemy ORM модели |
| `backend/app/api/*.py` | Обработчики API роутов |
| `backend/app/schemas/schemas.py` | Pydantic schemas |
| `backend/app/core/security.py` | JWT утилиты |
| `frontend/src/lib/api.ts` | HTTP клиент с Bearer auth |
| `frontend/src/lib/store.ts` | Zustand store (user state) |
| `frontend/src/app/calendar/page.tsx` | Главный компонент календаря |
| `docker-compose.yml` | Оркестрация всех сервисов |