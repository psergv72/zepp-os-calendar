import * as hmUI from "@zos/ui";
import { px } from "@zos/utils";

const COL_COUNT = 7;
const DEVICE_H = 480;

export const CELL_W = px(44);
export const CELL_H = px(38);
export const GRID_LEFT = px(86);
export const GRID_TOP = px(Math.round(DEVICE_H * 0.33));

export const MONTH_YEAR = {
  x: px(80),
  y: px(Math.round(DEVICE_H * 0.12)),
  w: px(320),
  h: px(50),
  color: 0xffffff,
  text_size: px(30),
  align_h: hmUI.align.CENTER_H,
  align_v: hmUI.align.CENTER_V,
  text_style: hmUI.text_style.NONE,
};

export const NAV_PREV = {
  x: px(40),
  y: px(Math.round(DEVICE_H * 0.50 - 18)),
  w: px(40),
  h: px(36),
  text_size: px(24),
  radius: px(6),
  normal_color: 0x333333,
  press_color: 0x555555,
  text: "<",
};

export const NAV_NEXT = {
  x: px(400),
  y: px(Math.round(DEVICE_H * 0.50 - 18)),
  w: px(40),
  h: px(36),
  text_size: px(24),
  radius: px(6),
  normal_color: 0x333333,
  press_color: 0x555555,
  text: ">",
};

export const NAV_TODAY = {
  x: px(170),
  y: px(Math.round(DEVICE_H * 0.87)),
  w: px(140),
  h: px(40),
  text_size: px(22),
  radius: px(20),
  normal_color: 0x333333,
  press_color: 0x555555,
  text: "Today",
};

export function getWeekdayX(index) {
  return px(86) + index * px(44) + px(2);
}

export const WEEKDAY_PROPS = {
  y: px(Math.round(DEVICE_H * 0.26)),
  w: px(40),
  h: px(28),
  color: 0x888888,
  text_size: px(20),
  align_h: hmUI.align.CENTER_H,
  align_v: hmUI.align.CENTER_V,
  text_style: hmUI.text_style.NONE,
};

export function getCellX(col) {
  return GRID_LEFT + col * CELL_W + (CELL_W - px(36)) / 2;
}

export function getCellY(row) {
  return GRID_TOP + row * CELL_H + (CELL_H - px(34)) / 2;
}

export const CELL_TEXT_PROPS = (x, y) => ({
  x,
  y,
  w: px(36),
  h: px(34),
  text_size: px(24),
  align_h: hmUI.align.CENTER_H,
  align_v: hmUI.align.CENTER_V,
  text_style: hmUI.text_style.NONE,
});
