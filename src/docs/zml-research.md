# ZML — Исследование применимости в Calendar

## Что такое ZML

**ZML** (`@zeppos/zml`) — официальная мини-библиотека от Zepp Health для Zepp OS. Предоставляет обёртки над базовыми компонентами приложения и HTTP-клиент.

Установлена в проекте: `@zeppos/zml@^0.0.38` (уже есть в `package.json`, но **не используется**).

Требует API_LEVEL 3.0+ (проект нацелен на 4.0).

---

## Возможности ZML

### 1. `BaseApp` — обёртка `App({...})`

```javascript
import { BaseApp } from "@zeppos/zml/base-app";
App(BaseApp({
  globalData: {},
  onCreate() {},
  onDestroy() {},
}));
```

### 2. `BasePage` — обёртка `Page({...})`

Добавляет методы:

| Метод | Описание |
|-------|----------|
| `this.httpRequest(config)` | HTTP-запрос с устройства (GET/POST/...) |
| `this.request({ method, params })` | Promise-based запрос к AppSide |
| `this.call({ method, params })` | Fire-and-forget уведомление AppSide |
| `this.onRequest(req, res)` | Обработка запроса от AppSide |
| `this.onCall(data)` | Обработка уведомления от AppSide |

```javascript
import { BasePage } from "@zeppos/zml/base-page";
Page(BasePage({
  build() {},
  onInit() {
    // HTTP-запрос с часов
    this.httpRequest({ method: "get", url: "https://api.example.com/events" })
      .then(r => console.log(r.body));

    // Запрос к AppSide (телефон)
    this.request({ method: "GET_CALENDAR", params: { year: 2026, month: 6 } })
      .then(result => this.renderCalendar(result));
  },
}));
```

### 3. `BaseSideService` — обёртка `AppSideService({...})`

Аналогичные методы для общения с page.

```javascript
import { BaseSideService } from "@zeppos/zml/base-side";
AppSideService(BaseSideService({
  onRequest(req, res) {
    if (req.method === "GET_CALENDAR") {
      res(null, computeCalendar(req.params.year, req.params.month));
    }
  },
}));
```

---

## Текущее состояние

`package.json`:
```json
"dependencies": {
  "@silver-zepp/vis-log": "^1.5.3",
  "@zeppos/zml": "^0.0.38"
}
```

**Ни один файл не импортирует ZML.** Проект использует сырые API:
- `App({...})` — `app.js`
- `Page({...})` — `page/index.js`
- `AppSideService({...})` — `app-side/index.js`

**AppSide не вызывается из page** — расчёт сетки дублирован на обеих сторонах, но page вычисляет всё самостоятельно на устройстве.

---

## Анализ применимости

### 1. Замена `App`, `Page`, `AppSideService` на Base*-обёртки

**До ZML:**
```javascript
// page/index.js
Page({
  build() {
    // ручное создание виджетов...
    this.requestCalendar(year, month);
  },
  requestCalendar(year, month) {
    // вычисления на устройстве
  },
});
```

**После ZML:**
```javascript
import { BasePage } from "@zeppos/zml/base-page";
Page(BasePage({
  build() {
    // виджеты...
    this.getCalendar(year, month);
  },
  getCalendar(year, month) {
    // HTTP с облачного API
    return this.httpRequest({ url: `https://api/calendar?y=${year}&m=${month}` });
    // или запрос к AppSide
    return this.request({ method: "GET_CALENDAR", params: { year, month } });
  },
}));
```

**Изменения минимальны:** импорт + обёртка. Логика не меняется, только появляются новые методы (`this.httpRequest`, `this.request`, `this.call`).

### 2. Promise-based коммуникация page ↔ AppSide

Сейчас `app-side/index.js` использует колбэк:
```javascript
res(null, { year, month, cells });
```

ZML позволяет:
```javascript
// page
this.request({ method: "GET_CALENDAR", params: { year, month } })
  .then(result => this.renderCalendar(result));

// app-side — без изменений, onRequest работает так же
```

Плюс: Promise вместо вложенных колбэков. Минус: текущий page вообще не использует AppSide, так что это изменение не нужно, пока не решено перенести вычисления на телефон.

### 3. HTTP-запросы с часов

ZML — единственный способ делать HTTP-запросы напрямую с Zepp OS (API_LEVEL 3.0+).

**Потенциал для Calendar:**
- Загрузка событий/праздников с удалённого API
- Синхронизация календаря с Google/Apple/ Outlook календарём
- Получение списка государственных праздников

Пример:
```javascript
onInit() {
  this.httpRequest({
    method: "get",
    url: "https://api.example.com/holidays",
  })
    .then(r => {
      this.holidays = JSON.parse(r.body);
      this.renderCalendar(this.currentYear, this.currentMonth);
    })
    .catch(e => vis.error("HTTP failed"));
}
```

### 4. Перенос вычислений сетки в AppSide (телефон)

Текущая архитектура дублирует расчёт календарной сетки:
- `page/index.js:requestCalendar()` — делает то же самое, что и `app-side/index.js:onRequest`

Разумнее:
- **Убрать** вычисление из `page/index.js`
- Вызывать `this.request({ method: "GET_CALENDAR", params: { year, month } })` в page
- Оставить вычисление только в `app-side/index.js` (на телефоне)

ZML даёт Promise-based API для этого, но это можно сделать и без ZML (через родной `callAppSide` / `onRequest`).

---

## Сравнение

| Критерий | Без ZML | С ZML |
|----------|---------|-------|
| HTTP-запросы с часов | Невозможно | `this.httpRequest()` |
| Page ↔ AppSide | Колбэки | Promise (`request`/`call`) |
| Бойлерплейт | Минимальный | +1 импорт на файл |
| Использование AppSide | Не используется (всё на устройстве) | Можно перенести вычисления на телефон |
| Внешние зависимости | Нет | ZML 0.0.38 (уже в `package.json`) |
| Обратная совместимость | — | Полная (обёртки прозрачны) |

---

## Вывод

| Аспект | Оценка |
|--------|--------|
| **Полезность** | Средняя |
| **Что даёт** | HTTP-запросы с часов, Promise-based коммуникация, структурирование кода |
| **Сложность внедрения** | Низкая (однострочные изменения в каждом файле) |
| **Рекомендация** | `BaseApp`, `BasePage`, `BaseSideService` — стоит добавить, т.к. библиотека уже в зависимостях и не требует строить ничего заново. HTTP-клиент открывает возможность загрузки событий/праздников из сети. |

ZML — единственная из исследованных библиотек от официального вендора (Zepp Health). Уже установлена, но не используется. Добавление обёрток `Base*` — низкорисковое улучшение, дающее HTTP-клиент и единый стиль. Разработку новых фич (сетевая синхронизация, перенос вычислений в AppSide) можно отложить до появления соответствующих требований.
