import { settings } from '@zos/settings'

function getStorageSnapshot() {
  try {
    return settings.settingsStorage.toObject() || {};
  } catch (e) {
    return {};
  }
}

function findCalendarData(storage, year, month) {
  const events = {};
  const holidays = [];

  const keys = Object.keys(storage);
  const calKeys = keys.filter(k =>
    k.toLowerCase().includes('calendar') ||
    k.toLowerCase().includes('cal') ||
    k.toLowerCase().includes('event') ||
    k.toLowerCase().includes('schedule') ||
    k.toLowerCase().includes('agenda')
  );

  for (const key of calKeys) {
    try {
      const raw = storage[key];
      if (typeof raw === 'string') {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          for (const item of parsed) {
            const d = new Date(item.startTime || item.start || item.date || item.dtstart);
            if (!isNaN(d.getTime()) && d.getFullYear() === year && d.getMonth() === month) {
              const day = d.getDate();
              if (!events[day]) events[day] = 0;
              events[day]++;
            }
          }
        } else if (parsed && typeof parsed === 'object') {
          for (const dayKey of Object.keys(parsed)) {
            const d = parseInt(dayKey, 10);
            if (d >= 1 && d <= 31) {
              const items = Array.isArray(parsed[dayKey]) ? parsed[dayKey] : [parsed[dayKey]];
              events[d] = (events[d] || 0) + items.length;
            }
          }
        }
      }
    } catch (e) {}
  }

  return { events, holidays };
}

function getFallbackHolidays(year, month, isRussian) {
  const ruHolidays = {
    0: [1, 2, 3, 4, 5, 6, 7, 8],
    1: [23],
    2: [8],
    4: [1, 9],
    5: [12],
    10: [4],
  };

  const enHolidays = {
    0: [1],
    6: [4],
    11: [25],
  };

  const map = isRussian ? ruHolidays : enHolidays;
  return map[month] || [];
}

function getFallbackEvents(year, month) {
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const events = {};
  const rng = ((year * 12 + month) * 31) % 13;
  const count = (rng % 5) + 2;

  for (let i = 0; i < count; i++) {
    const day = ((rng + i * 7) % daysInMonth) + 1;
    if (!events[day]) events[day] = 0;
    events[day]++;
  }

  return events;
}

AppSideService({
  onInit() {},
  onRequest(req, res) {
    if (req.method === "GET_EVENTS") {
      const y = req.params.year;
      const m = req.params.month;
      const isRussian = req.params.isRussian || false;

      let holidays, events, diag;

      try {
        const storage = getStorageSnapshot();

        const allKeys = Object.keys(storage);
        const sampleValues = {};
        for (const k of allKeys.slice(0, 20)) {
          const v = storage[k];
          sampleValues[k] = typeof v === 'string' ? v.substring(0, 100) : String(v).substring(0, 100);
        }

        console.log('[CAL_DIAG] all storage keys:', JSON.stringify(allKeys));
        console.log('[CAL_DIAG] sample values:', JSON.stringify(sampleValues));

        const calKeys = allKeys.filter(k =>
          k.toLowerCase().includes('calendar') ||
          k.toLowerCase().includes('cal') ||
          k.toLowerCase().includes('event') ||
          k.toLowerCase().includes('schedule') ||
          k.toLowerCase().includes('agenda')
        );
        console.log('[CAL_DIAG] calendar-related keys:', JSON.stringify(calKeys));

        const calData = findCalendarData(storage, y, m);

        diag = {
          allKeysCount: allKeys.length,
          allKeys: allKeys.slice(0, 50),
          calKeys,
          sampleValues,
          foundEventsCount: Object.keys(calData.events).length,
        };

        if (Object.keys(calData.events).length > 0) {
          events = calData.events;
          console.log('[CAL_DIAG] using REAL calendar events:', JSON.stringify(events));
        } else {
          events = getFallbackEvents(y, m);
          console.log('[CAL_DIAG] no real events found, using fallback');
        }

        holidays = getFallbackHolidays(y, m, isRussian);

        if (calData.holidays.length > 0) {
          holidays = [...new Set([...holidays, ...calData.holidays])];
        }
      } catch (e) {
        console.log('[CAL_DIAG] error:', e);
        holidays = getFallbackHolidays(y, m, isRussian);
        events = getFallbackEvents(y, m);
        diag = { error: String(e) };
      }

      res(null, { year: y, month: m, holidays, events, diag });
    }
  },
  onRun() {},
  onDestroy() {},
});
