import * as hmUI from "@zos/ui";
import { log as Logger } from "@zos/utils";
import { request } from "@zos/phone";
import {
  MONTH_YEAR,
  NAV_PREV,
  NAV_NEXT,
  NAV_TODAY,
  WEEKDAY_PROPS,
  getWeekdayX,
  CELL_TEXT_PROPS,
  getCellX,
  getCellY,
  DOT_TEXT_PROPS,
  getDotY,
  CELL_W,
  CELL_H,
  GRID_LEFT,
  GRID_TOP,
} from "zosLoader:./index.[pf].layout.js";
import {
  ACCENT_COLOR,
  WEEKEND_COLOR,
  TEXT_COLOR,
  TEXT_COLOR_DIM,
  HOLIDAY_COLOR,
  EVENT_DOT_COLOR,
} from "../utils/config/constants";
import { getFirstDayOfWeek, getMonthName, getDayNames, getTodayText } from "../utils/locale";

const logger = Logger.getLogger("calendar");
const COL_COUNT = 7;
const CELL_COUNT = 42;

let monthYearText;
let todayCircle;
let todayButton;
const dayTexts = [];
const eventDots = [];

let currentYear;
let currentMonth;

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

Page({
  state: {},
  build() {
    const now = new Date();
    currentYear = now.getFullYear();
    currentMonth = now.getMonth();

    const localeFirstDay = getFirstDayOfWeek();

    monthYearText = hmUI.createWidget(hmUI.widget.TEXT, {
      ...MONTH_YEAR,
      text: "Loading...",
      color: WEEKEND_COLOR,
    });

    hmUI.createWidget(hmUI.widget.BUTTON, {
      ...NAV_PREV,
      click_func: () => this.navigateMonth(-1),
    });

    hmUI.createWidget(hmUI.widget.BUTTON, {
      ...NAV_NEXT,
      click_func: () => this.navigateMonth(1),
    });

    todayButton = hmUI.createWidget(hmUI.widget.BUTTON, {
      ...NAV_TODAY,
      click_func: () => this.goToToday(),
    });
    todayButton.setProperty(hmUI.prop.TEXT, getTodayText());

    const dayNames = getDayNames();
    for (let i = 0; i < COL_COUNT; i++) {
      const dayIndex = (i + localeFirstDay) % COL_COUNT;
      const isWeekend = dayIndex === 0 || dayIndex === 6;
      hmUI.createWidget(hmUI.widget.TEXT, {
        ...WEEKDAY_PROPS,
        x: getWeekdayX(i),
        text: dayNames[dayIndex],
        color: isWeekend ? WEEKEND_COLOR : 0x888888,
      });
    }

    todayCircle = hmUI.createWidget(hmUI.widget.CIRCLE, {
      center_x: 0,
      center_y: 0,
      radius: 16,
      color: ACCENT_COLOR,
      visible: false,
    });

    for (let i = 0; i < CELL_COUNT; i++) {
      const row = Math.floor(i / COL_COUNT);
      const col = i % COL_COUNT;
      dayTexts.push(
        hmUI.createWidget(hmUI.widget.TEXT, {
          ...CELL_TEXT_PROPS(getCellX(col), getCellY(row)),
          text: "",
        })
      );
      eventDots.push(
        hmUI.createWidget(hmUI.widget.TEXT, {
          ...DOT_TEXT_PROPS(getCellX(col), getDotY(row)),
          text: "",
        })
      );
    }

    this.requestCalendar(currentYear, currentMonth);
  },

  requestCalendar(year, month) {
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const firstDay = new Date(year, month, 1).getDay();
    const localeFirstDay = getFirstDayOfWeek();
    const startIdx = (firstDay - localeFirstDay + 7) % 7;
    const prevDays = new Date(year, month, 0).getDate();
    const now = new Date();
    const cells = [];

    for (let i = 0; i < 42; i++) {
      let day, isCurrentMonth, isToday;
      if (i < startIdx) {
        day = prevDays - startIdx + i + 1;
        isCurrentMonth = false;
        isToday = false;
      } else if (i >= startIdx + daysInMonth) {
        day = i - startIdx - daysInMonth + 1;
        isCurrentMonth = false;
        isToday = false;
      } else {
        day = i - startIdx + 1;
        isCurrentMonth = true;
        isToday = now.getFullYear() === year && now.getMonth() === month && now.getDate() === day;
      }
      cells.push({ day, isCurrentMonth, isToday });
    }

    const isRussian = localeFirstDay === 1;
    const holidays = getFallbackHolidays(year, month, isRussian);
    const events = getFallbackEvents(year, month);

    this.renderCalendar({ year, month, cells, holidays, events });
    this.fetchEventsFromSide(year, month, isRussian);
  },

  fetchEventsFromSide(year, month, isRussian) {
    try {
      request({
        method: "GET_EVENTS",
        params: { year, month, isRussian },
      }).then((res) => {
        if (res && res.holidays && res.events) {
          if (res.diag) {
            logger.log("DIAG keys count:", res.diag.allKeysCount);
            logger.log("DIAG calKeys:", JSON.stringify(res.diag.calKeys));
            logger.log("DIAG sample:", JSON.stringify(res.diag.sampleValues));
            logger.log("DIAG events found:", res.diag.foundEventsCount);
          }
          if (res.events && Object.keys(res.events).length > 0) {
            this.updateIndicators(res.holidays, res.events);
          }
        }
      }).catch((err) => {
        logger.error("side request fail:", err);
      });
    } catch (e) {
      logger.error("side request error:", e);
    }
  },

  updateIndicators(holidays, events) {
    const cells = this._lastCells;
    if (!cells) return;

    for (let i = 0; i < CELL_COUNT; i++) {
      const cell = cells[i];
      const txt = dayTexts[i];
      const dots = eventDots[i];

      if (cell.isCurrentMonth) {
        const isHoliday = holidays.indexOf(cell.day) !== -1;

        if (!cell.isToday) {
          if (isHoliday) {
            txt.setProperty(hmUI.prop.COLOR, HOLIDAY_COLOR);
          }
        }

        const count = events[cell.day] || 0;
        if (count > 0) {
          const d = Math.min(count, 3);
          dots.setProperty(hmUI.prop.TEXT, "\u25CF".repeat(d));
          dots.setProperty(hmUI.prop.COLOR, EVENT_DOT_COLOR);
        } else {
          dots.setProperty(hmUI.prop.TEXT, "");
        }
      } else {
        dots.setProperty(hmUI.prop.TEXT, "");
      }
    }
  },

  renderCalendar(data) {
    if (!data || !data.cells) return;

    const { year, month, cells, holidays, events } = data;
    this._lastCells = cells;
    const localeFirstDay = getFirstDayOfWeek();
    let todayShown = false;

    monthYearText.setProperty(hmUI.prop.TEXT, `${getMonthName(month)} ${year}`);

    for (let i = 0; i < CELL_COUNT; i++) {
      const cell = cells[i];
      const txt = dayTexts[i];
      const dots = eventDots[i];
      const col = i % COL_COUNT;
      const dayOfWeek = (localeFirstDay + col) % 7;
      const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

      txt.setProperty(hmUI.prop.TEXT, String(cell.day));

      if (cell.isCurrentMonth) {
        const isHoliday = holidays.indexOf(cell.day) !== -1;
        const eventCount = events[cell.day] || 0;

        if (cell.isToday) {
          txt.setProperty(hmUI.prop.COLOR, 0xffffff);
        } else if (isHoliday) {
          txt.setProperty(hmUI.prop.COLOR, HOLIDAY_COLOR);
        } else if (isWeekend) {
          txt.setProperty(hmUI.prop.COLOR, WEEKEND_COLOR);
        } else {
          txt.setProperty(hmUI.prop.COLOR, TEXT_COLOR);
        }

        if (eventCount > 0) {
          const d = Math.min(eventCount, 3);
          dots.setProperty(hmUI.prop.TEXT, "\u25CF".repeat(d));
          dots.setProperty(hmUI.prop.COLOR, EVENT_DOT_COLOR);
        } else {
          dots.setProperty(hmUI.prop.TEXT, "");
        }
      } else {
        txt.setProperty(hmUI.prop.COLOR, isWeekend ? 0x662222 : TEXT_COLOR_DIM);
        dots.setProperty(hmUI.prop.TEXT, "");
      }

      if (cell.isToday) {
        todayShown = true;
        const row = Math.floor(i / COL_COUNT);
        todayCircle.setProperty(hmUI.prop.CENTER_X, GRID_LEFT + col * CELL_W + CELL_W / 2);
        todayCircle.setProperty(hmUI.prop.CENTER_Y, GRID_TOP + row * CELL_H + CELL_H / 2);
        todayCircle.setProperty(hmUI.prop.VISIBLE, true);
      }
    }

    if (!todayShown) {
      todayCircle.setProperty(hmUI.prop.VISIBLE, false);
    }
  },

  navigateMonth(delta) {
    currentMonth += delta;
    if (currentMonth > 11) { currentMonth = 0; currentYear++; }
    else if (currentMonth < 0) { currentMonth = 11; currentYear--; }
    this.requestCalendar(currentYear, currentMonth);
  },

  goToToday() {
    const now = new Date();
    currentYear = now.getFullYear();
    currentMonth = now.getMonth();
    this.requestCalendar(currentYear, currentMonth);
  },
});
