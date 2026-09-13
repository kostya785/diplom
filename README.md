 Константинополь Мед

Система онлайн-записи к врачу с веб-интерфейсом и Telegram-ботом для уведомлений.

 Описание

Полноценная система управления медицинской клиникой, включающая:

- Онлайн-запись пациентов к врачам
- Управление расписанием врачей
- Создание и хранение медицинских карт
- Система уведомлений через Telegram
- Административная панель
- Поддержка двух баз данных: основная PostgreSQL и резервная MySQL

 Основные функции

 Для пациентов
- Регистрация с подтверждением email
- Просмотр услуг и врачей
- Запись на приём
- Отмена записи
- Просмотр своих записей и медицинских карт
- Привязка Telegram для уведомлений
- ИИ-помощник подбора врача

 Для врачей
- Создание и управление расписанием
- Просмотр записей пациентов
- Создание медицинских карт
- Просмотр информации о пациентах

 Для технического администратора
- Управление пользователями (блокировка, разблокировка, удаление)
- Сброс паролей
- Аудит авторизаций
- Переключение между базами данных (PostgreSQL ↔ MySQL)
- Управление ролями

 Для клинического администратора
- Управление врачами (добавление, редактирование, удаление)
- Назначение услуг врачам
- Управление услугами
- Просмотр всех записей и пациентов

 Технологии

Backend:
- Node.js + Express
- Prisma ORM
- PostgreSQL (основная БД)
- MySQL (резервная/аварийная БД)
- JWT-аутентификация
- Nodemailer
- Telegram Bot API
- YandexGPT

Frontend:
- React + Vite
- React Router
- Axios

Инфраструктура:
- Docker + Docker Compose

 Установка и запуск

 Требования
- Node.js 18+
- Docker и Docker Compose
- npm

 1. Клонирование
'''bash
git clone https://github.com/kostya785/diplom.git
cd diplom
2. Запуск баз данных
Bashcd backend
docker compose up -d
Будут подняты:

PostgreSQL (основная) — порт 5432
MySQL (резервная) — порт 3306
Adminer — http://localhost:8080

3. Настройка Backend
Bashcd backend
cp .env.example .env
Заполните .env (пример):
envDATABASE_URL="postgresql://postgres:password@localhost:5432/konstantinopol?schema=public"
DATABASE_URL_MYSQL="mysql://root:password@localhost:3306/konstantinopol"
JWT_SECRET="your-secret-key"
FRONTEND_URL="http://localhost:5173"
TELEGRAM_TOKEN="..."
YANDEX_API_KEY="..."
YANDEX_FOLDER_ID="..."
SMTP_HOST="smtp.gmail.com"
SMTP_PORT="587"
SMTP_USER="..."
SMTP_PASS="..."
Bashnpm install
npx prisma migrate dev
npx prisma db seed
npm run dev
4. Запуск Frontend
Bashcd frontend
npm install
npm run dev

Деплой Frontend
Frontend развёрнут на GitHub Pages:

https://kostya785.github.io/diplom/ 
Автор
Марьянкин Константин Александрович
