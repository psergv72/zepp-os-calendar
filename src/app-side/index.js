import { BaseSideService } from "@zeppos/zml/base-side";

AppSideService(BaseSideService({
  onInit() {},
  onRequest(req, res) {
    if (req.method === "GET_CALENDAR") {
      const y = req.params.year;
      const m = req.params.month;
      const daysInMonth = new Date(y, m + 1, 0).getDate();
      const firstDay = new Date(y, m, 1).getDay();
      const startIdx = firstDay === 0 ? 6 : firstDay - 1;
      const prevDays = new Date(y, m, 0).getDate();
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
          isToday = now.getFullYear() === y && now.getMonth() === m && now.getDate() === day;
        }
        cells.push({ day, isCurrentMonth, isToday });
      }

      res(null, { year: y, month: m, cells });
    }
  },
  onRun() {},
  onDestroy() {},
}));
