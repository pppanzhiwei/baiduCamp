import { MenuFood } from "./types";
import {
  GLOBAL_DOM,
  EVENT,
  menuMap,
  menuHTML,
  waitFoodPatientTime,
  waitLimit,
} from "./const_help";
import { debounce, disappearElement } from "./utils";
import { emitter } from "./eventEmit";
import { Food } from "./food";

enum CustomerState {
  INIT = "init",
  WAIT_SEAT = "wait_seat",
  SIT = "sit",
  WAIT_DISH = "wait_dish",
  EATING = "eating",
  WAIT_PAY = "wait_pay",
  ANGRY = "angry",
  LEAVE = "leave",
}
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
  public bgColorLeft: string;
  public bgColorRight;
  public dom: HTMLElement;
  public handleMenuClick;
  // 属性为姓名、头像、耐心值
  constructor(
    name: string,
    icon: string,
    waitPatient: number,
    chance: boolean,
    bgColorLeft: string,
    bgColorRight: string
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
    this.bgColorLeft = bgColorLeft; // 顾客背景图渐变
    this.bgColorRight = bgColorRight; // 顾客背景图渐变
    this.dom = null;
    this.handleMenuClick = null;
    // 初始化状态
    this.state = CustomerState.INIT; // 厨师状态
  }
  changeState(state: CustomerState, ...args) {
    this.state = state; // 状态改变
    switch (state) {
      case CustomerState.WAIT_SEAT: {
        this.startWait(this.waitPatient); //
        break;
      }
      case CustomerState.LEAVE: {
        this.leave();
        break;
      }
      // 入座状态todo
      case CustomerState.SIT: {
        this.goToSeat(args[0]);
        break;
      }
      case CustomerState.WAIT_DISH: {
        this.handleWaitDishes();
        break;
      }
      case CustomerState.ANGRY: {
        console.log("angry");
        break;
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
      this.bgColorLeft,
      this.bgColorRight
    );
    const progress = createProgress(
      "等待中",
      this.bgColorLeft,
      this.bgColorRight,
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
      this.bgColorLeft,
      this.bgColorRight
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
    <div class="customer-wrapper">
      <div class="customer-img-wrapper">
        <img src="" alt="">
      </div>
    </div>`;
    this.dom = null;
  }
  // TODO:更改顾客背景颜色

  // 创建每个菜的进度条, 参数为前缀、背景颜色
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

  startWait(n: number) {
    // 开启等位定时器， 时间到了就离开位置，删除相关的DOM
    this.timer = setTimeout(
      this.giveUpWait.bind(this),
      this.waitPatient * 1000
    );
  }
  // TODO:暂停进度条

  // 顾客放弃等位逻辑处理
  giveUpWait() {
    // 关闭定时器
    if (this.timer) clearTimeout(this.timer as NodeJS.Timeout);
    // 等待区位置的dom移除
    const index = this.removeFromWaitsDOM();
    // 状态切换为离开状态
    console.log(index);
    emitter.emit(EVENT.CANCEL_WAIT_SEAT, index); // 触发餐馆等待区数组数据变化, 需要删除的dom的索引
    this.reset(); // 自身数据初始化
  }
  // 顾客入座逻辑处理
  goToSeat(number) {
    // 1、关闭等待定时器
    if (this.timer) clearTimeout(this.timer as NodeJS.Timeout);
    // 2、删除等待区DOM
    this.removeFromWaitsDOM();
    // 3、渲染DOM到座位区
    this.seatNumber = number;
    this.createSeatCustomerDOM();
    // 创建自己的点菜菜单
    const menu = createMenu(); // 创建菜单
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
          document.body.removeChild(menu); // 关闭菜单
          document.removeEventListener("click", customer.handleMenuClick);
          menu = null;
          info = null;
          customer.handleMenuClick = null;
          // 进入等餐状态
          customer.changeState(CustomerState.WAIT_DISH);
          // TODO:
          emitter.emit(EVENT.FINISH_ORDER, customer.orderList);
        }
      }
      if (id === cancelId) {
        console.log("不点餐,离开了");
        // 销毁菜单
        // 隐藏点单信息
        disappearElement(GLOBAL_DOM.globalCustomerOrderDOM as HTMLElement);
        // 监听器清除
        disappearElement(GLOBAL_DOM.globalCustomerOrderDOM as HTMLElement);
        menu = null;
        info = null;
        document.removeEventListener("click", customer.handleMenuClick);
        customer.handleMenuClick = null;
        document.removeChild(menu);
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
    // 生成进度条
    this.renderDishesProgress(this.bgColorLeft, this.bgColorRight);
    // 开启定时器
    for (const food of this.orderList) {
      this.waitDishTimer.push(timeout(food.waitTime, food));
    }
    // 使用promiseAll表征所有菜都没有上齐
    Promise.all(this.waitDishTimer).then((result) => {
      this.changeState(CustomerState.ANGRY); // TODO:变更为生气状态
    });

    // 等餐计时函数
    function timeout(timer, food) {
      return new Promise((resolve, reject) => {
        // 定时时间， resolve表示放弃这道菜
        setTimeout(() => {
          resolve(food);
        }, timer * 1000);

      }).then((food:Food)=>{
        // 定时时间到
        food.belongTo = -1 // belongTo为 -1 表明不要这道菜了
        
      });
    }
  }

  leave() {
    // 1、删除餐桌顾客的DOM 2、通知餐馆更新餐桌数据 3、通知餐馆更新金钱数据
    this.removeFromSeatsDOM();
    emitter.emit(EVENT.LEAVE_SEAT, this.seatNumber);
    emitter.emit("customerPay", this.consume);
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

/* 厨师的状态定义 */
enum ChiefState {
  IDLE = "idle",
  COOKING = "cooking",
  COOKED = "cooked",
}
/* 状态相关联的类名 */
const ChiefStateBgColor = {
  idle: ["#DDDDDD", "#AAAAAA"],
  cooking: ["#FF9122", "#D96D00"],
  cooked: ["#AC91FF", "#7A4DFF"],
};

class Chief {
  public state: ChiefState;
  public task: Array<Food>;
  public workDay: number;
  public bgColorLeft: string;
  public bgColorRight: string;
  public dom: HTMLElement;
  public id: number;
  constructor(id: number, bgColorLeft = "#ccc", bgColorRight = "#ddd") {
    this.state = ChiefState.IDLE; // 厨师的状态
    this.id = id; // 厨师索引
    this.task = []; // 厨师的做菜队列
    this.workDay = 0;
    this.bgColorLeft = bgColorLeft; // 厨师背景图渐变
    this.bgColorRight = bgColorRight; // 厨师背景图渐变
    this.dom = null;
    emitter.on(EVENT.START_COOKING, this.handleStartWork.bind(this)); // 监听餐馆发出,表明有新的订单,可能有新的任务
  }
  changeState(state: ChiefState) {
    switch (state) {
      case ChiefState.IDLE: {
        this.state = ChiefState.IDLE;
        this.handleIdle();
        break;
      }
      case ChiefState.COOKING: {
        this.state = ChiefState.COOKING;
        this.handleStartCooking();
        break;
      }
      case ChiefState.COOKED: {
        this.state = ChiefState.COOKED;
        this.handleFinishCook();
        break;
      }
    }
  }
  // 显示解雇标志
  showFireIcon() {
    this.dom.classList.remove("chief-wrapper-cooking");
  }
  // 隐藏解雇标志
  hideFireIcon() {
    this.dom.classList.add("chief-wrapper-cooking");
  }
  // 显示上菜小图标
  showServingIcon() {
    this.dom.classList.add("chief-wrapper-cooked");
  }
  // 隐藏上菜小图标
  hideServingIcon() {
    this.dom.classList.remove("chief-wrapper-cooked");
  }

  // 转为空闲状态
  handleIdle() {}
  // 处理开始工作逻辑
  handleStartWork() {
    // 厨师当前处于空闲状态且任务队列不为空
    if (this.state === ChiefState.IDLE) {
      if (this.task.length > 0) {
        this.changeState(ChiefState.COOKING);
      }
    }
  }
  // 处理开始烹饪逻辑
  handleStartCooking() {
    const food = this.task.shift(); // 从任务队列中取出第一个菜开始制作
    this.hideFireIcon(); // 隐藏解雇标志
    this.changeBgColor(); // 改变厨师的颜色样式
    const progress = createProgress(
      food.name,
      this.bgColorLeft,
      this.bgColorRight,
      food.cookTime
    ); // 生成进度条
    this.dom.appendChild(progress);
    // 开启做菜定时器
    new Promise((resolve, reject) => {
      emitter.emit(EVENT.REVENUE_CHANGE, -food.cost); // 扣除做菜的成本
      // 开启定时器开始做菜
      setTimeout(() => {
        resolve(food); // 做菜结束后 状态发生改变
      }, food.cookTime * 1000);
    }).then((res) => {
      this.changeState(ChiefState.COOKED);
      // 发出事件 通知做完了
      emitter.emit(EVENT.FINISH_COOK, res); // 向外传递消息, 通知上菜
    });
  }
  // 菜品制作完成逻辑处理
  handleFinishCook() {
    // 1、改变颜色
    this.changeBgColor();
    // 2、出现上菜的小图标
    this.showServingIcon();
    // 3、改变进度条的颜色
    this.changeProgressStyle();
  }
  // 改变背景颜色，表征状态改变
  changeBgColor() {
    let that = this;
    changeColor();
    const wrapper = this.dom.firstChild as HTMLElement;
    wrapper.style.background = `linear-gradient(to right, ${this.bgColorLeft} 0%, ${this.bgColorLeft} 50%, ${this.bgColorRight} 51%, ${this.bgColorRight} 100%)`;
    function changeColor() {
      that.bgColorLeft = ChiefStateBgColor[that.state][0];
      that.bgColorRight = ChiefStateBgColor[that.state][1];
    }
  }
  // 改变进度条的颜色样式， 表征状态变化
  changeProgressStyle() {
    const progress: HTMLElement = this.dom.querySelector(".progress-wrapper");
    progress.style.backgroundColor = this.bgColorLeft;
  }
  // 生成厨师DOM结构
  createChiefDOM() {
    let that = this;
    const prefix = "chief";
    const imgUrl = "../public/assets/厨师.png";
    const chiefDOM = createDOM(
      "li",
      prefix,
      imgUrl,
      that.bgColorLeft,
      that.bgColorRight
    );
    chiefDOM.setAttribute("id", `chief-${this.id}`);
    this.dom = chiefDOM;
    return this.dom;
  }
  // 移除厨师的DOM
  removeChiefDOM() {
    const parent = GLOBAL_DOM.globalChiefsDOM;
    const ele = this.dom;
    removeDOM(parent, ele);
    this.dom = null;
  }
}

// 用于创建角色DOM结构的通用函数
function createDOM(
  nodeType: string,
  prefix: string,
  imgUrl: string,
  bgColorLeft: string,
  bgColorRight: string
) {
  const container = document.createElement(nodeType);
  container.setAttribute("class", `${prefix}-wrapper`);
  const innerHTML = `<div class="${prefix}-img-wrapper" style="background:linear-gradient(to right, ${bgColorLeft} 0%, ${bgColorLeft} 50%, ${bgColorRight} 51%, ${bgColorRight} 100%)">
  <img class="${prefix}-img" src=${imgUrl} alt="">
</div>`;
  container.innerHTML = innerHTML;
  return container;
}

// 用于移除角色的DOM结构的通用函数
function removeDOM(parent: Element, ele: HTMLElement) {
  parent.removeChild(ele);
}

// 创建进度条的通用函数
function createProgress(
  context: string,
  wrapperBg: string,
  innerBg: string,
  animationTime: number
) {
  const progressContainer = document.createElement("div");
  progressContainer.style.backgroundColor = wrapperBg;
  progressContainer.className = "progress-wrapper";
  progressContainer.innerHTML = `<div class="text">${context}</div>
  <div class="progress" style="background-color:${innerBg}"></div>
  `;
  const progress: HTMLElement = progressContainer.querySelector(".progress");
  progress.style.animationDuration = animationTime + "s";
  return progressContainer;
}
// TODO:进度条暂停
// 更改背景颜色的通用函数
function changeBgColor(
  ele: HTMLElement,
  bgColorLeft: string,
  bgColorRight: string
) {}
// 生成菜单的通用函数
function createMenu() {
  const menuWrapper = document.createElement("div");
  menuWrapper.className = "menu-wrapper";
  menuWrapper.innerHTML = menuHTML;
  document.body.appendChild(menuWrapper);
  return menuWrapper;
}

// 销毁菜单的通用函数
function removeMenu(menu) {
  document.body.removeChild(menu);
}

export { Customer, CustomerState, Chief };
