import { MenuFood } from "./types";



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
  chiefArea: ".chiefs-wrapper",
};
/* 全局菜单信息 */
const menuMap = new Map<string, MenuFood>();
menuMap.set("凉拌黄瓜", {
  name: "凉拌黄瓜",
  cost:2,
  price: 6,
  waitTime:15,
  eatTime: 10,
  cookTime: 5,
});
menuMap.set("盐水花生", {
  name: "盐水花生",
  cost:3,
  price: 8,
  waitTime:10,
  eatTime: 10,
  cookTime: 5,
});
menuMap.set("盐水鸭", {
  name: "盐水鸭",
  cost:13,
  price: 26,
  waitTime:35,
  eatTime: 30,
  cookTime: 30,
});
menuMap.set("农家小炒肉", {
  name: "农家小炒肉",
  cost:10,
  price: 22,
  waitTime:40,
  eatTime: 30,
  cookTime: 30,
});
menuMap.set("金牌烧鹅", {
  name: "金牌烧鹅",
  cost:16,
  price: 38,
  waitTime:40,
  eatTime: 30,
  cookTime: 30,
});
menuMap.set("蟹粉狮子头", {
  name: "蟹粉狮子头",
  cost: 10,
  price: 22,
  waitTime:40,
  eatTime: 30,
  cookTime: 30,
});
menuMap.set("外婆红烧肉", {
  name: "外婆红烧肉",
  cost: 16,
  price: 40,
  waitTime:40,
  eatTime: 30,
  cookTime: 30,
});
menuMap.set("鲜榨果汁", {
  name: "鲜榨果汁",
  cost:6,
  price: 12,
  waitTime:15,
  eatTime: 10,
  cookTime: 10,
});
menuMap.set("珍珠奶茶", {
  name: "珍珠奶茶",
  cost:6,
  price: 14,
  waitTime: 20,
  eatTime: 10,
  cookTime: 10,
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
const globalChiefsDOM = document.querySelector(className.chiefArea);
const GLOBAL_DOM = {
  globalWeekDOM,
  globalDayDOM,
  globalRevenueDOM,
  globalWrapperDOM,
  globalWaitsDOM,
  globalSeatsDOM,
  globalCustomerOrderDOM,
  globalMenuDOM,
  globalChiefsDOM,
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
const chiefWeekMoney = 100; // 厨师周薪
const maxChiefNumber = 6 // 厨师最大数
const minChiefNUmber = 1
// 等菜的耐心值
const waitFoodPatientTime = {
  cold: 30,
  drink: 30,
  main: 60,
};
/* 事件 */
const EVENT = {
  CANCEL_WAIT_SEAT: "cancelWaitSeat",
  START_COOKING: "startCooking",
  RECRUIT_CHIEF: "recruitChief",
  RECRUIT_SUCCESS:"recruitSuccess",
  FINISH_ORDER: "finishOrder",
  CUSTOMER_SEAT: "customer_seat",
  LEAVE_SEAT:"leaveSeat",
  TIME_CONTINUE:"timeContinue",
  REVENUE_CHANGE: "revenueChange",
  FIRE_CHIEF: "fireChief",
  FINISH_COOK:"finishCook",
  CUSTOMER_COME:"customerCome",
  CUSTOMER_PAY: "CUSTOMER_PAY",
  CUSTOMER_ANGRY: "CUSTOMER_ANGRY",
  MONEY_INSUFFICIENT:"MONEY_INSUFFICIENT",
  FIRE_SUCCESS:"FIRE_SUCCESS"
};

/* TODO:如果需要动态生成菜单的时候需要 （暂时未实现） */
const menuHTML = `
<div class="menu-content-area">
  <div class="menu-list menu-cold">
    <h3 class="title">凉菜 (二选一，可不点)</h3>
    <ul class="menu-class">
      <li class="menu-item">
        <input type='checkbox' value=6 dateName='凉拌黄瓜' id='cold1' name="cold">
        <label for='cold1'>
          <div class="item-name">凉拌黄瓜</div>
          <div class="middle">...............</div>
          <div class="item-price">￥6</div>
        </label>
      </li>
      <li class="menu-item">
        <input type='checkbox' dateName='盐水花生' value=8 name="cold" id='cold2'>
        <label for='cold2'>
          <div class="item-name">盐水花生</div>
          <div class="middle">...............</div>
          <div class="item-price">￥8</div>
        </label>
      </li>
    </ul>
  </div>
  <div class="menu-list menu-main">
    <h3 class="title">主菜 (五选一，必点)</h3>
    <ul class="menu-class">
      <li class="menu-item">
        <input type='radio' id='main1' dateName='盐水鸭'  value=26 name="main">
        <label for='main1'>
          <div class="item-name">盐水鸭</div>
          <div class="middle">...............</div>
          <div class="item-price">￥26</div>
        </label>
      </li>
      <li class="menu-item">
        <input type='radio' id='main2' dateName='农家小炒肉' value=22 name="main">
        <label for='main2'>
          <div class="item-name">农家小炒肉</div>
          <div class="middle">...............</div>
          <div class="item-price">￥22</div>
        </label>
      </li>
      <li class="menu-item">
        <input type='radio' id='main3' dateName='金牌烧鹅' value=38 name="main">
        <label for='main3'>
          <div class="item-name">金牌烧鹅</div>
          <div class="middle">...............</div>
          <div class="item-price">￥38</div>
        </label>
      </li>
      <li class="menu-item">
        <input type='radio' id='main4' dateName='蟹粉狮子头' value=22 name="main">
        <label for='main4'>
          <div class="item-name">蟹粉狮子头</div>
          <div class="middle">...............</div>
          <div class="item-price">￥22</div>
        </label>
      </li>
      <li class="menu-item">
        <input type='radio' id='main5' dateName='外婆红烧肉' value=40 name="main">
        <label for='main5'>
          <div class="item-name">外婆红烧肉</div>
          <div class="middle">...............</div>
          <div class="item-price">￥40</div>
        </label>
      </li>
    </ul>
  </div>
  <div class="menu-list menu-drink">
    <h3 class="title">饮品 (二选一，可不点)</h3>
    <ul class="menu-class">
      <li class="menu-item">
        <input type='checkbox' id='drink1' dateName='鲜榨果汁' value=12 name="drink">
        <label for='drink1'>
          <div class="item-name">鲜榨果汁</div>
          <div class="middle">...............</div>
          <div class="item-price">￥12</div>
        </label>
      </li>
      <li class="menu-item">
        <input type='checkbox' id='drink2' dateName='珍珠奶茶' value=16 name="drink">
        <label for='drink2'>
          <div class="item-name">珍珠奶茶</div>
          <div class="middle">...............</div>
          <div class="item-price">￥16</div>
        </label>
      </li>
    </ul>
  </div>
</div>
<div class="button-area">
  <button class="button-left button"  id="orderSuccess">点好了，快点上菜</button>
  <button class="button-right button" id="orderFail">不吃了</button>
</div>`;
export {
  waitLimit,
  chiefsLimit,
  seatsLimit,
  EVENT,
  GLOBAL_DOM,
  setSecond,
  menuMap,
  chiefWeekMoney,
  waitFoodPatientTime,
  maxChiefNumber,
  minChiefNUmber,
  menuHTML
};
