# AdaptLearn — Адаптивная платформа онлайн-обучения

Магистерская ВКР по направлению 09.04.02 «Информационные системы и технологии»

## Стек технологий

| Компонент | Технологии |
|-----------|-----------|
| Frontend  | React 19, Vite, Redux Toolkit, TanStack Query |
| Backend   | Node.js, Express.js, Mongoose |
| Database  | MongoDB 7.0 |
| ML Service | Python, Flask, scikit-learn (SVD + TF-IDF) |
| DevOps    | Docker, Docker Compose, Nginx |

## Быстрый старт (локально)

### Без Docker

```bash
# 1. Backend
cd backend && npm install
cp .env.example .env
npm run dev

# 2. ML Service
cd ml-service
python3 -m venv venv && source venv/bin/activate
pip install -r requirements.txt
python app.py

# 3. Frontend
cd frontend && npm install
echo "VITE_API_URL=http://localhost:5001/api" > .env
npm run dev
```

### С Docker

```bash
# Клонировать репозиторий
git clone https://github.com/ВАШ_ЛОГИН/adaptive-learning.git
cd adaptive-learning

# Настроить переменные окружения
cp backend/.env.docker backend/.env.docker
# Отредактировать JWT_SECRET и CLIENT_URL

# Запустить все сервисы
docker-compose up -d --build

# Заполнить тестовыми данными
docker-compose exec backend node seed.js
```

Открыть в браузере: http://localhost

## Тестовые аккаунты

| Роль | Email | Пароль |
|------|-------|--------|
| Student | student@adaptlearn.ru | student123 |
| Instructor | instructor@adaptlearn.ru | instructor123 |
| Admin | admin@adaptlearn.ru | admin123 |

## Архитектура

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Frontend  │────▶│   Backend   │────▶│   MongoDB   │
│  React/Vite │     │  Node.js    │     │             │
│   :80/:5173 │     │   :5000     │     │   :27017    │
└─────────────┘     └──────┬──────┘     └─────────────┘
                           │
                    ┌──────▼──────┐
                    │ ML Service  │
                    │   Python    │
                    │   :8000     │
                    └─────────────┘
```

## API endpoints

| Метод | Endpoint | Описание |
|-------|----------|----------|
| POST | /api/auth/register | Регистрация |
| POST | /api/auth/login | Вход |
| GET  | /api/courses | Список курсов |
| POST | /api/courses/:id/enroll | Запись на курс |
| GET  | /api/recommendations | ML-рекомендации |
| POST | /api/progress/events | Трекинг событий |

## ML-модель

Гибридная рекомендательная система:
- **Коллаборативная фильтрация** — SVD (Truncated SVD)
- **Контентная фильтрация** — TF-IDF + косинусное сходство
- **Холодный старт** — контентная фильтрация для новых пользователей
- **Метрики**: Precision@K, NDCG@K
