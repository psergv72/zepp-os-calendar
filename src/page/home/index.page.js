import * as hmUI from "@zos/ui";
import VisLog from "@silver-zepp/vis-log";
import AutoGUI from "@silver-zepp/autogui";
import { DEVICE_WIDTH, DEVICE_HEIGHT, IS_ROUND, SAFE_PADDING } from "../../utils/config/device";
import { BasePage } from "@zeppos/zml/base-page";
import { ACCENT_COLOR, WEEKEND_COLOR, TEXT_COLOR, TEXT_COLOR_DIM } from "../../utils/config/constants";
import { getFirstDayOfWeek, getMonthName, getDayNames, getTodayText } from "../../utils/locale";

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

  const p = 2;
  AutoGUI.SetPadding(p);
  AutoGUI.SetColor(0x333333);
  AutoGUI.SetTextColor(0xffffff);
  AutoGUI.SetBtnRadius(6);

  const localeFirstDay = getFirstDayOfWeek();
  const dayNames = getDayNames();
  const marginPct = IS_ROUND ? (SAFE_PADDING - p) / DEVICE_WIDTH * 100 : 0;
  const colPct = (100 - marginPct * 2) / COL_COUNT;
  const fullInnerPct = 100 - marginPct * 2;

  if (IS_ROUND) {
    titleWidget = gui.text("", { text_size: 28 });
    gui.rowLayout(100);
  } else {
    gui.button("<", () => PageInstance.navigateMonth(-1), { text_size: 24 });
    titleWidget = gui.text("", { text_size: 30 });
    gui.button(">", () => PageInstance.navigateMonth(1), { text_size: 24 });
    gui.rowLayout(15, 70, 15);
  }

  gui.newRow();
  if (IS_ROUND) { gui.text(" ", { color: 0x000000, text_size: 1 }); }
  for (let i = 0; i < COL_COUNT; i++) {
    const dayIndex = (i + localeFirstDay) % COL_COUNT;
    gui.text(dayNames[dayIndex], {
      color: (dayIndex === 0 || dayIndex === 6) ? WEEKEND_COLOR : 0x888888,
      text_size: 18,
    });
  }
  if (IS_ROUND) { gui.text(" ", { color: 0x000000, text_size: 1 }); }
  if (IS_ROUND) {
    gui.rowLayout(marginPct, ...Array(COL_COUNT).fill(colPct), marginPct);
  } else {
    gui.rowLayout(14.28, 14.28, 14.28, 14.28, 14.28, 14.28, 14.28);
  }

  for (let week = 0; week < 6; week++) {
    gui.newRow();
    if (IS_ROUND) { gui.text(" ", { color: 0x000000, text_size: 1 }); }
    for (let col = 0; col < COL_COUNT; col++) {
      cellWidgets.push(gui.text("", { text_size: 20, text_style: hmUI.text_style.MIDDLE }));
    }
    if (IS_ROUND) { gui.text(" ", { color: 0x000000, text_size: 1 }); }
    if (IS_ROUND) {
      gui.rowLayout(marginPct, ...Array(COL_COUNT).fill(colPct), marginPct);
    } else {
      gui.rowLayout(14.28, 14.28, 14.28, 14.28, 14.28, 14.28, 14.28);
    }
  }

  gui.newRow();
  if (IS_ROUND) {
    gui.text(" ", { color: 0x000000, text_size: 1 });
    gui.button(getTodayText(), () => PageInstance.goToToday(), { radius: 20, text_size: 20 });
    gui.text(" ", { color: 0x000000, text_size: 1 });
    gui.rowLayout(marginPct, fullInnerPct, marginPct);
  } else {
    gui.button(getTodayText(), () => PageInstance.goToToday(), { radius: 20, text_size: 22 });
  }

  todayCircle = hmUI.createWidget(hmUI.widget.CIRCLE, {
    center_x: 0,
    center_y: 0,
    radius: 14,
    color: ACCENT_COLOR,
    visible: false,
  });

  gui.render();

  if (IS_ROUND) {
    const rowH = (DEVICE_HEIGHT - p * 2) / 9;
    const gridY = p * 2 + rowH * 2;

    const btnW = SAFE_PADDING - p * 4;
    const btnH = rowH * 6;
    const prevMonth = () => PageInstance.navigateMonth(-1);
    const nextMonth = () => PageInstance.navigateMonth(1);

    navBtnLeft = hmUI.createWidget(hmUI.widget.BUTTON, {
      x: p, y: gridY, w: btnW, h: btnH,
      text: "<",
      text_size: 28,
      color: 0x444444,
      normal_color: 0x000000,
      press_color: 0x000000,
      radius: 6,
      click_func: prevMonth,
    });

    navBtnRight = hmUI.createWidget(hmUI.widget.BUTTON, {
      x: DEVICE_WIDTH - btnW - p, y: gridY, w: btnW, h: btnH,
      text: ">",
      text_size: 28,
      color: 0x444444,
      normal_color: 0x000000,
      press_color: 0x000000,
      radius: 6,
      click_func: nextMonth,
    });
  }

  const rowH = (DEVICE_HEIGHT - p * 2) / 9;
  if (IS_ROUND) {
    const effectiveCellW = (DEVICE_WIDTH - p * 2) * (colPct / 100);
    const gridStartX = p + (DEVICE_WIDTH - p * 2) * (marginPct / 100);
    gui._layoutCache = { p, rowH, cellW: effectiveCellW, gridY: p * 2 + rowH * 2, gridStartX };
  } else {
    const cellW = (DEVICE_WIDTH - p * 2) / 7;
    gui._layoutCache = { p, rowH, cellW, gridY: p * 2 + rowH * 2 };
  }
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

  if (IS_ROUND) {
    const p = 2;
    const rowH = (DEVICE_HEIGHT - p * 2) / 9;
    const gridY = p * 2 + rowH * 2;
    const btnW = SAFE_PADDING - p * 4;
    const btnH = rowH * 6;
    const prevMonth = () => PageInstance.navigateMonth(-1);
    const nextMonth = () => PageInstance.navigateMonth(1);

    if (navBtnLeft) { hmUI.deleteWidget(navBtnLeft); }
    if (navBtnRight) { hmUI.deleteWidget(navBtnRight); }

    navBtnLeft = hmUI.createWidget(hmUI.widget.BUTTON, {
      x: p, y: gridY, w: btnW, h: btnH,
      text: "<",
      text_size: 28,
      color: 0x444444,
      normal_color: 0x000000,
      press_color: 0x000000,
      radius: 6,
      click_func: prevMonth,
    });

    navBtnRight = hmUI.createWidget(hmUI.widget.BUTTON, {
      x: DEVICE_WIDTH - btnW - p, y: gridY, w: btnW, h: btnH,
      text: ">",
      text_size: 28,
      color: 0x444444,
      normal_color: 0x000000,
      press_color: 0x000000,
      radius: 6,
      click_func: nextMonth,
    });
  }

  const todayIdx = cells.findIndex(c => c.isToday);
  if (todayIdx >= 0) {
    const tw = cellWidgets[todayIdx].widget;
    todayCircle.setProperty(hmUI.prop.CENTER_X, Math.round(tw.getProperty(hmUI.prop.X) + tw.getProperty(hmUI.prop.W) / 2));
    todayCircle.setProperty(hmUI.prop.CENTER_Y, Math.round(tw.getProperty(hmUI.prop.Y) + tw.getProperty(hmUI.prop.H) / 2));
    todayCircle.setProperty(hmUI.prop.VISIBLE, true);
  } else {
    todayCircle.setProperty(hmUI.prop.VISIBLE, false);
  }
}

let PageInstance;
let navBtnLeft;
let navBtnRight;

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
