# HTA Cleaner Scanner

Минимальный запуск проекта теперь идет через Docker.

## Что внутри

- `frontend` — Next.js админка
- `backend` — FastAPI API с mock-данными

## Запуск

При необходимости укажите LAN IP хоста, который уже добавлен в сертификат:

```bash
set LAN_HOST=192.168.20.50
docker compose up --build
```

Если IP другой, сначала перевыпустите сертификат в `certs/`, чтобы в нем был ваш LAN IP.

```bash
docker compose up --build
```

## Адреса

- Frontend: `https://localhost:2000`
- Backend: `http://localhost:8000`
- Healthcheck backend: `http://localhost:8000/api/health`
- Frontend по LAN: `https://<LAN_HOST>:2000`

Текущий адрес хоста в этой сети: `https://192.168.20.50:2000`

## HTTPS

- Frontend поднимается через локальный HTTPS server внутри `frontend/server.js`
- Сертификаты читаются из общей папки `certs/`, которая монтируется в контейнер как `/app/certs`
- Для перевыпуска dev-сертификата используйте `generate-cert.ps1`
- После смены LAN IP обновите IP в `generate-cert.ps1`, перевыпустите сертификат и перезапустите `docker compose up --build`

## Вход

- Логин: `admin`
- Пароль: `admin`

- Логин: `cleaner`
- Пароль: `cleaner`

## QR flow

- Администратор генерирует QR-код на странице `QR-коды`
- QR ведет сразу на cleaner-страницу `scan` с уже подставленным кабинетом
- Клинер открывает ссылку на телефоне, отмечает выполненные пункты и отправляет отчет

## Остановка

```bash
docker compose down
```
