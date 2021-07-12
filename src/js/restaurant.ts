import {
  chiefWeekMoney,
  EVENT,
  GLOBAL_DOM,
  maxChiefNumber,
  setSecond,
  waitLimit,
} from "./const_help";
import { Chief } from "./Chief";
import { Customer, CustomerState } from "./Customer";
import { createCustomer, GlobalTime } from "./types";
import { format } from "./utils";
import { emitter } from "./eventEmit";
import { Food } from "./food";
const one = {
  Customer: new Customer("潘志伟", "/public/assets/客人1.png", 50, true),
  time: 1,
};
const two = {
  Customer: new Customer("王", "/public/assets/客人2.png", 50, true),
  time: 2,
};
const three = {
  Customer: new Customer("3", "/public/assets/客人3.png", 50, true),
  time: 20,
};
const four = {
  Customer: new Customer("4", "/public/assets/客人2.png", 50, true),
  time: 40,
};
const five = {
  Customer: new Customer("5", "/public/assets/客人1.png", 50, true),
  time: 30,
};

// 餐馆类
class Restaurant {
  public restaurantTime: GlobalTime; // 餐馆时间
  public restaurantTimer: NodeJS.Timeout; // 餐馆interval
  public revenue: number; // 收入
  public waits: Array<Customer>; // 等待区数组
  public seats: Array<Customer>; // 餐桌区数组
  public chiefs: Array<Chief>; // 厨师区数组
  public customers: Array<createCustomer>; // 一日餐馆的顾客数组
  static instance: Restaurant;
  public taskQueue: Array<Food>; // 任务队列
  public finishQueue: Array<Food>; // 做完的菜
  constructor() {
    if (!Restaurant.instance) {
      this.restaurantTime = { week: 1, day: 1, second: 1 };
      this.revenue = 500; // 餐馆
      this.waits = []; // 等待区
      this.seats = new Array(4).fill(undefined); // 维护4个座位
      this.chiefs = new Array(maxChiefNumber).fill(null); // 维护厨师
      this.customers = []; // 维护日访问的顾客数据
      this.taskQueue = []; // 维护任务队列
      this.finishQueue = []; // 维护完成的队列
      emitter.on(EVENT.CANCEL_WAIT_SEAT, this.waitsDateChange.bind(this)); // 订阅顾客放弃等位的事件并进行处理
      emitter.on(EVENT.LEAVE_SEAT, this.seatsDateChange.bind(this)); // 订阅顾客离开餐桌事件
      emitter.on(EVENT.REVENUE_CHANGE, this.moneyChange.bind(this)); // 订阅顾客消费完成事件处理
      emitter.on(EVENT.FINISH_ORDER, this.handleFinishOrder.bind(this)); // 订阅顾客点单完毕
      emitter.on(EVENT.FINISH_COOK, this.handleCookTaskFinish.bind(this));
      Restaurant.instance = this;
    }
    return Restaurant.instance;
  }
  // TODO: 点单完毕 全局时间继续 进度条时间是否要控制？
  timeContinue() {
    console.log(this.restaurantTime);
    this.gameStart();
  }
  // 说明厨师烹饪完成了
  handleCookTaskFinish(food: Food) {
    const targetSeat = food.belongTo;
    // 表明顾客放弃这道菜了
    if (targetSeat === -1) {
      // TODO: 等待5s 是否有新的订单需要这道菜
    } else {
      const progress = food.dom;
      progress.classList.add("dish-ready");
    }
  }

  // 表示顾客点单完毕事件发生：1、重新开启计时 2、分配任务 安排厨师做菜, 顾客的餐桌号与需要的食物
  handleFinishOrder(orderList: Array<Food>) {
    // 时间
    this.timeContinue();
    // 将顾客的点单信息加入到餐厅的队列中
    for (const orderItem of orderList) {
      this.taskQueue.push(orderItem);
    }
    // 通知所有厨师开始做菜
    emitter.emit(EVENT.START_COOKING); // 开始做菜
  }
  // 游戏开始 餐馆开启全局定时器,用于时间相关显示的DOM渲染 及金钱DOM渲染 事件触发
  gameStart() {
    // 开启定时器
    this.restaurantTimer = setInterval(
      this.timeChange(this.restaurantTime, setSecond),
      1000
    );
  }
  // 每周做的事情
  weekEndTodo() {
    // 1、支付工资餐馆总金额发生变化 2、厨师的工作天数初始化
    this.payChiefs(this.chiefs, chiefWeekMoney); // 支付薪水，参考值为140
  }
  // 厨师周工资支出
  payChiefs(chiefs: Array<Chief>, setMoney: number) {
    let payOffAll: number = 0;
    for (const chief of chiefs) {
      let payOff = Math.ceil((chief.workDay / 7) * setMoney);
      payOffAll -= payOff; // 支出
      chief.workDay = 0; // 工资天数初始化
    }
    this.moneyChange(payOffAll);
  }
  // 每日结束做的事情 数据清除
  dayEndDo() {
    for (const chief of this.chiefs) {
      if (chief) {
        chief.workDay += 1;
      }
    }
    for (const seat of this.seats) {
      if (seat) {
        this.moneyChange(seat.consume);
      }
    }
    this.seats.fill(undefined); // 座位区数据清除
    this.customers = []; // 顾客数据清除
    // 等待区与座位区dom清除
    this.waitsDOMReset();
    this.seatsDOMReset();
  }
  // 每日开始所做的事情，更新一天顾客数据
  dayStartDo() {
    console.log("日顾客数据初始化");
    // TODO: function customersCreate
    this.customers = [one, two, three, four, five].sort(
      (a, b) => a.time - b.time
    );
  }
  // 每秒所做的事情
  secondToDO() {
    // 轮询是否需要生成等待位的dom
    let that = this;
    handleNewCustomerComing(); // 处理新客人来店
    function handleNewCustomerComing() {
      if (!that.isWaitEmpty()) {
        return;
      }
      // 获取得到当前时刻前往餐馆的顾客
      let len = that.waits.length;
      const currentTime = that.restaurantTime.second;
      let customers = that.customers.filter((item) => item.time == currentTime);
      // 当前时刻不存在进店顾客 doNothing
      if (!customers.length) return;
      // 2、加入等待位的客人
      let index = 0;
      let customersLen = customers.length;
      // 创建缓存DOM
      const fragment = document.createDocumentFragment();
      while (len < waitLimit && index < customersLen) {
        const customer: Customer = customers[index].Customer;
        fragment.appendChild(customer.createWaitsDOM()); // 顾客DOM
        // 数据更改
        that.waits.push(customer); //
        // 顾客状态切换(内部触发定时器)， 由顾客去更新DOM
        customer.changeState(CustomerState.WAIT_SEAT);
        len++;
        index++;
      }
      // 所有顾客的DOM更新 这里放这里更新 是减少DOM操作
      GLOBAL_DOM.globalWaitsDOM.appendChild(fragment);
      // 有客人来了且有空座位,向外发出消息
      if (new Restaurant().isSeatsEmpty() !== false) {
        emitter.emit(EVENT.CUSTOMER_COME);
      }
    }
  }
  // 将停止等待的顾客数据从等待区删除
  waitsDateChange(index: number) {
    new Restaurant().waits.splice(index, 1);
  }
  // 从餐桌数组中删除数据
  seatsDateChange(index: number) {
    this.seats[index] = undefined;
  }
  // 监听到点击事件触发，有顾客入餐桌, 数据处理
  enterCustomer() {
    let that = this;
    let index = this.isSeatsEmpty() as any;
    if (index === false) {
      return;
    }
    emitter.emit(EVENT.CUSTOMER_SEAT);
    clearInterval(that.restaurantTimer);
    const customer = this.waits.shift(); // 数据处理
    customer.changeState(CustomerState.SIT, index); // 顾客dom渲染
    this.seats[index] = customer;
  }
  // 更新时间变化
  timeChange(time: GlobalTime, setSecond: number) {
    let { week, day, second } = this.restaurantTime;
    return () => {
      //
      this.secondToDO();
      if (second >= 1 && second < setSecond) {
        second++;
      }
      // 新的一天
      if (second === setSecond) {
        second = 1;
        day++;
        this.dayEndDo();
        this.dayStartDo();
      }
      // 新的一周
      if (day > 7) {
        day = 1;
        week++;
        this.weekEndTodo();
      }
      if (day !== time.day) {
        GLOBAL_DOM.globalDayDOM.innerHTML = `D${day}`;
        this.restaurantTime.day = day;
      }
      if (week !== time.week) {
        this.restaurantTime.week = week;
        GLOBAL_DOM.globalWeekDOM.innerHTML = `W${week}`;
      }
      this.restaurantTime.second = second;
    };
  }
  // 更新金钱变化
  moneyChange(value) {
    this.revenue += value;
    GLOBAL_DOM.globalRevenueDOM.innerHTML = format(this.revenue);
  }
  // 等待区的reset
  waitsDOMReset() {
    GLOBAL_DOM.globalWaitsDOM.innerHTML = ""; // 等待区DOM清除
  }
  // 餐桌区DOM的reset
  seatsDOMReset() {
    const seatDOM = GLOBAL_DOM.globalSeatsDOM;
    seatDOM.innerHTML = `<div class="customer-wrapper">
    <div class="customer-img-wrapper">
      <img src="" alt="">
    </div>
  </div>
  <div class="customer-wrapper">
    <div class="customer-img-wrapper">
      <img src="" alt="">
    </div>
  </div>
  <div class="customer-wrapper">
    <div class="customer-img-wrapper">
      <img src="" alt="">
    </div>
  </div>
  <div class="customer-wrapper">
    <div class="customer-img-wrapper">
      <img src="" alt="">
    </div>
  </div>`;
  }
  /* 判断等待区是否有空位 */
  isWaitEmpty(): boolean {
    return this.waits.length < waitLimit ? true : false;
  }
  /* 判断餐厅是否能招厨师 */
  isChiefsEmpty(): number {
    return this.chiefs.findIndex((item) => !item);
  }
  /* 判断是否只有一个厨师 */
  hasOnlyOneChief(chiefs): boolean {
    let count = 0;
    for (const chief of chiefs) {
      if (chief === null) count++;
    }
    // 只有一个初始
    if (count === maxChiefNumber - 1) {
      return true;
    }
    return false;
  }
  /* 判断餐厅的的空位 */
  isSeatsEmpty(): boolean | number {
    const index = this.seats.findIndex((item) => item === undefined);
    if (index > -1) {
      return index;
    }
    return false;
  }
  isShowAddIcon() {
    const addArea = document.getElementById("addChief");
    if (this.isChiefsEmpty() === -1) {
      addArea.style.display = "none";
    } else {
      addArea.style.display = "flex";
    }
  }

  /* 招聘厨师 */
  handleRecruitNewChief() {
    let index = this.isChiefsEmpty();
    if (index === -1) {
      return;
    }
    // 增加dom与数据数组变化
    const chief = new Chief(index);
    this.chiefs[index] = chief;
    const addArea = document.getElementById("addChief");
    const newChiefDOM = chief.createChiefDOM(); //
    GLOBAL_DOM.globalChiefsDOM.insertBefore(newChiefDOM, addArea);
    this.isShowAddIcon();
    let number = 0;
    for (const chief of this.chiefs) {
      if (chief !== null) {
        number++;
      }
    }
    emitter.emit(EVENT.RECRUIT_SUCCESS, number);
  }
  // 解雇厨师
  handleFireAChief(compensation, index, ele) {
    if (this.revenue < compensation) {
      // TODO: 短消息 你的金额已经不足支付违约金
      emitter.emit(EVENT.MONEY_INSUFFICIENT)
    } else {
      console.log(`解雇成功，花费${compensation}元`);
      this.moneyChange(-compensation);
      GLOBAL_DOM.globalChiefsDOM.removeChild(ele);
      this.chiefs[index] = null;
      this.isShowAddIcon();
      emitter.emit(EVENT.FIRE_SUCCESS, compensation)
    }
  }
  // 点击区域处理
  handleChiefAreaControl(e) {
    const target = e.target;
    const area = GLOBAL_DOM.globalChiefsDOM;
    const addArea = area.lastChild;
    // 点击的是招聘新厨师
    if (addArea.contains(target)) {
      emitter.emit(EVENT.RECRUIT_CHIEF);
      return;
    }
    // 点击的是解雇按钮
    const id: string = target.getAttribute("id");
    if (!id) return;
    const ele = document.getElementById(id);
    let index = "";
    for (let i = id.length - 1; i >= 0; i--) {
      if (id[i] === "-") {
        break;
      }
      index = id[i] + index;
    }
    const chief = this.chiefs[index];
    const payOff =
      chiefWeekMoney + Math.ceil((chief.workDay / 7) * chiefWeekMoney);
    emitter.emit(EVENT.FIRE_CHIEF, payOff, index, ele);
  }
}
export { Restaurant };
