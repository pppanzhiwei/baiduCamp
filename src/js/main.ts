import "./reset.ts";
import "../style/reset.css";
import "../style/border.css";
import "../style/index.css";
import { GLOBAL_EVENT, GLOBAL_DOM, waitLimit, menuMap } from "./const_help";
import {
  createModal,
  createButton,
  createInfoComponent,
  allInfo,
  openInfo,
  closeInfo,
} from "./modal";
import { modalType } from "./modal";
import { handleGlobalTimerInterval, setSecond } from "./timer";
import {
  disappearElement,
  showElement,
  isWaitEmpty,
  isChiefsEmpty,
  isSeatsEmpty,
  format,
  debounce,
  throttle,
} from "./utils";
import { GlobalTime, createCustomer } from "./types";
import {
  Customer,
  customerState,
  Chief,
  createWaitCustomerDOM,
  createSeatCustomerDOM,
  createChiefDOM,
} from "./gameCharacter";
import { EventEmit } from "./eventEmit";
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
window.$chiefs = [new Chief()];
window.$waits = [];
window.$seats = new Array(4);
window.$customers = [];
window.$EventEmit = new EventEmit();

/* 游戏初始化界面，wrapper生效生成弹窗并等待点击 */
const one = {
  Customer: new Customer(
    "潘志伟",
    "/public/assets/客人1.png",
    20,
    true,
    "rgb(38, 147, 255)",
    "rgb(0, 109, 217)"
  ),
  time: 1,
};
const two = {
  Customer: new Customer(
    "王",
    "/public/assets/客人2.png",
    50,
    true,
    "rgb(38, 147, 255)",
    "rgb(0, 109, 217)"
  ),
  time: 2,
};
const three = {
  Customer: new Customer(
    "3",
    "/public/assets/客人3.png",
    50,
    true,
    "rgb(255, 38, 38)",
    "rgb(178, 0, 0)"
  ),
  time: 20,
};
const four = {
  Customer: new Customer(
    "4",
    "/public/assets/客人2.png",
    50,
    true,
    "rgb(255, 38, 38)",
    "rgb(178, 0, 0)"
  ),
  time: 40,
};
const five = {
  Customer: new Customer(
    "5",
    "/public/assets/客人1.png",
    50,
    true,
    "rgb(255, 38, 38)",
    "rgb(178, 0, 0)"
  ),
  time: 30,
};

// 全局弹窗
let gameModal: HTMLDivElement;
let info: HTMLDivElement;
// 游戏初始化
window.onload = () => {
  gameModal = createModal({
    ...modalType.startModal,
    buttons: [
      {
        title: "开始经营吧",
        click: gameStart,
      },
    ],
  });
  document.body.appendChild(gameModal);
  // 等待区点击事件监听器开启
  const waitAreaEVentListener = GLOBAL_DOM.globalWaitsDOM.addEventListener(
    "click",
    throttle(handleWaitAreaClick, 300)
  );
  // TODO: 厨师区点击监听
  const chiefAreaEVentListener = GLOBAL_DOM.globalChiefsDOM.addEventListener(
    "click",
    throttle(handleChiefsAreaClick, 300)
  );
};

/* 开始游戏函数*/
function gameStart() {
  document.body.removeChild(gameModal);
  disappearElement(GLOBAL_DOM.globalWrapperDOM as HTMLElement);
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
  window.$EventEmit.on(GLOBAL_EVENT.WAITS_OUT, handleWaitTimeOut);
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
  // 如果等待区域无客人
  if (!window.$waits.length) return;
  const index = isSeatsEmpty();
  if (index === false) return;
  // 删除等待区DOM中的第一个节点 将对应顾客从等待区队列中移除
  const customer = window.$waits.shift();
  customer.orderNumber = index as number;
  const children = GLOBAL_DOM.globalWaitsDOM.children;
  GLOBAL_DOM.globalWaitsDOM.removeChild(children[0]);
  // 该顾客状态改变为进入餐桌状态
  customer.changeState(customerState.SIT);
  // 1、弹出菜单 遮罩层 开启customer定时器
  
}
//  等待区等待超时结果
function handleWaitTimeOut(customer: Customer) {
  // 等待时间到, 删除等位顾客节点
  console.log("延时时间到");
  let parent = GLOBAL_DOM.globalWaitsDOM;
  let son = document.querySelector(`#wait-${customer.name}`);
  parent.removeChild(son);
}
// 厨师点击后, 增加厨师
function handleChiefsAreaClick(e) {
  const area = GLOBAL_DOM.globalChiefsDOM;
  const add = area.lastChild;
  // 点击的是招聘新厨师
  if (add.contains(e.target)) {
    // 创建modal
    gameModal = createModal({
      ...modalType.wantedModal,
      buttons: [
        {
          title: "是的，确认招聘",
          click: handleAddNewChief,
        },
        {
          title: "先不了",
          click: handleDoNothing,
        },
      ],
    });
    // 显示遮罩层
    showElement(GLOBAL_DOM.globalWrapperDOM as HTMLElement);
  }
}

// 顾客入座处理订单
function handleSeatIn(customer: Customer) {
  let money = 0; // 维护用户订单总金额
  let radio = 0; // 维护用户主餐的价格
  let btnConfirmId: string = "orderSuccess";
  let btnCancelId: string = "orderFail";
  console.log(customer)
  const orderClickListener = GLOBAL_DOM.globalMenuDOM.addEventListener(
    "click",
    debounce(handleOrderClick, 500)
  );
  // 1、清除全局interval
  clearInterval(window.$restaurantTimer);
  // 2、显示遮罩层、菜单、用户点单界面
  showElement(GLOBAL_DOM.globalWrapperDOM as HTMLElement);
  showElement(GLOBAL_DOM.globalCustomerOrderDOM as HTMLElement);
  showElement(GLOBAL_DOM.globalMenuDOM as HTMLElement);
  // 3、渲染餐位DOM
  const customerInfo = GLOBAL_DOM.globalCustomerOrderDOM;
  const customerOrder = creatOrderInformation(customer);
  const parent = GLOBAL_DOM.globalSeatsDOM;
  const index = customer.orderNumber; // index为顾客的入座的餐桌号
  const oldNode = parent.children[index];
  const newNode = createSeatCustomerDOM(
    customer.name,
    customer.icon,
    customer.bgColorLeft,
    customer.bgColorRight
  );
  const infoFragment = document.createDocumentFragment();
  infoFragment.appendChild(customerOrder);
  infoFragment.appendChild(newNode.cloneNode(true));
  customerInfo.innerHTML = "";
  customerInfo.appendChild(infoFragment);
  console.log(newNode);
  newNode.id = `seat-${customer.name}`;
  console.log(newNode);
  window.$seats[index as number] = customer; // 数组变化
  parent.replaceChild(newNode, oldNode);
  // 菜单处理
  // 1、点单功能主要是两部分内容
  // 1、选择菜品时，总金钱会跟随变化
  // 2、点击不吃的时候 关闭按钮 ， 顾客进入离开状态 时间重新开始
  // 3、未选择主菜时，点击无效

  // 监听点击菜单的事件
  function handleOrderClick(e) {
    console.log(e);
    console.log(customer)
    let target = e.target;
    // 处理点击按钮事件
    handleBtnClick(customer,target, btnConfirmId, btnCancelId);
    // 处理菜品选择
    if (target.type === "checkbox") {
      // 如果target.checked属性为true,说明是取消选择
      console.log(target.checked);
      if (target.checked) {
        money += Number(target.value);
      } else {
        money -= Number(target.value);
      }
    }
    if (target.type === "radio") {
      const newVal = Number(target.value);
      money = money - radio + newVal;
      radio = newVal;
    }
    // 更新moneyDOM
    customerOrder.innerHTML = `${customer.name}正在点菜，已经点了${money}元`;
    // 点击事件处理
    function handleBtnClick(customer, target, confirmId: string, cancelId: string) {
      let id = target.id;
      if (id === confirmId) {
        let coldCheckbox = document.getElementsByName("cold");
        let drinkCheckbox = document.getElementsByName("drink");
        let mainFoodCheckbox = document.getElementsByName("main");
        let mainNum = [].filter.call(
          mainFoodCheckbox,
          (item) => item.checked === true
        ).length;
        let coldNum = [].filter.call(
          coldCheckbox,
          (item) => item.checked === true
        ).length;
        let drinkNum = [].filter.call(
          drinkCheckbox,
          (item) => item.checked === true
        ).length;
        // 点餐 1、判断菜单是否符合规则
        if (mainNum == 0 || coldNum >= 2 || drinkNum >= 2) {
          console.log("按规则选择菜单");
          return;
        } else {
          addOrderList(customer, coldCheckbox);
          addOrderList(customer, drinkCheckbox);
          addOrderList(customer, mainFoodCheckbox);
          // 渲染等餐DOM 进度条
          renderSeatProgress(customer, "seat");
          // TODO:进入等餐状态
          customer.changeState(customerState.WAIT_DISH);
          // 分发任务给厨师 // 绑定
          console.log("点好餐了，快点上菜");
          reset();
          // TODO: 短消息显示
        }
      } else if (id === cancelId) {
        console.log("不点餐,离开了");
        customer.changeState(customerState.LEAVE);
        reset();
      }
      function renderSeatProgress(customer: Customer, area: string) {
        debugger;
        let id = `${area}-${customer.name}`;
        let customerWrapper = document.getElementById(id);
        let progressContainer =
          customerWrapper.getElementsByClassName("progress-container")[0];
        const fragment = document.createDocumentFragment();
        for (let i = 0; i < customer.orderList.length; i++) {
          let progress = createProgress(customer.orderList[i].name);
          fragment.appendChild(progress);
        }
        progressContainer.appendChild(fragment);
      }
      function createProgress(dishName: string) {
        let wrapper = document.createElement("div");
        wrapper.className = "progress-wrapper";
        wrapper.innerHTML = `<div class="text">${dishName}</div>
        <div class="progress"></div>
        `;
        return wrapper;
      }
      function reset() {
        // 关闭modal
        disappearElement(GLOBAL_DOM.globalMenuDOM as HTMLElement);
        disappearElement(GLOBAL_DOM.globalCustomerOrderDOM as HTMLElement);
        disappearElement(GLOBAL_DOM.globalWrapperDOM as HTMLElement);
        // 开启全局定时器
        window.$restaurantTimer = setInterval(
          handleGlobalTimerInterval(window.$restaurantTime, setSecond),
          1000
        );
      }
      function addOrderList(customer, menu: NodeListOf<HTMLElement>) {
        for (let i = 0; i < menu.length; i++) {
          if ((menu[i] as any).checked) {
            const foodName = menu[i].getAttribute("dateName");
            const food = menuMap.get(foodName);
            customer.orderList.push(food);
            (menu[i] as any).checked = false;
          }
        }
      }
    }
  }
  // 函数用于创建用户点单时的显示头像与点餐价格的DOM
  function creatOrderInformation(customer: Customer) {
    const div = document.createElement("div");
    div.className = "customer-text-info";
    div.innerHTML = `${customer.name}正在点菜，已经点了0元`;
    return div;
  }
}

// 处理用户离座

// 处理用户离开餐桌事件
function handleSeatOut(customer: Customer) {
  // 1、将customer对应的window.$seat置为空2、用空图去替换DOM
  const index = customer.orderNumber;
  const parent = GLOBAL_DOM.globalSeatsDOM;
  console.log(parent);
  const seatDOM = parent.children[index];
  console.log(seatDOM);
  window.$seats[index] = undefined;
  // TODO: bug
  parent.replaceChild(
    createSeatCustomerDOM(undefined, undefined, "#dddddd", "#aaaaaa"),
    seatDOM
  );
}

/* 主流程，每一秒触发一次*/
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
      fragment.appendChild(
        createWaitCustomerDOM(
          customer.name,
          customer.icon,
          customer.bgColorLeft,
          customer.bgColorRight
        )
      );
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
  createNowCustomer(); // 到店顾客数据更新
}

// 初始化每日的顾客数据
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

// 招聘新厨师
function handleAddNewChief() {
  let len = window.$chiefs.length;
  if (len === 6) {
    console.log("厨师已经足够多了，无需再招聘");
    return;
  }
  // 增加dom与数据数组变化
  const chief = new Chief();
  window.$chiefs.push(chief);
  const parent = GLOBAL_DOM.globalChiefsDOM;
  const addArea = document.getElementById("addChief");
  const newChiefDOM = createChiefDOM("rgb(172, 145, 255)", "rgb(122, 77, 255)");
  GLOBAL_DOM.globalChiefsDOM.insertBefore(newChiefDOM, addArea);
  console.log(addArea);
  handleDoNothing();
  // 关闭招聘modal
  if (window.$chiefs.length === 6) {
    addArea.style.display = "none";
  } else {
    addArea.style.display = "flex";
  }
}
// 点击不招聘
function handleDoNothing() {
  // 删除弹框
  document.body.removeChild(gameModal);
  // 取消遮罩
  disappearElement(GLOBAL_DOM.globalWrapperDOM as HTMLElement);
}
