import * as hmUI from "@zos/ui";
import { log as Logger } from "@zos/utils";
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
  CELL_W,
  CELL_H,
  GRID_LEFT,
  GRID_TOP,
} from "zosLoader:./index.[pf].layout.js";
import { ACCENT_COLOR, WEEKEND_COLOR, TEXT_COLOR, TEXT_COLOR_DIM } from "../utils/config/constants";
import { getFirstDayOfWeek, getMonthName, getDayNames, getTodayText } from "../utils/locale";

const logger = Logger.getLogger("calendar");
const COL_COUNT = 7;
const CELL_COUNT = 42;

let monthYearText;
let todayCircle;
let todayButton;
const dayTexts = [];

let currentYear;
let currentMonth;

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

    this.renderCalendar({ year, month, cells });
  },

  renderCalendar(data) {
    if (!data || !data.cells) return;

    const { year, month, cells } = data;
    monthYearText.setProperty(hmUI.prop.TEXT, `${getMonthName(month)} ${year}`);

    const localeFirstDay = getFirstDayOfWeek();
    let todayShown = false;

    for (let i = 0; i < CELL_COUNT; i++) {
      const cell = cells[i];
      const txt = dayTexts[i];
      const col = i % COL_COUNT;
      const dayOfWeek = (localeFirstDay + col) % 7;
      const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
      txt.setProperty(hmUI.prop.TEXT, String(cell.day));

      if (cell.isCurrentMonth) {
        txt.setProperty(hmUI.prop.COLOR, isWeekend ? WEEKEND_COLOR : TEXT_COLOR);
      } else {
        txt.setProperty(hmUI.prop.COLOR, isWeekend ? 0x662222 : TEXT_COLOR_DIM);
      }

      if (cell.isToday) {
        todayShown = true;
        const row = Math.floor(i / COL_COUNT);
        todayCircle.setProperty(hmUI.prop.CENTER_X, GRID_LEFT + col * CELL_W + CELL_W / 2);
        todayCircle.setProperty(hmUI.prop.CENTER_Y, GRID_TOP + row * CELL_H + CELL_H / 2);
        todayCircle.setProperty(hmUI.prop.VISIBLE, true);
        txt.setProperty(hmUI.prop.COLOR, 0xffffff);
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
