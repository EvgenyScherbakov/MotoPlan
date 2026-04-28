# MotoPlan

Веб-приложение для планирования мото-поездок и отслеживания отпусков участников мотосообщества.

## Технологический стек

### Backend
- **FastAPI** (>=0.109.0) — веб-фреймворк
- **PostgreSQL** (16-alpine) — база данных
- **SQLAlchemy** (>=2.0.0) с asyncpg — ORM
- **Alembic** (>=1.13.0) — миграции БД
- **Pydantic** (>=2.5.0) — валидация данных
- **JWT** (python-jose) — аутентификация

### Frontend
- **Next.js** (>=15.1.0) с App Router
- **React** (19.0.0)
- **TypeScript** (5.7.2)
- **Tailwind CSS** (3.4.17) + shadcn/ui компоненты
- **Zustand** (5.0.2) — управление состоянием
- **date-fns** (4.1.0) — работа с датами
- **date-holidays** (3.27.0) — определение праздников РФ

## Структура проекта

```
MotoPlan/
├── backend/              # FastAPI приложение
│   ├── app/
│   │   ├── api/         # Роутеры API (auth, users, vacations, events)
│   │   ├── core/        # Конфигурация, безопасность
│   │   ├── db/          # SQLAlchemy, миграции
│   │   ├── models/      # Модели БД
│   │   ├── schemas/     # Pydantic схемы
│   │   └── main.py
│   ├── alembic/         # Миграции
│   ├── uploads/         # Загруженные изображения
│   └── requirements.txt
├── frontend/            # Next.js приложение
│   ├── src/
│   │   ├── app/        # App Router страницы
│   │   ├── components/ # UI компоненты
│   │   ├── lib/        # Утилиты, API клиент
│   │   └── types/      # TypeScript типы
│   └── package.json
├── docker-compose.yml
└── README.md
```

## База данных

### Основные сущности
- **users** — пользователи (id, email, password_hash, name, avatar, phone, telegram, color, role)
- **vacations** — отпуска (id, user_id, start_date, end_date, description)
- **events** — мероприятия (id, author_id, title, description, image, location, start_date, end_date)
- **event_participations** — участие (event_id, user_id, status: going/not_going/not_answered)

## API Endpoints

| Метод | Путь | Описание |
|-------|------|----------|
| POST | `/api/v1/auth/register` | Регистрация |
| POST | `/api/v1/auth/login` | Вход |
| GET | `/api/v1/auth/me` | Текущий пользователь |
| GET/POST/PATCH/DELETE | `/api/v1/users/{id}` | Пользователи |
| GET/POST/PATCH/DELETE | `/api/v1/vacations/` | Отпуска |
| GET/POST/PATCH/DELETE | `/api/v1/events/` | Мероприятия |
| POST | `/api/v1/events/{id}/join` | «Поеду» |
| POST | `/api/v1/events/{id}/leave` | «Не поеду» |

## Frontend страницы

| Путь | Описание |
|------|----------|
| `/login` | Вход |
| `/register` | Регистрация |
| `/calendar` | Календарь отпусков и поездок |
| `/events` | Список мероприятий |
| `/events/[id]` | Карточка мероприятия |
| `/profile` | Профиль пользователя |
| `/profile/[id]` | Чужой профиль |
| `/admin` | Админ-панель |

## Быстрый старт

### Предварительные требования
- Docker и Docker Compose
- (Опционально) Python 3.11+ и Node.js 18+ для локальной разработки

### Запуск через Docker Compose

```bash
docker-compose up -d
```

Сервисы будут доступны по адресам:
- Frontend: http://localhost:3000
- Backend API: http://localhost:8000
- PostgreSQL: localhost:5432

### Локальная разработка

**Backend:**
```bash
cd backend
pip install -r requirements.txt
uvicorn app.main:app --reload
```

**Frontend:**
```bash
cd frontend
npm install
npm run dev
```

## Особенности

- 📅 Календарь с подсветкой выходных и праздников РФ
- 🏍️ Создание и управление мото-поездками
- 🏖️ Отслеживание отпусков участников
- 👥 Система участия (еду/не еду)
- 🎨 Уникальные цвета пользователей для визуального различия
- 🔐 JWT аутентификация
- 📱 Адаптивный дизайн

## Лицензия

MIT
