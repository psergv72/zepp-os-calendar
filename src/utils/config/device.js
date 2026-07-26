import { getDeviceInfo } from "@zos/device";

const { width: DEVICE_WIDTH, height: DEVICE_HEIGHT, screenShape } = getDeviceInfo();

export { DEVICE_WIDTH, DEVICE_HEIGHT };
export const IS_ROUND = screenShape === 1;
export const SAFE_PADDING = IS_ROUND ? Math.ceil(DEVICE_WIDTH * (1 - 1 / Math.SQRT2) / 2) : 2;
