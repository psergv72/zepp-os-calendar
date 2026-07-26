# Visual Logger (VisLog) — Исследование применимости в Calendar

## Что такое VisLog

**VisLog** (`@silver-zepp/vis-log` v1.5.3) — библиотека для отображения логов прямо на экране устройства Zepp OS. Позволяет видеть отладочные сообщения на физическом часах, а не только в консоли эмулятора.

Установка: `npm i @silver-zepp/vis-log`

Автор: Silver / Zepp Health (тот же, что и AutoGUI).

---

## API

```javascript
import VisLog from "@silver-zepp/vis-log";
const vis = new VisLog("page/index");

vis.log("message");   // обычное сообщение
vis.info("message");  // информационное
vis.warn("message");  // предупреждение
vis.error("message"); // ошибка
vis.debug("message"); // отладочное
```

### Настройки

```javascript
vis.updateSettings({
  line_count: 5,           // количество строк на экране
  log_from_top: true,      // направление: сверху вниз
  timeout_enabled: true,   // авто-удаление старых сообщений
  visual_log_enabled: true,// показывать на экране
  console_log_enabled: true,// дублировать в консоль
  background_color: 0x333333,
  text_color: 0x000000,
  text_size: 16,
  prefix_enabled: true,    // показывать префикс (уровень + источник)
  padding_multiplier: 1.5,
  margin: 16,
});
```

### AppSide / AppSettings логирование (v1.5.0+)

```javascript
// app-side/index.js
import { VisLogAppSide } from "@silver-zepp/vis-log/appside";
const vis = new VisLogAppSide();
vis.attachSideRelay(this);
vis.log("Hello from AppSide!");

// page/index.js — приём логов со стороны телефона
vis.initSideRelay(this, callback);
```

---

## Текущее состояние логов в Calendar

`page/index.js`:

```javascript
import { log as Logger } from "@zos/utils";
const logger = Logger.getLogger("calendar");
```

`Logger` из `@zos/utils` **пишет только в консоль IDE/эмулятора**. На физическом устройстве увидеть логи нельзя. Более того, `logger` объявлен, но **нигде не используется** — ни одного вызова `logger.log()` в коде нет.

`app.js` использует `console.log("app on create invoke")` — тоже только в консоль.

---

## Применимость VisLog к Calendar

| Сценарий | Описание | Польза |
|----------|----------|--------|
| **Отладка навигации** | Логировать `navigateMonth()` и `goToToday()` | Видно, в каком месяце/году сейчас пользователь |
| **Отладка сетки** | Логировать `requestCalendar()` — дни, isCurrentMonth, isToday | Видно, правильно ли рассчитываются 42 ячейки |
| **Отладка i18n** | Логировать `getFirstDayOfWeek()`, язык, названия месяцев/дней | Видно, какой язык и формат выбран |
| **AppSide-коммуникация** | Логировать запросы/ответы `GET_CALENDAR` | Отладка синхронизации с телефоном |
| **Производительность** | Замерить время `requestCalendar()` и `renderCalendar()` | Выявить медленные участки |

### Пример для Calendar

```javascript
import VisLog from "@silver-zepp/vis-log";
const vis = new VisLog("calendar");
vis.updateSettings({ line_count: 3, text_size: 14, timeout_enabled: true });

// В build():
vis.log("App started");

// В navigateMonth():
vis.info(`Navigate: ${currentMonth + 1}/${currentYear}`);

// В requestCalendar():
vis.debug(`Grid: ${daysInMonth} days, starts at idx ${startIdx}`);

// В renderCalendar():
const today = cells.find(c => c.isToday);
if (today) vis.log(`Today: ${today.day}`);
```

### Интеграция с AutoGUI

VisLog от того же автора. В примерах AutoGUI используется вместе с VisLog:

```javascript
import AutoGUI from "@silver-zepp/autogui";
import VisLog from "@silver-zepp/vis-log";
const gui = new AutoGUI();
const vis = new VisLog("index");
```

**Важно**: VisLog нужно рендерить **последним**, иначе он окажется под другими виджетами:

```javascript
// после gui.render()
vis.refresh();
```

---

## Вывод

| Аспект | Оценка |
|--------|--------|
| **Полезность для Calendar** | Средняя |
| **Основная ценность** | Отладка на физическом устройстве (сейчас логи только в консоль) |
| **Для production** | Не предназначен — чисто отладочный инструмент |
| **Рекомендация** | Полезно добавить на время разработки, особенно при отладке AppSide или i18n |

VisLog не улучшает и не упрощает интерфейс приложения (в отличие от AutoGUI). Это сугубо отладочный инструмент. Его имеет смысл подключать **временным образом** при разработке новых фич (например, синхронизация с телефоном через AppSide).

**Единственное преимущество**: замена мёртвого `logger` (который объявлен, но не используется) на работающую отладочную систему, видимую на экране часов.
