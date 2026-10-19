# 🚀 Публикация на GitHub и Деплой

## Шаг 1: Установка Git (если не установлен)

Скачайте и установите Git с https://git-scm.com/download/win

После установки перезапустите терминал.

## Шаг 2: Создание репозитория на GitHub

1. Перейдите на https://github.com
2. Войдите в аккаунт (или зарегистрируйтесь)
3. Нажмите "+" → "New repository"
4. Название: `car-damage-assessment`
5. Описание: "AI-powered car damage assessment tool"
6. Выберите "Public" (чтобы любой мог пользоваться)
7. НЕ отмечайте "Initialize this repository with a README"
8. Нажмите "Create repository"

## Шаг 3: Инициализация локального репозитория

Откройте терминал в папке проекта `C:\Users\user\OneDrive\Desktop\Remont`:

```bash
git init
git add .
git commit -m "Initial commit: Car damage assessment tool"
```

## Шаг 4: Подключение к GitHub

Скопируйте URL вашего репозитория (например: `https://github.com/username/car-damage-assessment.git`)

```bash
git remote add origin https://github.com/ВАШ_USERNAME/car-damage-assessment.git
git branch -M main
git push -u origin main
```

## Шаг 5: Деплой на Vercel (бесплатно)

### Способ 1: Деплой только Frontend (простой)

Frontend можно деплоить на Vercel/Netlify бесплатно.

1. Перейдите на https://vercel.com
2. Войдите через GitHub
3. Нажмите "Add New" → "Project"
4. Выберите ваш репозиторий
5. Настройки:
   - Root Directory: `frontend`
   - Build Command: `npm run build`
   - Output Directory: `dist`
6. Нажмите "Deploy"

Готово! Сайт будет доступен по ссылке вида `https://car-damage-assessment.vercel.app`

**Важно**: При этом backend работать не будет (нужен отдельный деплой).

### Способ 2: Деплой Backend + Frontend (полный)

Для полноценной работы нужен backend. Варианты:

#### Вариант A: Render.com (бесплатно для backend)

1. Создайте файл `frontend/.env.production`:
```
VITE_API_URL=https://your-backend.onrender.com
```

2. Деплой Backend на Render:
   - Перейдите на https://render.com
   - New → Web Service
   - Подключите GitHub репозиторий
   - Root Directory: `backend`
   - Build Command: `npm install`
   - Start Command: `npm start`
   - Бесплатный план работает!

3. Деплой Frontend на Vercel (как в Способе 1)

#### Вариант B: Railway.app (бесплатно)

1. Перейдите на https://railway.app
2. New Project → Deploy from GitHub repo
3. Создайте два сервиса:
   - `backend` - Node.js сервис
   - `frontend` - Vite сервис
4. Railway автоматически выдаст URL'ы

#### Вариант C: GitHub Pages (только frontend)

1. В `frontend/package.json` добавьте:
```json
"homepage": "https://ВАШ_USERNAME.github.io/car-damage-assessment",
"scripts": {
  "predeploy": "npm run build",
  "deploy": "gh-pages -d dist"
}
```

2. Установите gh-pages:
```bash
cd frontend
npm install --save-dev gh-pages
```

3. Разрешите GitHub Pages в настройках репозитория:
   - Settings → Pages
   - Source: `gh-pages` branch

## Шаг 6: Настройка переменных окружения

Для работы AI режима добавьте в деплой backend:

- Render: Settings → Environment Variables
- Railway: Variables tab
- Vercel: Settings → Environment Variables

Добавьте:
```
GOOGLE_APPLICATION_CREDENTIALS=base64_код_ключа_или_путь_к_файлу
```

**Важно**: Для Google Cloud Vision нужно загрузить JSON ключ или использовать base64.

## Инструкция для пользователей

Добавьте в README.md:

```markdown
## 🌐 Онлайн версия

Сайт доступен по ссылке: [ВАША ССЫЛКА]

## Как использовать локально

См. файл НАСТРОЙКА.md
```

## Быстрый старт для деплоя (простой вариант)

Если хотите только frontend без backend:

1. Создайте GitHub репозиторий
2. Залейте код
3. Откройте репозиторий на GitHub
4. Settings → Pages
5. Source: Deploy from a branch
6. Branch: main → / (root)
7. Сохраните

Сайт будет доступен по `https://ВАШ_USERNAME.github.io/РЕПОЗИТОРИЙ`

**Ограничение**: будет работать только ручной режим (без AI).
