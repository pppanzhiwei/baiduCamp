import "./reset.ts";
import "../style/reset.css";
import "../style/border.css";
import "../style/index.css";
import { GLOBAL_EVENT, GLOBAL_DOM, waitLimit } from "./const_help";
import {
  createModal,
  createButton,
  closeModal,
  openModal,
  createInfoComponent,
  allInfo,
  openInfo,
  closeInfo,
} from "./modal";
import { startModal } from "./modal";
import { handleGlobalTimerInterval, setSecond } from "./timer";
import {
  closeWrapper,
  openWrapper,
  isWaitEmpty,
  isChiefsEmpty,
  isSeatsEmpty,
  format,
} from "./utils";
import { GlobalTime, createCustomer } from "./types";
import {
  Customer,
  customerState,
  Chief,
  createWaitCustomerDOM,
  createSeatCustomerDOM,
} from "./gameCharacter";
import { EventEmit } from "./eventEmit";
import { useReactive } from "./reactive/index";
// 全局window挂载属性
declare global {
  interface Window {
    $restaurantTime: GlobalTime;
    $restaurantTimer: NodeJS.Timeout;
    $revenue: number;
    $waits: Array<Customer>;
    $seats: Array<Customer>;
    $chiefs: Array<Chief>;
    $EventEmit: EventEmit;
    $customers: Array<createCustomer>;
  }
}
// 全局变量初始化
window.$restaurantTime = { week: 1, day: 1, second: 1 };
window.$restaurantTimer = null;
window.$revenue = 500;
window.$chiefs = [];
window.$waits = [];
window.$seats = new Array(4);
window.$customers = [];
window.$EventEmit = new EventEmit();

/* 开启事件监听器 */
const waitClickListener = GLOBAL_DOM.globalWaitsDOM.addEventListener(
  "click",
  (e) => {}
);

/* 游戏初始化界面，wrapper生效生成弹窗并等待点击 */
const one = {
  Customer: new Customer("潘志伟", "/public/assets/客人1.png", 100, true),
  time: 1,
};
const two = {
  Customer: new Customer("王", "/public/assets/客人2.png", 100, true),
  time: 2,
};
const three = {
  Customer: new Customer("3", "/public/assets/客人3.png", 100, true),
  time: 20,
};
const four = {
  Customer: new Customer("4", "/public/assets/客人2.png", 100, true),
  time: 40,
};
const five = {
  Customer: new Customer("5", "/public/assets/客人1.png", 100, true),
  time: 30,
};

// 全局弹窗
let gameModal: HTMLDivElement;
let info: HTMLDivElement;
// 游戏初始化
window.onload = () => {
  gameModal = createModal({
    ...startModal,
    buttons: [
      {
        title: "开始经营吧",
        click: gameStart,
      },
    ],
  });
  document.body.appendChild(gameModal);
  // 监听等待区
  const waitAreaEVentListener = GLOBAL_DOM.globalWaitsDOM.addEventListener(
    "click",
    handleWaitAreaClick
  );
};

/* 开始游戏函数*/
function gameStart() {
  document.body.removeChild(gameModal);
  closeModal(gameModal);
  closeWrapper(GLOBAL_DOM.globalWrapperDOM as HTMLElement);
  eventRegister(); // 完成初始事件注册
  dayEndTodo(); // 日数据初始化
  // 开启全局定时器
  window.$restaurantTimer = setInterval(
    handleGlobalTimerInterval(window.$restaurantTime, setSecond),
    1000
  );
}
/* event事件注册 */
function eventRegister() {
  window.$EventEmit.on(GLOBAL_EVENT.NEW_DAY, dayEndTodo);
  window.$EventEmit.on(GLOBAL_EVENT.NEW_WEEK, weekEndTodo);
  window.$EventEmit.on(GLOBAL_EVENT.NEW_SECOND, whileDo);
  window.$EventEmit.on(GLOBAL_EVENT.REVENUE_CHANGE, handleMoneyChange);
  window.$EventEmit.on(GLOBAL_EVENT.SEATS_IN, handleSeatIn);
  window.$EventEmit.on(GLOBAL_EVENT.SEATS_OUT, handleSeatOut);
}

// 全局日事件处理
function dayEndTodo() {
  window.$seats.fill(undefined);
  window.$waits = [];
  window.$customers = [];
  GLOBAL_DOM.globalWaitsDOM.innerHTML = "";
  createDayCustomer(); //生成本日顾客数据
}
// 周变化事件处理
function weekEndTodo() {
  payChiefs(window.$chiefs, 140); // 支付薪水，参考值为140
}
// 全局收入事件处理
function handleMoneyChange(value) {
  if (value < 0) {
    window.$revenue -= value;
  } else {
    window.$revenue += value;
  }
  GLOBAL_DOM.globalRevenueDOM.innerHTML = format(value);
}
// 点击等待区域处理
/* 逻辑 如果餐桌不为空，则点击无效，否则第一个顾客进入餐厅 */
function handleWaitAreaClick() {
  // 等待区域无客人
  if (!window.$waits.length) return
  const index = isSeatsEmpty();
  if (index === false) return;
  // 删除等待区DOM中的第一个节点 将对应顾客从等待区队列中移除
  const customer = window.$waits.shift();
  customer.orderNumber = index as number;
  const children = GLOBAL_DOM.globalWaitsDOM.children;
  GLOBAL_DOM.globalWaitsDOM.removeChild(children[0]);
  customer.changeState(customerState.SIT);
}

// 进入餐桌的事件处理
function handleSeatIn(customer: Customer) {
  const index = customer.orderNumber;
  window.$seats[index as number] = customer;
  // 1、渲染餐位DOM
  const parent = GLOBAL_DOM.globalSeatsDOM;
  const oldNode = parent.children[index];
  const newNode = createSeatCustomerDOM(customer.name, customer.icon);
  parent.replaceChild(newNode, oldNode);
  // 2、显示菜单
  console.log("时间停止");
  clearInterval(window.$restaurantTimer)
  openWrapper(GLOBAL_DOM.globalWrapperDOM as HTMLElement);
  console.log("我是菜单");
}

// 处理出座位事件
function handleSeatOut(customer: Customer) {
  // 1、将customer对应的window.$seat置为空2、用空图去替换DOM
  const index = customer.orderNumber;
  const parent = GLOBAL_DOM.globalSeatsDOM;
  const seatDOM = document.querySelector(`seat-${customer.name}`);
  window.$seats[index] = undefined;
  parent.replaceChild(createSeatCustomerDOM(undefined, undefined), seatDOM);
}


/* 每1s的流程 需要对当前时刻的客人的数量进行判断*/
function whileDo() {
  const createNowCustomer = () => {
    if (!isWaitEmpty()) {
      return;
    }
    // 1、得到当前时刻前往餐馆的顾客
    let len = window.$waits.length;
    const currentTime = window.$restaurantTime.second;
    let customers = window.$customers.filter(
      (item) => item.time == currentTime
    );
    // 当前时刻不存在进店顾客 直接return
    if (!customers.length) return;
    // 2、加入等待位的客人
    let index = 0;
    let customersLen = customers.length;
    // 创建缓存DOM
    const fragment = document.createDocumentFragment();
    while (len < waitLimit && index < customersLen) {
      const customer = customers[index].Customer;
      fragment.appendChild(createWaitCustomerDOM(customer.name, customer.icon));
      // DOM添加，并且对应的顾客进入等待状态
      window.$waits.push(customers[index].Customer);
      // 顾客状态切换
      customer.changeState(customerState.WAIT_SEAT);
      len++;
      index++;
    }
    // 将fragment加入DOM
    GLOBAL_DOM.globalWaitsDOM.appendChild(fragment);
  };
  createNowCustomer(); // 到店顾客数据更新逻辑
}

// 初始化一天的顾客数据
function createDayCustomer() {
  /* 生成日顾客数据 */
  console.log("日顾客数据初始化");
  window.$customers = [one, two, three, four, five].sort(
    (a, b) => a.time - b.time
  );
}
// 支付薪水函数
function payChiefs(chiefs: Array<Chief>, setMoney: number) {
  // 内部触发全局金钱变化
  let payOffAll: number = 0;
  for (const chief of chiefs) {
    let payOff = Math.ceil((chief.workDay / 7) * setMoney);
    payOffAll += payOff;
  }
  window.$EventEmit.emit(GLOBAL_EVENT.REVENUE_CHANGE, -payOffAll);
}
