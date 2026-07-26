import * as hmUI from "@zos/ui";
import VisLog from "@silver-zepp/vis-log";
import AutoGUI from "@silver-zepp/autogui";
import { DEVICE_WIDTH, DEVICE_HEIGHT, IS_ROUND, SAFE_PADDING } from "../utils/config/device";
import { BasePage } from "@zeppos/zml/base-page";
import { ACCENT_COLOR, WEEKEND_COLOR, TEXT_COLOR, TEXT_COLOR_DIM } from "../utils/config/constants";
import { getFirstDayOfWeek, getMonthName, getDayNames, getTodayText } from "../utils/locale";

const vis = new VisLog("calendar");
vis.updateSettings({ line_count: 3, text_size: 16, timeout_enabled: true, visual_log_enabled: false });

const COL_COUNT = 7;
const ROW_PCTS = [14.28, 14.28, 14.28, 14.28, 14.28, 14.28, 14.28];

let currentYear;
let currentMonth;
let titleWidget;
const cellWidgets = [];
let todayCircle;
let gui;
let localeFirstDay;
let isWeekendCol;
let navBtnLeft;
let navBtnRight;

function computeCells(year, month) {
  const monthStart = new Date(year, month, 1);
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDay = monthStart.getDay();
  const startIdx = (firstDay - localeFirstDay + 7) % 7;
  const prevDays = new Date(year, month, 0).getDate();
  const now = new Date();
  const nowY = now.getFullYear();
  const nowM = now.getMonth();
  const nowD = now.getDate();
  const cells = [];
  let todayCell = null;

  for (let i = 0; i < 42; i++) {
    if (i < startIdx) {
      cells.push({ day: prevDays - startIdx + i + 1, isCurrentMonth: false, isToday: false });
    } else if (i >= startIdx + daysInMonth) {
      cells.push({ day: i - startIdx - daysInMonth + 1, isCurrentMonth: false, isToday: false });
    } else {
      const day = i - startIdx + 1;
      const isToday = year === nowY && month === nowM && day === nowD;
      cells.push({ day, isCurrentMonth: true, isToday });
      if (isToday) todayCell = cells[i];
    }
  }

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

  const dayNames = getDayNames();
  const marginPct = IS_ROUND ? (SAFE_PADDING - p) / DEVICE_WIDTH * 100 : 0;
  const colPct = (100 - marginPct * 2) / COL_COUNT;
  const fullInnerPct = 100 - marginPct * 2;
  const roundRowPcts = IS_ROUND ? [marginPct, colPct, colPct, colPct, colPct, colPct, colPct, colPct, marginPct] : null;

  if (IS_ROUND) {
    titleWidget = gui.text("", { text_size: 41 });
    gui.rowLayout(100);
  } else {
    gui.button("<", () => PageInstance.navigateMonth(-1), { text_size: 36 });
    titleWidget = gui.text("", { text_size: 45 });
    gui.button(">", () => PageInstance.navigateMonth(1), { text_size: 36 });
    gui.rowLayout(15, 70, 15);
  }

  gui.newRow();
  if (IS_ROUND) { gui.text(" ", { color: 0x000000, text_size: 1 }); }
  for (let i = 0; i < COL_COUNT; i++) {
    gui.text(dayNames[i], {
      color: isWeekendCol[i] ? WEEKEND_COLOR : 0x888888,
      text_size: 26,
    });
  }
  if (IS_ROUND) { gui.text(" ", { color: 0x000000, text_size: 1 }); }
  if (IS_ROUND) {
    gui.rowLayout(...roundRowPcts);
  } else {
    gui.rowLayout(...ROW_PCTS);
  }

  for (let week = 0; week < 6; week++) {
    gui.newRow();
    if (IS_ROUND) { gui.text(" ", { color: 0x000000, text_size: 1 }); }
    for (let col = 0; col < COL_COUNT; col++) {
      cellWidgets.push(gui.text("", { text_size: 30, text_style: hmUI.text_style.MIDDLE }));
    }
    if (IS_ROUND) { gui.text(" ", { color: 0x000000, text_size: 1 }); }
    if (IS_ROUND) {
      gui.rowLayout(...roundRowPcts);
    } else {
      gui.rowLayout(...ROW_PCTS);
    }
  }

  gui.newRow();
  if (IS_ROUND) {
    gui.text(" ", { color: 0x000000, text_size: 1 });
    gui.button(getTodayText(), () => PageInstance.goToToday(), { radius: 20, text_size: 30 });
    gui.text(" ", { color: 0x000000, text_size: 1 });
    gui.rowLayout(marginPct, fullInnerPct, marginPct);
  } else {
    gui.button(getTodayText(), () => PageInstance.goToToday(), { radius: 20, text_size: 33 });
  }

  todayCircle = hmUI.createWidget(hmUI.widget.CIRCLE, {
    center_x: 0,
    center_y: 0,
    radius: 21,
    color: ACCENT_COLOR,
    visible: false,
  });

  gui.render();

  const rowH = (DEVICE_HEIGHT - p * 2) / 9;

  if (IS_ROUND) {
    const btnW = SAFE_PADDING - p * 8;
    const btnH = rowH * 9;

    hmUI.createWidget(hmUI.widget.BUTTON, {
      x: p, y: p * 2, w: btnW, h: btnH,
      text: "<",
      text_size: 41,
      color: 0x666666,
      normal_color: 0x000000,
      press_color: 0x555555,
      radius: 6,
      click_func: () => PageInstance.navigateMonth(-1),
    });

    hmUI.createWidget(hmUI.widget.BUTTON, {
      x: DEVICE_WIDTH - btnW - p, y: p * 2, w: btnW, h: btnH,
      text: ">",
      text_size: 41,
      color: 0x666666,
      normal_color: 0x000000,
      press_color: 0x555555,
      radius: 6,
      click_func: () => PageInstance.navigateMonth(1),
    });

    const effectiveCellW = (DEVICE_WIDTH - p * 2) * (colPct / 100);
    const gridStartX = p + (DEVICE_WIDTH - p * 2) * (marginPct / 100);
    gui._layoutCache = { p, rowH, cellW: effectiveCellW, gridY: p * 2 + rowH * 2, gridStartX };
  } else {
    const cellW = (DEVICE_WIDTH - p * 2) / 7;
    gui._layoutCache = { p, rowH, cellW, gridY: p * 2 + rowH * 2 };
  }
}

function updateDisplay(year, month, cells) {
  titleWidget.properties.text = `${getMonthName(month)} ${year}`;

  let todayIdx = -1;
  let hasToday = false;

  for (let i = 0; i < 42; i++) {
    const cell = cells[i];
    const isWeekend = isWeekendCol[i % 7];

    cellWidgets[i].properties.text = String(cell.day);

    if (cell.isToday) {
      cellWidgets[i].properties.color = 0xffffff;
      todayIdx = i;
      hasToday = true;
    } else if (cell.isCurrentMonth) {
      cellWidgets[i].properties.color = isWeekend ? WEEKEND_COLOR : TEXT_COLOR;
    } else {
      cellWidgets[i].properties.color = isWeekend ? 0x662222 : TEXT_COLOR_DIM;
    }
  }

  titleWidget.properties.color = hasToday ? WEEKEND_COLOR : TEXT_COLOR;

  gui.render(true);

  if (IS_ROUND) {
    const p = 2;
    const rowH = (DEVICE_HEIGHT - p * 2) / 9;
    const btnW = SAFE_PADDING - p * 8;
    const btnH = rowH * 9;

    if (navBtnLeft) { hmUI.deleteWidget(navBtnLeft); }
    if (navBtnRight) { hmUI.deleteWidget(navBtnRight); }

    navBtnLeft = hmUI.createWidget(hmUI.widget.BUTTON, {
      x: p, y: p * 2, w: btnW, h: btnH,
      text: "<",
      text_size: 41,
      color: 0x666666,
      normal_color: 0x000000,
      press_color: 0x555555,
      radius: 6,
      click_func: () => PageInstance.navigateMonth(-1),
    });

    navBtnRight = hmUI.createWidget(hmUI.widget.BUTTON, {
      x: DEVICE_WIDTH - btnW - p, y: p * 2, w: btnW, h: btnH,
      text: ">",
      text_size: 41,
      color: 0x666666,
      normal_color: 0x000000,
      press_color: 0x555555,
      radius: 6,
      click_func: () => PageInstance.navigateMonth(1),
    });
  }

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

Page(BasePage({
  state: {},
  build() {
    PageInstance = this;
    localeFirstDay = getFirstDayOfWeek();
    isWeekendCol = [];
    for (let c = 0; c < 7; c++) {
      isWeekendCol[c] = (localeFirstDay + c) % 7 === 0 || (localeFirstDay + c) % 7 === 6;
    }
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
