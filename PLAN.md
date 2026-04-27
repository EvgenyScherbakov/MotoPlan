# План реализации «Мото-План»

## 1. Структура проекта

```
motoplan/
├── backend/           # FastAPI приложение
│   ├── app/
│   │   ├── api/       # Роутеры API
│   │   ├── core/      # Конфигурация, безопасность
│   │   ├── db/        # SQLAlchemy, миграции
│   │   ├── models/    # Модели БД
│   │   ├── schemas/   # Pydantic схемы
│   │   └── services/  # Бизнес-логика
│   ├── alembic/       # Миграции
│   ├── uploads/       # Загруженные изображения
│   ├── pytest.ini
│   ├── requirements.txt
│   └── main.py
├── frontend/          # Next.js приложение
│   ├── src/
│   │   ├── app/       # App Router страницы
│   │   ├── components/# UI компоненты
│   │   ├── lib/       # Утилиты, API клиент
│   │   └── types/     # TypeScript типы
│   ├── next.config.ts
│   ├── tailwind.config.ts
│   └── package.json
├── docker-compose.yml
└── README.md
```

## 2. База данных (PostgreSQL)

### Сущности

| Таблица | Назначение |
|---------|------------|
| `users` | Пользователи (id, email, password_hash, name, avatar, phone, telegram, color, role, created_at) |
| `vacations` | Отпуска (id, user_id, start_date, end_date, description) |
| `events` | Мероприятия (id, author_id, title, description, image, location, start_date, end_date) |
| `event_participations` | Участие в мероприятиях (event_id, user_id, status: going/not_going/not_answered) |

## 3. API Endpoints

| Метод | Путь | Описание |
|-------|------|----------|
| POST | `/api/v1/auth/register` | Регистрация |
| POST | `/api/v1/auth/login` | Вход |
| GET | `/api/v1/auth/me` | Текущий пользователь |
| GET/POST/PATCH/DELETE | `/api/v1/users/{id}` | Пользователи |
| GET/POST/PATCH/DELETE | `/api/v1/vacations/` CRUD | Отпуска |
| GET/POST/PATCH/DELETE | `/api/v1/events/` CRUD | Мероприятия |
| POST | `/api/v1/events/{id}/join` | «Поеду» |
| POST | `/api/v1/events/{id}/leave` | «Не поеду» |

## 4. Frontend Страницы

| Путь | Компонент |
|------|-----------|
| `/login` | Вход |
| `/register` | Регистрация |
| `/calendar` | Календарь |
| `/events` | Мероприятия |
| `/events/[id]` | Карточка мероприятия |
| `/profile` | Профиль |
| `/profile/[id]` | Чужой профиль |
| `/admin` | Админ-панель |

## 5. Порядок реализации

1. Docker + структура
2. Бэкенд: FastAPI, PostgreSQL, модели
3. Бэкенд: API endpoints
4. Фронтенд: Next.js, Tailwind
5. Фронтенд: Страницы