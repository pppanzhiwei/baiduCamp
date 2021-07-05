import { Food } from "./types";

/* 用于定义dom操作需要的className */
const className = {
  bgWrapper: "bg-wrapper",
  timeWeek: "time-week",
  timeDay: "time-day",
  revenue: "#revenue",
  waitAreas: ".wait-area",
  seatsAreas: ".customers-wrapper",
  orderInfoWrapper: ".customer-information",
  menu: ".menu-wrapper",
  chiefArea: ".chiefs-wrapper"
};
/* 全局菜单信息 */
const menuMap = new Map<string, Food>();
menuMap.set("凉拌黄瓜", {
  name: "凉拌黄瓜",
  price: 6,
  eatTime: 10,
  cookTime: 15,
  type: "cold",
});
menuMap.set("盐水花生", {
  name: "盐水花生",
  price: 8,
  eatTime: 10,
  cookTime: 15,
  type: "cold",
});
menuMap.set("盐水鸭", {
  name: "盐水鸭",
  price: 26,
  eatTime: 30,
  cookTime: 25,
  type: "main",
});
menuMap.set("农家小炒肉", {
  name: "农家小炒肉",
  price: 22,
  eatTime: 30,
  cookTime: 25,
  type: "main",
});
menuMap.set("金牌烧鹅", {
  name: "金牌烧鹅",
  price: 38,
  eatTime: 30,
  cookTime: 30,
  type: "main",
});
menuMap.set("蟹粉狮子头", {
  name: "蟹粉狮子头",
  price: 22,
  eatTime: 30,
  cookTime: 30,
  type: "main",
});
menuMap.set("外婆红烧肉", {
  name: "外婆红烧肉",
  price: 40,
  eatTime: 30,
  cookTime: 30,
  type: "main",
});
menuMap.set("鲜榨果汁", {
  name: "鲜榨果汁",
  price: 12,
  eatTime: 10,
  cookTime: 10,
  type: "drink",
});
menuMap.set("珍珠奶茶", {
  name: "珍珠奶茶",
  price: 16,
  eatTime: 10,
  cookTime: 10,
  type: "drink",
});

const globalWeekDOM = document.getElementsByClassName(className.timeWeek)[0];
const globalDayDOM = document.getElementsByClassName(className.timeDay)[0];
const globalRevenueDOM = document.querySelector(className.revenue);
const globalWrapperDOM = document.getElementsByClassName(
  className.bgWrapper
)[0]; // 全局遮罩层设置
const globalWaitsDOM = document.querySelector(className.waitAreas);
const globalSeatsDOM = document.querySelector(className.seatsAreas);
const globalCustomerOrderDOM = document.querySelector(
  className.orderInfoWrapper
);
const globalMenuDOM = document.querySelector(className.menu);
const globalChiefsDOM = document.querySelector(className.chiefArea)
const GLOBAL_DOM = {
  globalWeekDOM,
  globalDayDOM,
  globalRevenueDOM,
  globalWrapperDOM,
  globalWaitsDOM,
  globalSeatsDOM,
  globalCustomerOrderDOM,
  globalMenuDOM,
  globalChiefsDOM
};

/* 客人图片信息 */
const customIcon = {
  Icon1: "public/assets/客人1.png",
  Icon2: "public/assets/客人2.png",
  Icon3: "public/assets/客人2.png",
};
/* 限制常量 */
const waitLimit = 6; //等待区限制
const chiefsLimit = 6; // 厨师人数限制
const seatsLimit = 4; // 堂食人数限制
const setSecond = 240; // 全局时间
const chiefWeekMoney = 140; // 厨师周薪
/* 事件 */
const GLOBAL_EVENT = {
  NEW_DAY: "NEW_DAY",
  NEW_WEEK: "NEW_WEEK",
  NEW_SECOND: "NEW_SECOND",
  REVENUE_CHANGE: "REVENUE_CHANGE",
  SEATS_IN: "SEATS_IN",
  SEATS_OUT: "SEATS_OUT",
  WAITS_IN: " WAITS_IN",
  WAITS_OUT: "WAITS_OUT",
};
export {
  waitLimit,
  chiefsLimit,
  seatsLimit,
  GLOBAL_EVENT,
  GLOBAL_DOM,
  setSecond,
  menuMap,
};
