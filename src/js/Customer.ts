import { EVENT, menuMap, className, CustomerStateBgColor } from "./const_help";
import {
  changeBgColor,
  createWaitDOM,
  createProgress,
  debounce,
  disappearElement,
  showElement,
  createSeatDOM,
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

/* 顾客类*/
class Customer {
  public name: string; // 姓名
  public icon: string; // 头像
  public visitTime: number; // 拜访餐厅的时间
  public timer: NodeJS.Timeout | null; // 等位 进餐定时器
  public orderList: Array<Food>; // 菜单
  public waitPatient: number; // 等位耐心度
  public waitDishTimer: Array<any>; // 等餐定时器数组
  public eatList: Array<Food>; // 实际进餐队列
  public consume: number; // 总花费
  public seatNumber: number; // 餐桌号码
  public waitNumber: number; // 等待区索引
  public state: CustomerState; // 状态
  public handleMenuClick;
  // 属性为姓名、头像、耐心值
  constructor(
    name: string,
    icon: string,
    waitPatient: number,
    visitTime: number
  ) {
    this.name = name; // 顾客姓名
    this.icon = icon; // 顾客头像
    this.orderList = []; // 顾客的点单列表
    this.timer = null; // 顾客用于等位与进餐的定时器
    this.waitPatient = waitPatient; // 等待位置的时间
    this.waitDishTimer = []; // 等餐定时器数组
    this.eatList = []; // 实际进餐队列
    this.consume = 0; // 吃饭花费
    this.seatNumber = -1; // 餐桌序号
    this.visitTime = visitTime;
    this.handleMenuClick = null;
    // 初始化状态
    this.state = CustomerState.INIT; // 厨师状态
  }
  changeState(state: CustomerState, ...args) {
    this.state = state;
    switch (state) {
      case CustomerState.WAIT_SEAT: {
        this.handleStartWait(); 
        break;
      }
      case CustomerState.LEAVE: {
        this.leave();
        break;
      }
      case CustomerState.SIT: {
        this.handleGoToSeat(args[0]);
        break;
      }
      case CustomerState.WAIT_DISH: {
        this.handleWaitDishes(args[0]);
        break;
      }
      case CustomerState.EATING: {
        this.handleStartEating();
        break;
      }
      case CustomerState.ANGRY: {
        this.handleSatisfy();
        break;
      }
      case CustomerState.WAIT_PAY: {
        this.handlePay();
        break;
      }
    }
  }
  // 等待区DOM结构创建
  handleCreateWaitsDOM() {
    const customerDOM = document.createElement("div");
    customerDOM.setAttribute("class", "wait-customer");
    customerDOM.setAttribute("id", `wait-${this.name}`);
    const innerHTML = createWaitDOM(
      this.icon,
      CustomerStateBgColor.init[0],
      CustomerStateBgColor.init[1],
      this.waitPatient
    );
    customerDOM.innerHTML = innerHTML;
    return customerDOM;
  }
  // 从等待区销毁DOM 返回值为dom对应的index
  removeFromWaitsDOM() {
    const wrapperDOM = document.querySelector(className.waitAreas);
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
    return index;
  }
  // 创建并渲染餐桌位置的DOM
  createSeatCustomerDOM(index: number) {
    const container = document.getElementById(`seat-${index}`);
    const innerHTML = createSeatDOM(
      this.icon,
      CustomerStateBgColor.waitDish[0],
      CustomerStateBgColor.waitDish[1]
    );
    container.innerHTML = innerHTML;
  }
  // 餐桌位置DOM消失
  removeFromSeatsDOM() {
    const seat = document.getElementById(`seat-${this.seatNumber}`);
    seat.innerHTML = `<div class="customer-img-wrapper"></div>`;
  }
  // 更改顾客的背景颜色
  changeCustomerBgColor() {
    changeBgColor(this);
  }
  // 创建顾客点单生成的所有菜品进度条,背景颜色
  renderDishesProgress(wrapperBg: string, innerBg: string) {
    const seat = document.getElementById(`seat-${this.seatNumber}`);
    const progressContainer = seat.querySelector(".progress-container");
    const fragment = document.createDocumentFragment();
    for (const food of this.orderList) {
      const progress = createProgress(
        food.name,
        food.waitTime,
        "dish-wait-progress-wrapper"
      );
      food.dom = progress;
      fragment.appendChild(progress);
    }
    progressContainer.appendChild(fragment);
  }
  // 显示点餐时的信息
  showOrderInfo() {
    const customerInfo: HTMLElement = document.querySelector(
      className.orderInfoWrapper
    );
    customerInfo.innerHTML = `
      <div class="customer-img-wrapper">
        <img src=${this.icon} alt="">
      </div>
      <div class="customer-text-info">
        ${this.name}正在点菜，已经点了0元
      </div>
    `;
    customerInfo.style.display = "block";
  }

  handleStartWait() {
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
    emitter.emit(EVENT.CANCEL_WAIT_SEAT, index); // 触发餐馆等待区数组数据变化, 需要删除的索引
    this.reset(); // 自身数据初始化
  }
  // 顾客入座逻辑处理, number为即将入座的索引
  handleGoToSeat(number) {
    let _this = this;
    // 1、关闭等待定时器
    if (this.timer) clearTimeout(this.timer as NodeJS.Timeout);
    this.timer = null;
    // 2、删除等待区DOM
    this.removeFromWaitsDOM();
    // 显示点菜菜单
    const menu: HTMLElement = document.querySelector(".menu-wrapper"); // 显示菜单
    showElement(menu);
    this.showOrderInfo(); // 显示点单信息
    this.handleMenuClick = debounce(orderFood(menu), 5);
    document.addEventListener("click", this.handleMenuClick); // 监听菜单点击事件

    // 顾客点单逻辑处理
    function orderFood(menu) {
      const btnConfirmId = "orderSuccess";
      const btnCancelId = "orderFail";
      const btnConfirm = document.getElementById(btnConfirmId);
      let legalConfirm = false; //
      let money = 0; // 维护该用户订单总金额
      let radio = 0; // 维护该用户主餐的价格
      return (e) => {
        let target = e.target;
        let coldNum = countKind("cold");
        let drinkNum = countKind("drink");
        let mainNum = countKind("main");
        if (mainNum == 0 || coldNum >= 2 || drinkNum >= 2) {
          legalConfirm = false;
          btnConfirm.classList.add("button-illegal"); // 添加非法按钮的类名
        } else {
          legalConfirm = true;
          btnConfirm.classList.remove("button-illegal"); //删除非法按钮的类名
        }
        handleBtnClick(_this, target, menu);
        handleFoodClick(_this.name, target);
      };

      // 计算每一种菜品类别的数量, 传入为对应选择框的id
      function countKind(dom: string) {
        const checkboxDOM = document.getElementsByName(dom);
        return [].filter.call(checkboxDOM, (item) => item.checked === true)
          .length;
      }
      // 点菜逻辑
      function handleFoodClick(name, target) {
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
          const info = document.querySelector(".customer-text-info");
          info.innerHTML = `${name}正在点菜，已经点了${money}元`;
        }
      }
      // 点击按钮逻辑
      function handleBtnClick(customer: Customer, target, menu: HTMLElement) {
        let id = target.id;
        const confirmId = "orderSuccess";
        const cancelId = "orderFail";
        // 点击的是确定按钮
        if (id === confirmId) {
          if (legalConfirm) {
            // 订单确认 此时顾客的座位属性已确定
            customer.seatNumber = number;
            // 关闭监听器与菜单
            disappearElement(
              document.querySelector(className.orderInfoWrapper)
            );
            disappearElement(document.querySelector(".bg-wrapper"));
            disappearElement(document.querySelector(".menu-wrapper"));
            const foodList = document.getElementsByClassName("food"); // 找到dom中所有类名为food的input项
            customer.addOrderList(foodList);
            document.removeEventListener("click", customer.handleMenuClick);
            menu = null;
            customer.handleMenuClick = null;
            // 进入等餐状态
            customer.changeState(CustomerState.WAIT_DISH, number);
            emitter.emit(EVENT.FINISH_ORDER, customer);
          }
        }
        // 取消按钮
        if (id === cancelId) {
          disappearElement(document.querySelector(className.orderInfoWrapper));
          disappearElement(document.querySelector(".bg-wrapper"));
          disappearElement(document.querySelector(".menu-wrapper"));
          menu = null;
          document.removeEventListener("click", customer.handleMenuClick);
          customer.handleMenuClick = null;
          customer.changeState(CustomerState.LEAVE);
        }
      }
    }
  }
  // 将菜单上被选中的菜加入到顾客的orderList中
  addOrderList(menu: HTMLCollectionOf<Element>) {
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
  handleWaitDishes(index: number) {
    let dishesNumber = this.orderList.length;
    let _this = this;
    // 生成餐桌位置的的DOM
    this.createSeatCustomerDOM(index);
    // 生成等餐进度条
    this.renderDishesProgress(
      CustomerStateBgColor.waitDish[0],
      CustomerStateBgColor.waitDish[1]
    );
    // 开启等餐定时器
    for (const food of this.orderList) {
      this.waitDishTimer.push(waitTimeout(food.waitTime, food));
    }
    // 使用promiseAll表示所有菜都没有上齐
    Promise.all(this.waitDishTimer).then((result) => {
      console.log("promise all 触发了");
      this.changeState(CustomerState.ANGRY); // 变更为生气状态
    }).catch((res)=>{
      console.log('至少上了一个菜')
    });
    // 等餐计时函数，返回promise
    function waitTimeout(timer: number, food: Food) {
      return new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
          resolve(food);
        }, timer * 1000);
        food.dom.addEventListener("click", serveTheDish); // 点击到上菜图标，表示上菜完毕
        function serveTheDish() {
          const index = _this.orderList.findIndex((item) => item === food);
          clearTimeout(timeout);
          food.serveFinish();
          _this.orderList.splice(index, 1);
          _this.eatList.push(food);
          // 由等餐状态进入到进餐状态
          food.dom.classList.remove("dish-ready");
          food.dom.classList.add("dish-eat-progress-wrapper");
          _this.changeState(CustomerState.EATING, food);
          food.dom.removeEventListener("click", serveTheDish);
          reject(); // 触发状态改变
        }
      }).then((food: Food) => {
        const index = _this.orderList.findIndex((item) => item === food);
        _this.orderList.splice(index, 1);
        _this.waitDishTimeout(food);
        // 等餐时间到了 判断是否需要进入付款阶段 即没有餐了
        if (_this.orderList.length === 0 && _this.eatList.length === 0) {
          setTimeout(() => {
            if(_this.state !== CustomerState.ANGRY)
            _this.changeState(CustomerState.WAIT_PAY);
          });
        }
      });
    }
  }
  // 等待菜时间结束处理
  waitDishTimeout(food: Food) {
    // 等待菜的时间到了
    food.belongTo = -1; // belongTo为 -1 表明不要这道菜了
    // 放弃的菜品对应的进度条显示
    const progressWrapper = food.dom;
    progressWrapper.classList.remove(
      "dish-wait-progress-wrapper",
      "dish-ready"
    );
    progressWrapper.classList.add("dish-giveUp-progress-wrapper");
  }
  // 处理进餐逻辑
  handleStartEating() {
    this.changeCustomerBgColor();
    // 如果定时器存在 说明还没吃完
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
      this.consume += food.price; // 顾客消费增加
      // 进度条颜色为绿色 表示消费完成
      food.dom.classList.add("dish-finish-progress-wrapper");
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
    this.changeCustomerBgColor();
    const dom = document.getElementById(`seat-${this.seatNumber}`);
    dom.classList.add("customer-wrapper-pay");
    this.timer = setTimeout(()=>{
      emitter.emit(EVENT.CUSTOMER_PAY, this.name,this.consume);
      this.changeState(CustomerState.LEAVE);
    },5000)
    dom.addEventListener("click", this.clickIcon.bind(this));
  }
  clickIcon() {
      clearTimeout(this.timer)
      if(this.state === CustomerState.WAIT_PAY) {
        emitter.emit(EVENT.CUSTOMER_PAY, this.name,this.consume);
      } else {
        emitter.emit(EVENT.CUSTOMER_ANGRY, this.name);
      }
      this.changeState(CustomerState.LEAVE);
  }
  // 安抚顾客
  handleSatisfy() {
    this.changeCustomerBgColor();
    const dom = document.getElementById(`seat-${this.seatNumber}`);
    dom.classList.add("customer-wrapper-angry");
    dom.addEventListener("click", this.clickIcon.bind(this));
  }
  leave() {
    // 1、删除餐桌顾客的DOM 2、通知餐馆更新餐桌数据 3、通知餐馆更新金钱数据
    if(this.seatNumber >=0) {
      const dom = document.getElementById(`seat-${this.seatNumber}`);
      dom.classList.remove("customer-wrapper-angry", "customer-wrapper-pay");
      this.removeFromSeatsDOM();
      dom.outerHTML = dom.outerHTML
      emitter.emit(EVENT.LEAVE_SEAT, this.seatNumber); // 离开座位
      if(this.consume) {
        emitter.emit(EVENT.REVENUE_CHANGE, this.consume) // 餐馆收入变更
      }
    }
    this.reset();
  }
  reset() {
    this.eatList = [];
    this.orderList = [];
    this.state = CustomerState.INIT;
    this.seatNumber = -1;
    this.waitNumber = -1;
    this.consume = 0;
    this.visitTime = 0;
    if (this.timer) {
      clearTimeout(this.timer);
    }
    this.timer = null
    if (this.waitDishTimer.length > 0) {
      for (const timer of this.waitDishTimer) {
        clearTimeout(timer);
      }
    }
    this.waitDishTimer = []
  }
}
export { Customer, CustomerState, CustomerStateBgColor };
