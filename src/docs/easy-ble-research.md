# Easy BLE — Исследование применимости в Calendar

## Что такое Easy BLE

**Easy BLE** (`@silver-zepp/easy-ble`) — библиотека для упрощённой работы с BLE (Bluetooth Low Energy) на ZeppOS v3+. Позволяет часам выступать в роли BLE Master — сканировать, подключаться, читать/писать характеристики и дескрипторы внешних BLE-устройств.

Установка: `npm i @silver-zepp/easy-ble`

Автор: Silver / Zepp Health.

---

## Ключевые возможности

| Метод | Описание |
|-------|----------|
| `ble.startScan(callback, options)` | Сканирование BLE-устройств |
| `ble.connect(MAC, callback)` | Подключение по MAC-адресу |
| `ble.disconnect()` | Отключение |
| `ble.generateProfileObject(services)` | Авто-генерация BLE-профиля |
| `ble.startListener(profile, callback)` | Запуск обработки событий |
| `ble.read.characteristic(uuid)` | Чтение характеристики |
| `ble.write.characteristic(uuid, data)` | Запись в характеристику |
| `ble.write.enableCharaNotifications(uuid, true)` | Подписка на уведомления |
| `ble.on.charaValueArrived(callback)` | Событие получения данных |
| `ab2hex()`, `ab2str()`, `ab2num()` | Конвертеры ArrayBuffer |
| `ble.get.devices()`, `ble.get.isConnected()` | Статус и данные |

---

## Текущая архитектура Calendar (связь с телефоном)

В проекте уже реализован `app-side` — механизм Zepp OS для коммуникации часов с телефоном:

```
Часы (page/index.js)                  Телефон (app-side/index.js)
       │                                       │
       │  ─── GET_CALENDAR {year, month} ───►  │
       │                                       │  вычисляет сетку
       │  ◄── {year, month, cells} ──────────  │
```

`app-side` не использует BLE — это встроенный механизм Zepp, работающий поверх существующего соединения часы-телефон.

`app.json` указывает только одно разрешение: `device:os.local_storage`. Разрешения BLE отсутствуют.

---

## Анализ применимости

### 1. Замена AppSideService на Easy BLE — НЕЦЕЛЕСООБРАЗНО

`AppSideService` — это родной для Zepp OS механизм коммуникации с телефоном. Он:
- Не требует BLE-разрешений
- Работает автоматически через существующее соединение часов с телефоном
- Не требует указания MAC-адресов, профилей, характеристик
- Выполняется в фоне на телефоне, не нагружая часы

Easy BLE для связи с телефоном не используется и не нужен.

### 2. Подключение внешних BLE-устройств — ПОТЕНЦИАЛЬНО ВОЗМОЖНО

Easy BLE раскрывается при подключении к **сторонним BLE-периферийным устройствам**:

| Сценарий | Описание |
|----------|----------|
| ESP32 с календарём | Часы подключаются к ESP32, который хранит/отдаёт события |
| BLE-сенсор | Отображение данных с датчика на календаре |
| Другой Amazfit | Чтение пульса/батареи соседних устройств (есть пример в репозитории) |

Для текущего Calendar это **не требуется** — приложение не имеет функциональности работы с внешними устройствами.

### 3. Требуемые изменения для внедрения

Если всё же потребуется BLE-функциональность, нужно:

**app.json** — добавить разрешения:
```json
"permissions": [
  "device:os.local_storage",
  "device:os.ble_master"
]
```

**page/index.js** — подключение и работа:
```javascript
import { BLEMaster } from "@silver-zepp/easy-ble";
const ble = new BLEMaster();

// Сканирование
ble.startScan((device) => {
  vis.log(`Found: ${device.name} [${device.mac}]`);
}, { duration: 5000 });

// Подключение
ble.connect("1A:2B:3C:4D:5E:6F", (result) => {
  if (result.connected) {
    const profile = ble.generateProfileObject({ "FF00": { "FF02": [] } });
    ble.startListener(profile, () => {
      ble.on.charaValueArrived((uuid, data, len) => {
        vis.log(`${uuid}: ${ab2str(data)}`);
      });
      ble.read.characteristic("FF02");
    });
  }
});
```

---

## Вывод

| Аспект | Оценка |
|--------|--------|
| **Необходимость в Calendar** | Отсутствует |
| **Совместимость с текущей архитектурой** | Easy BLE для BLE Master (часы → периферия), AppSideService для часы ↔ телефон. Разные задачи. |
| **Сложность внедрения** | Средняя (требуются BLE-разрешения, знание профилей устройств) |
| **Потенциальное применение** | Если в будущем Calendar будет показывать данные с внешних BLE-устройств (например, ESP32 с расписанием) |

Easy BLE — мощная библиотека, но для Calendar **неактуальна**. Текущий механизм `AppSideService` полностью покрывает потребности коммуникации с телефоном, а подключение внешних BLE-устройств выходит за рамки функциональности календаря.
