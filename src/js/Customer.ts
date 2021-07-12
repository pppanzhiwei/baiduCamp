import { GLOBAL_DOM, EVENT, menuMap } from "./const_help";
import {
  changeBgColor,
  changeProgressStyle,
  createDOM,
  createProgress,
  debounce,
  disappearElement,
} from "./utils";
import { emitter } from "./eventEmit";
import { Food } from "./food";
enum CustomerState {
  INIT = "init",
  WAIT_SEAT = "waitSeat",
  SIT = "sit",
  WAIT_DISH = "waitDish",
  EATING = "eating",
  WAIT_PAY = "waitPay",
  ANGRY = "angry",
  LEAVE = "leave",
}
const CustomerStateBgColor = {
  init: ["#2693FF", "#006DD9"],
  waitDish: ["#FF2626", "#B20000"],
  eating: ["#FF9122", "#D96D00"],
  waitPay: ["#80FF00", "#00B200"],
  angry: ["rgb(102,26,0)", "rgb(64, 16, 0)"],
};
const CustomerStateProgressColor = {
  waiting: ["#2693FF", "#006DD9"],
  eating: ["#FF9122", "#D96D00"],
  used: "#00B200",
  giveUp: "#535362",
};
/* 顾客类 每一个顾客实例其进店的行为是一个状态机*/
class Customer {
  public name: string; // 姓名
  public icon: string; // 头像
  public timer: NodeJS.Timeout | null; // 等位 进餐定时器
  public orderList: Array<Food>; // 菜单
  public waitPatient: number; // 等位耐心度
  public chance: boolean; // 今日进店机会
  public waitDishTimer: Array<any>; // 等餐定时器数组
  public eatList: Array<Food>; // 实际进餐队列
  public consume: number; // 总花费
  public seatNumber: number; // 餐桌号码
  public waitNumber: number; // 等待区索引
  public state: CustomerState; // 状态
  public dom: HTMLElement;
  public handleMenuClick;
  // 属性为姓名、头像、耐心值
  constructor(
    name: string,
    icon: string,
    waitPatient: number,
    chance: boolean
  ) {
    this.name = name; // 顾客姓名
    this.icon = icon; // 顾客头像
    this.orderList = []; // 顾客的点单列表
    this.timer = null; // 顾客用于等位与进餐的定时器
    this.waitPatient = waitPatient; // 等待位置的时间
    this.chance = chance; // 今日进店机会
    this.waitDishTimer = []; // 等餐定时器数组
    this.eatList = []; // 实际进餐队列
    this.consume = 0; // 吃饭花费
    this.seatNumber = -1; // 餐桌序号
    this.dom = null;
    this.handleMenuClick = null;
    // 初始化状态
    this.state = CustomerState.INIT; // 厨师状态
  }
  changeState(state: CustomerState, ...args) {
    this.state = state;
    switch (state) {
      case CustomerState.WAIT_SEAT: {
        this.handleStartWait(this.waitPatient); //
        break;
      }
      case CustomerState.LEAVE: {
        this.dom.classList.remove("customer-wrapper-angry");
        this.dom.classList.remove("customer-wrapper-pay");
        this.leave();
        break;
      }
      case CustomerState.SIT: {
        this.handleGoToSeat(args[0]);
        break;
      }
      case CustomerState.WAIT_DISH: {
        this.handleWaitDishes();
        break;
      }
      case CustomerState.EATING: {
        this.replaceOldProgress(args[0]);
        this.changeCustomerBgColor();
        this.handleStartEating();
        break;
      }
      case CustomerState.ANGRY: {
        this.changeCustomerBgColor();
        this.dom.classList.add("customer-wrapper-angry");
        this.handleSatisfy();
        break;
      }
      case CustomerState.WAIT_PAY: {
        this.changeCustomerBgColor();
        this.dom.classList.add("customer-wrapper-pay");
        this.handlePay();
      }
    }
  }
  // 等待区DOM创建
  createWaitsDOM() {
    const customerDOM = document.createElement("div");
    customerDOM.setAttribute("class", "wait-customer");
    customerDOM.setAttribute("id", `wait-${this.name}`);
    const prefix = "wait";
    // itemContainer中包裹的是顾客头像与进度条
    const itemContainer = createDOM(
      "div",
      prefix,
      this.icon,
      CustomerStateBgColor.init[0],
      CustomerStateBgColor.init[1]
    );
    const progress = createProgress(
      "等待中",
      CustomerStateProgressColor.waiting[0],
      CustomerStateProgressColor.waiting[1],
      this.waitPatient
    );
    itemContainer.appendChild(progress);
    customerDOM.appendChild(itemContainer);
    this.dom = customerDOM;
    return this.dom;
  }
  // 从等待区销毁DOM 返回值为dom对应的index
  removeFromWaitsDOM() {
    const wrapperDOM = GLOBAL_DOM.globalWaitsDOM;
    const customerDOM = document.querySelector(`#wait-${this.name}`);
    const children = wrapperDOM.children;
    let index = -1;
    for (let i = 0; i < children.length; i++) {
      if (children[i].id === `wait-${this.name}`) {
        index = i;
        break;
      }
    }
    wrapperDOM.removeChild(customerDOM);
    this.dom = null;
    return index;
  }
  // 创建并渲染餐桌位置的DOM
  createSeatCustomerDOM() {
    const seatNumber = this.seatNumber;
    const container = GLOBAL_DOM.globalSeatsDOM;
    const prefix = "customer";
    const item = createDOM(
      "li",
      prefix,
      this.icon,
      CustomerStateBgColor.init[0],
      CustomerStateBgColor.init[1]
    );
    const progressWrapper = document.createElement("div");
    progressWrapper.setAttribute("class", "progress-container");
    item.appendChild(progressWrapper);
    this.dom = item;
    container.replaceChild(item, container.children[seatNumber]);
  }
  // 餐桌位置DOM销毁
  removeFromSeatsDOM() {
    const children = GLOBAL_DOM.globalSeatsDOM.children;
    children[this.seatNumber].innerHTML = `
      <div class="customer-img-wrapper">
        <img src="" alt="">
      </div>`;
    this.dom = null;
  }
  // 更改顾客背景颜色
  changeCustomerBgColor() {
    changeBgColor(this);
  }
  // 创建顾客点单生成的所有菜品进度条,背景颜色
  renderDishesProgress(wrapperBg: string, innerBg: string) {
    const children = GLOBAL_DOM.globalSeatsDOM.children;
    const customerWrapper = children[this.seatNumber];
    const progressContainer =
      customerWrapper.getElementsByClassName("progress-container")[0];
    const fragment = document.createDocumentFragment();
    for (const food of this.orderList) {
      const progress = createProgress(
        food.name,
        wrapperBg,
        innerBg,
        food.waitTime
      );
      food.dom = progress;
      fragment.appendChild(progress);
    }
    progressContainer.appendChild(fragment);
  }
  // 创建点餐时的实时价格信息显示 info
  createInfo() {
    const customerInfo = GLOBAL_DOM.globalCustomerOrderDOM; // 信息
    customerInfo.innerHTML = "";
    const infoWrapper = document.createElement("div");
    infoWrapper.className = "customer-text-info";
    infoWrapper.innerHTML = `${this.name}正在点菜，已经点了0元`;
    const infoFragment = document.createDocumentFragment();
    infoFragment.appendChild(infoWrapper);
    infoFragment.appendChild(this.dom.cloneNode(true));
    customerInfo.appendChild(infoFragment);
    (customerInfo as HTMLElement).style.display = "block";
    return infoWrapper; // 返回菜单的点餐信息
  }

  handleStartWait(n: number) {
    // 开启等位定时器， 时间到了就离开位置，删除相关的DOM
    this.timer = setTimeout(
      this.handleGiveUpWait.bind(this),
      this.waitPatient * 1000
    );
  }

  // 顾客放弃等位逻辑处理
  handleGiveUpWait() {
    // 关闭定时器
    if (this.timer) clearTimeout(this.timer as NodeJS.Timeout);
    this.timer = null;
    // 等待区位置的dom移除
    const index = this.removeFromWaitsDOM();
    // 状态切换为离开状态
    emitter.emit(EVENT.CANCEL_WAIT_SEAT, index); // 触发餐馆等待区数组数据变化, 需要删除的dom的索引
    this.reset(); // 自身数据初始化
  }
  // 顾客入座逻辑处理
  handleGoToSeat(number) {
    // 1、关闭等待定时器
    if (this.timer) clearTimeout(this.timer as NodeJS.Timeout);
    this.timer = null;
    // 2、删除等待区DOM
    this.removeFromWaitsDOM();
    // 3、渲染DOM到座位区
    this.seatNumber = number;
    this.createSeatCustomerDOM();
    // 显示点菜菜单
    const menu:HTMLElement = document.querySelector('.menu-wrapper') // 显示菜单
    menu.style.display = 'block'
    const info = this.createInfo();
    // 座位区数据改变
    this.handleMenuClick = debounce(this.orderFood(info, menu), 100);
    document.addEventListener("click", this.handleMenuClick);
  }
  // 顾客点单逻辑处理
  orderFood(info, menu) {
    let btnConfirmId = "orderSuccess";
    let btnCancelId = "orderFail";
    const btnConfirm = document.getElementById(btnConfirmId);
    let coldCheckbox = document.getElementsByName("cold");
    let drinkCheckbox = document.getElementsByName("drink");
    let mainFoodCheckbox = document.getElementsByName("main");
    let legalConfirm = false; // 初始化点餐是不合法的
    let money = 0; // 维护该用户订单总金额
    let radio = 0; // 维护该用户主餐的价格
    return (e) => {
      let target = e.target;
      let coldNum = countKind("cold");
      let drinkNum = countKind("drink");
      let mainNum = countKind("main");
      if (mainNum == 0 || coldNum >= 2 || drinkNum >= 2) {
        legalConfirm = false;
        console.log("按钮变颜色");
        btnConfirm.classList.add("button-illegal"); // 添加非法按钮的类名
      } else {
        legalConfirm = true;
        btnConfirm.classList.remove("button-illegal"); //删除非法按钮的类名
      }
      handleBtnClick(this, target, btnConfirmId, btnCancelId, menu);
      handleFoodClick(this, target, info);
    };

    // 计算每一种菜品类别的数量, 传入为对应选择框的id
    function countKind(dom: string) {
      const checkboxDOM = document.getElementsByName(dom);
      return [].filter.call(checkboxDOM, (item) => item.checked === true)
        .length;
    }
    // 点菜逻辑
    function handleFoodClick(customer: Customer, target, info: HTMLElement) {
      if (target.type === "checkbox") {
        // 如果target.checked属性为true,说明是取消选择
        if (target.checked) {
          money += Number(target.value);
        } else {
          money -= Number(target.value);
        }
      } else if (target.type === "radio") {
        const newVal = Number(target.value);
        money = money - radio + newVal;
        radio = newVal;
      }
      // 更新点单显示信息
      if (target.type === "checkbox" || target.type === "radio") {
        info.innerHTML = `${customer.name}正在点菜，已经点了${money}元`;
      }
    }
    // 点击按钮逻辑
    function handleBtnClick(
      customer: Customer,
      target,
      confirmId: string,
      cancelId: string,
      menu: HTMLElement
    ) {
      let id = target.id;
      // 点击的是确定按钮
      if (id === confirmId) {
        if (legalConfirm) {
          // 点餐完毕 用户进入等餐状态
          customer.addOrderList(coldCheckbox);
          customer.addOrderList(drinkCheckbox);
          customer.addOrderList(mainFoodCheckbox);
          // 关闭监听器与销毁菜单
          disappearElement(GLOBAL_DOM.globalCustomerOrderDOM as HTMLElement);
          disappearElement(menu as HTMLElement)
          disappearElement(GLOBAL_DOM.globalWrapperDOM as HTMLElement);
          /* document.body.removeChild(menu); */ // 关闭菜单
          document.removeEventListener("click", customer.handleMenuClick);
          menu = null;
          info = null;
          customer.handleMenuClick = null;
          // 进入等餐状态
          customer.changeState(CustomerState.WAIT_DISH);
          emitter.emit(EVENT.FINISH_ORDER, customer.orderList,customer.name);
        }
      }
      if (id === cancelId) {
        console.log("不点餐,离开了");
        // 销毁菜单
        // 隐藏点单信息
        disappearElement(GLOBAL_DOM.globalCustomerOrderDOM as HTMLElement);
        disappearElement(GLOBAL_DOM.globalWrapperDOM as HTMLElement);
        disappearElement(menu as HTMLElement)
        // 监听器清除
        disappearElement(GLOBAL_DOM.globalCustomerOrderDOM as HTMLElement);
        menu = null;
        info = null;
        document.removeEventListener("click", customer.handleMenuClick);
        customer.handleMenuClick = null;
        customer.changeState(CustomerState.LEAVE);
      }
    }
  }
  // 将菜单上被选中的菜加入到顾客的orderList中
  addOrderList(menu: NodeListOf<HTMLElement>) {
    for (let i = 0; i < menu.length; i++) {
      if ((menu[i] as any).checked) {
        const foodName = menu[i].getAttribute("dateName");
        const foodTemplate = menuMap.get(foodName);
        const food = new Food(foodTemplate);
        food.belongTo = this.seatNumber;
        this.orderList.push(food);
        (menu[i] as any).checked = false;
      }
    }
  }
  // 等待上菜逻辑处理
  handleWaitDishes() {
    let _this = this;
    this.changeCustomerBgColor();
    // 生成等餐进度条区域
    this.renderDishesProgress(
      CustomerStateBgColor.waitDish[0],
      CustomerStateBgColor.waitDish[1]
    );
    // 开启等餐定时器
    for (const food of this.orderList) {
      this.waitDishTimer.push(waitTimeout(food.waitTime, food));
    }
    // 使用promiseAll表征所有菜都没有上齐
    Promise.all(this.waitDishTimer).then((result) => {
      this.changeState(CustomerState.ANGRY); // 变更为生气状态
    });
    // 等餐计时函数，返回一个promise
    function waitTimeout(timer: number, food: Food) {
      return new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
          resolve(food);
        }, timer * 1000);
        food.dom.addEventListener("click", serveTheDish); // 点击到上菜图标，表示上菜完毕
        function serveTheDish() {
          reject(); // 触发状态改变
          const index = _this.orderList.findIndex((item) => item === food);
          clearTimeout(timeout);
          food.serveFinish();
          _this.orderList.splice(index, 1);
          _this.eatList.push(food);
          // 由等餐状态进入到进餐状态
          _this.changeState(CustomerState.EATING, food);
          food.dom.removeEventListener("click", serveTheDish);
        }
      }).then((food: Food) => {
        const index = _this.orderList.findIndex((item) => item === food);
        _this.orderList.splice(index, 1);
        _this.waitDishTimeout(food);
        // TODO:等餐时间到了 判断是否需要进入付款阶段 即没有餐了
        if (_this.orderList.length === 0 && _this.eatList.length === 0) {
          _this.changeState(CustomerState.WAIT_PAY);
        }
      });
    }
  }
  // 创建新的用餐进度条替换旧的等餐进度条
  replaceOldProgress(food: Food) {
    const progressContainer = this.dom.querySelector(".progress-container");
    const oldProgressWrapper = food.dom;
    const newProgressWrapper = createProgress(
      food.name,
      CustomerStateProgressColor.eating[0],
      CustomerStateProgressColor.eating[1],
      food.eatTime,
      "paused"
    );
    progressContainer.replaceChild(newProgressWrapper, oldProgressWrapper);
    food.dom = newProgressWrapper;
  }
  // 等待菜时间结束处理
  waitDishTimeout(food: Food) {
    // 等待菜的时间到了
    food.belongTo = -1; // belongTo为 -1 表明不要这道菜了
    setCancelProgressStyle(food);
    // 放弃的菜品对应的进度条显示
    function setCancelProgressStyle(food: Food) {
      const progressWrapper = food.dom;
      const text: HTMLElement = progressWrapper.querySelector(".text"); // 下划线样式
      text.style.textDecoration = "line-through";
      changeProgressStyle(food.dom, CustomerStateProgressColor.giveUp); // 改变进度条样式
      progressWrapper.classList.remove("dish-ready"); // 上菜图标消失
    }
  }
  // 处理进餐逻辑
  handleStartEating() {
    // 如果定时器存在 说明还没吃完
    console.log(this.timer);
    if (this.timer) {
      return;
    }
    new Promise((resolve, reject) => {
      // 开始吃饭
      const food = this.eatList[0];
      (food.dom.lastElementChild as HTMLElement).style.animationPlayState =
        "running";
      this.timer = setTimeout(() => {
        resolve(food);
      }, food.eatTime * 1000);
    }).then((food: Food) => {
      clearTimeout(this.timer);
      this.timer = null;
      this.eatList.shift();
      this.consume += food.cost; // 顾客消费增加
      food.dom.style.backgroundColor = CustomerStateProgressColor.used; // 更改进度条颜色为绿色 表示消费完成
      console.log(this.eatList);
      if (this.eatList.length > 0) {
        this.handleStartEating();
      } else {
        if (this.orderList.length === 0) {
          this.changeState(CustomerState.WAIT_PAY);
        }
      }
    });
  }
  handlePay() {
    let _this = this;
    this.dom.addEventListener("click", clickMoney.bind(_this));
    function clickMoney() {
      this.dom.removeEventListener("click", clickMoney);
      emitter.emit(EVENT.CUSTOMER_PAY, this.name,this.consume)
      this.changeState(CustomerState.LEAVE);
    }
  }
  // 安抚顾客
  handleSatisfy() {
    let _this = this;
    this.dom.addEventListener("click", clickStar.bind(_this));
    function clickStar() {
      this.dom.removeEventListener("click", clickStar);
      emitter.emit(EVENT.CUSTOMER_ANGRY, this.name)
      this.changeState(CustomerState.LEAVE);
    }
  }
  leave() {
    // 1、删除餐桌顾客的DOM 2、通知餐馆更新餐桌数据 3、通知餐馆更新金钱数据
    this.removeFromSeatsDOM();
    emitter.emit(EVENT.LEAVE_SEAT, this.seatNumber);
    emitter.emit(EVENT.REVENUE_CHANGE, this.consume);
    this.reset();
  }
  reset() {
    // 状态初始化
    this.chance = false;
    this.eatList = [];
    this.orderList = [];
    this.state = CustomerState.INIT;
    this.seatNumber = -1;
    this.waitNumber = -1;
    this.consume = 0;
    if (this.timer) {
      clearTimeout(this.timer);
    }
    if (this.waitDishTimer.length > 0) {
      for (const timer of this.waitDishTimer) {
        clearTimeout(timer);
      }
    }
  }
}
export {
  Customer,
  CustomerState,
  CustomerStateBgColor,
  CustomerStateProgressColor,
};
