
/* 用于定义dom操作需要的className */
const className = {
  bgWrapper: "bg-wrapper",
  timeWeek: "time-week",
  timeDay: "time-day",
  revenue:　'#revenue',
  waitAreas: '.wait-area',
  seatsAreas: '.customers-wrapper'
};


const globalWeekDOM = document.getElementsByClassName(className.timeWeek)[0];
const globalDayDOM = document.getElementsByClassName(className.timeDay)[0];
const globalRevenueDOM = document.querySelector(className.revenue)
const globalWrapperDOM = document.getElementsByClassName(className.bgWrapper)[0]; // 全局遮罩层设置
const globalWaitsDOM = document.querySelector(className.waitAreas)
const globalSeatsDOM = document.querySelector(className.seatsAreas)
const GLOBAL_DOM = {
  globalWeekDOM,
  globalDayDOM,
  globalRevenueDOM,
  globalWrapperDOM,
  globalWaitsDOM,
  globalSeatsDOM
}

/* 客人图片信息 */
const customIcon  = {
  Icon1:'public/assets/客人1.png',
  Icon2: 'public/assets/客人2.png',
  Icon3: 'public/assets/客人2.png',
}
/* 限制常量 */
const waitLimit = 6; //等待区限制
const chiefsLimit = 6; // 厨师人数限制
const seatsLimit = 4; // 堂食人数限制
const setSecond = 240; // 全局时间
const chiefWeekMoney = 140 // 厨师周薪
/* 事件 */
const GLOBAL_EVENT = {
  NEW_DAY: 'NEW_DAY',
  NEW_WEEK: 'NEW_WEEK',
  NEW_SECOND: 'NEW_SECOND',
  REVENUE_CHANGE:'REVENUE_CHANGE',
  SEATS_IN:'SEATS_IN',
  SEATS_OUT: 'SEATS_OUT',
  WAITS_IN:' WAITS_IN',
  WAITS_OUT:'WAITS_OUT',
}
export { waitLimit, chiefsLimit, seatsLimit, GLOBAL_EVENT, GLOBAL_DOM, setSecond};
