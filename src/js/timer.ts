import { GLOBAL_DOM, GLOBAL_EVENT, setSecond } from "./const_help";
import { GlobalTime } from "./types";

/* 全局定时器处理函数 */
function handleGlobalTimerInterval(time: GlobalTime, setSecond: number) {
  let { week, day, second } = time;
  return function () {
    if (second >= 1 && second < setSecond) {
      second++;
    }
    // 新的一天
    if (second === setSecond) {
      second = 1;
      day++;
      window.$EventEmit.emit(GLOBAL_EVENT.NEW_DAY);
    }
    if (day > 7) {
      day = 1;
      week++;
      // 触发新的一周事件
      window.$EventEmit.emit(GLOBAL_EVENT.NEW_WEEK);
    }
    if (day !== time.day) {
      GLOBAL_DOM.globalDayDOM.innerHTML = `D${day}`;
      window.$restaurantTime.day = day
    }
    if (week !== time.week) {
      GLOBAL_DOM.globalWeekDOM.innerHTML = `W${week}`;
      window.$restaurantTime.week = week
    }
    window.$restaurantTime.second = second
    window.$EventEmit.emit(GLOBAL_EVENT.NEW_SECOND);
  };
}
export { handleGlobalTimerInterval, setSecond };
