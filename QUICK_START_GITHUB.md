# 📦 Быстрая публикация на GitHub

## Автоматический скрипт (если установлен Git)

Создайте файл `publish.bat` в корне проекта:

```batch
@echo off
echo Публикация проекта на GitHub...
echo.
echo Введите URL вашего GitHub репозитория (например: https://github.com/username/repo.git)
set /p REPO_URL="URL репозитория: "

git init
git add .
git commit -m "Initial commit: Car damage assessment tool"
git remote add origin %REPO_URL%
git branch -M main
git push -u origin main

echo.
echo Готово! Проект опубликован на GitHub.
echo Теперь перейдите на https://vercel.com для деплоя.
```

Запустите: `publish.bat`

## Ручная публикация

### 1. Установите Git
https://git-scm.com/download/win

### 2. Создайте репозиторий на GitHub
- https://github.com → New repository
- Название: `car-damage-assessment`
- Public
- Create repository

### 3. Откройте терминал в папке проекта

```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/ВАШ_USERNAME/car-damage-assessment.git
git branch -M main
git push -u origin main
```

### 4. Деплой на Vercel (frontend)

1. https://vercel.com → Sign up with GitHub
2. New Project → выберите ваш репозиторий
3. Root Directory: `frontend`
4. Build Command: `npm run build`
5. Output Directory: `dist`
6. Deploy

Готово! Сайт будет доступен по ссылке вида `https://car-damage-assessment.vercel.app`

## Деплой Backend (опционально)

Для работы AI режима нужен backend.

### Render.com (бесплатно)
1. https://render.com → New → Web Service
2. Подключите GitHub репозиторий
3. Root Directory: `backend`
4. Build Command: `npm install`
5. Start Command: `npm start`
6. Deploy

Получите URL backend и добавьте в frontend/.env.production:
```
VITE_API_URL=https://ваш-backend.onrender.com
```

Переподеплойте frontend на Vercel.

## Инструкция для пользователей

Добавьте в README.md ссылку на ваш сайт:

```markdown
## 🌐 Онлайн версия

Сайт доступен по ссылке: https://ваш-сайт.vercel.app
```
