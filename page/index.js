import * as hmUI from "@zos/ui";
import VisLog from "@silver-zepp/vis-log";
import AutoGUI, { DEVICE_WIDTH, DEVICE_HEIGHT } from "@silver-zepp/autogui";
import { BasePage } from "@zeppos/zml/base-page";
import { ACCENT_COLOR, WEEKEND_COLOR, TEXT_COLOR, TEXT_COLOR_DIM } from "../utils/config/constants";
import { getFirstDayOfWeek, getMonthName, getDayNames, getTodayText } from "../utils/locale";

const vis = new VisLog("calendar");
vis.updateSettings({ line_count: 3, text_size: 14, timeout_enabled: true, visual_log_enabled: false });

const COL_COUNT = 7;

let currentYear;
let currentMonth;
let titleWidget;
const cellWidgets = [];
let todayCircle;
let gui;

function computeCells(year, month) {
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

  const todayCell = cells.find(c => c.isToday);
  vis.debug(`${daysInMonth} days, ${startIdx} offset` + (todayCell ? `, today=${todayCell.day}` : ""));
  return cells;
}

function createLayout() {
  gui = new AutoGUI();
  AutoGUI.SetPadding(2);
  AutoGUI.SetColor(0x333333);
  AutoGUI.SetTextColor(0xffffff);
  AutoGUI.SetBtnRadius(6);

  const localeFirstDay = getFirstDayOfWeek();
  const dayNames = getDayNames();

  gui.button("<", () => PageInstance.navigateMonth(-1), { text_size: 24 });
  titleWidget = gui.text("", { text_size: 30 });
  gui.button(">", () => PageInstance.navigateMonth(1), { text_size: 24 });
  gui.rowLayout(15, 70, 15);

  gui.newRow();
  for (let i = 0; i < COL_COUNT; i++) {
    const dayIndex = (i + localeFirstDay) % COL_COUNT;
    gui.text(dayNames[dayIndex], {
      color: (dayIndex === 0 || dayIndex === 6) ? WEEKEND_COLOR : 0x888888,
      text_size: 20,
    });
  }
  gui.rowLayout(14.28, 14.28, 14.28, 14.28, 14.28, 14.28, 14.28);

  for (let week = 0; week < 6; week++) {
    gui.newRow();
    for (let col = 0; col < COL_COUNT; col++) {
      cellWidgets.push(gui.text("", { text_size: 24, text_style: hmUI.text_style.NONE }));
    }
    gui.rowLayout(14.28, 14.28, 14.28, 14.28, 14.28, 14.28, 14.28);
  }

  gui.newRow();
  gui.button(getTodayText(), () => PageInstance.goToToday(), { radius: 20, text_size: 22 });

  gui.render();

  const p = AutoGUI.GetPadding();
  const rowH = (DEVICE_HEIGHT - p * 2) / 9;
  const cellW = (DEVICE_WIDTH - p * 2) / 7;

  todayCircle = hmUI.createWidget(hmUI.widget.CIRCLE, {
    center_x: 0,
    center_y: 0,
    radius: 16,
    color: ACCENT_COLOR,
    visible: false,
  });

  gui.render();

  gui._layoutCache = { p, rowH, cellW, gridY: p * 2 + rowH * 2 };
}

function updateDisplay(year, month, cells) {
  const localeFirstDay = getFirstDayOfWeek();
  const isCurrentMonth = cells.some(c => c.isToday);

  titleWidget.properties.text = `${getMonthName(month)} ${year}`;
  titleWidget.properties.color = isCurrentMonth ? WEEKEND_COLOR : TEXT_COLOR;

  for (let i = 0; i < 42; i++) {
    const cell = cells[i];
    const col = i % COL_COUNT;
    const dayOfWeek = (localeFirstDay + col) % COL_COUNT;
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

    cellWidgets[i].properties.text = String(cell.day);

    if (cell.isToday) {
      cellWidgets[i].properties.color = 0xffffff;
    } else if (cell.isCurrentMonth) {
      cellWidgets[i].properties.color = isWeekend ? WEEKEND_COLOR : TEXT_COLOR;
    } else {
      cellWidgets[i].properties.color = isWeekend ? 0x662222 : TEXT_COLOR_DIM;
    }
  }

  gui.render(true);

  const todayIdx = cells.findIndex(c => c.isToday);
  if (todayIdx >= 0 && gui._layoutCache) {
    const { p, rowH, cellW, gridY } = gui._layoutCache;
    const col = todayIdx % COL_COUNT;
    const week = Math.floor(todayIdx / COL_COUNT);

    todayCircle.setProperty(hmUI.prop.CENTER_X, Math.round(p + col * cellW + cellW / 2));
    todayCircle.setProperty(hmUI.prop.CENTER_Y, Math.round(gridY + week * rowH + rowH / 2));
    todayCircle.setProperty(hmUI.prop.VISIBLE, true);
  } else {
    todayCircle.setProperty(hmUI.prop.VISIBLE, false);
  }
}

let PageInstance;

Page(BasePage({
  state: {},
  build() {
    PageInstance = this;
    const now = new Date();
    currentYear = now.getFullYear();
    currentMonth = now.getMonth();

    createLayout();

    const cells = computeCells(currentYear, currentMonth);
    updateDisplay(currentYear, currentMonth, cells);

    vis.log(`${getMonthName(currentMonth)} ${currentYear} loaded`);
    vis.refresh();
  },

  navigateMonth(delta) {
    currentMonth += delta;
    if (currentMonth > 11) { currentMonth = 0; currentYear++; }
    else if (currentMonth < 0) { currentMonth = 11; currentYear--; }

    const cells = computeCells(currentYear, currentMonth);
    updateDisplay(currentYear, currentMonth, cells);
    vis.info(`→ ${getMonthName(currentMonth)} ${currentYear}`);
    vis.refresh();
  },

  goToToday() {
    const now = new Date();
    currentYear = now.getFullYear();
    currentMonth = now.getMonth();
    const cells = computeCells(currentYear, currentMonth);
    updateDisplay(currentYear, currentMonth, cells);
    vis.info(`← Today: ${getMonthName(currentMonth)} ${currentYear}`);
    vis.refresh();
  },
}));
