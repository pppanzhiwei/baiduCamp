import { Food } from "./types";
import { GLOBAL_EVENT, waitLimit } from "./const_help";
import { isWaitEmpty, isChiefsEmpty, isSeatsEmpty } from "./utils";

import { createMachine, interpret } from "xstate";
/* 顾客的状态定义 */
enum customerState {
  INIT = "init",
  WAIT_SEAT = "wait_seat",
  SIT = "sit",
  WAIT_DISH = "wait_dish",
  EATING = "eating",
  WAIT_PAY = "wait_pay",
  ANGRY = "angry",
  LEAVE = "leave",
}
const EventMap = {
  INIT: {
    on: {
      // 事件
      startWait: customerState.WAIT_SEAT,
      out: customerState.LEAVE,
    },
  },
  WAIT_SEAT: {
    on: {
      // 事件
      click: customerState.SIT,
      BREAK: "broken",
    },
  },
};
// state + event
/* 顾客类 每一个顾客实例其进店的行为是一个状态机*/
class Customer {
  public name: string; // 姓名
  public icon: string; // 头像
  public timer: NodeJS.Timeout | null; // 等位 进餐定时器
  public orderList: Array<Food>; // 菜单
  public waitPatient: number; // 等位耐心度
  public chance: boolean; // 今日进店机会
  public waitDishTimer: Array<NodeJS.Timeout>; // 等餐定时器数组
  public eatList: Array<Food>; // 实际进餐队列
  public consume: number; // 总花费
  public orderNumber: number // 餐桌号码
  public state: customerState; // 状态
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
    this.orderNumber = -1 // 餐桌序号
    // 初始化状态
    this.state = customerState.INIT;
  }
  changeState(state: customerState) {
    this.state = state;
    switch (state) {
      case customerState.WAIT_SEAT: {
        this.wait(this.waitPatient);
        break;
      }
      case customerState.LEAVE: {
        console.log("离开");
        this.leave();
        break;
      }
      case customerState.SIT: {
        this.goToSeat()
        break;
      }
    }
  }
  // 等待状态
  wait(n: number) {
    // 触发定时器
    this.timer = setTimeout(
      this.giveUpWait.bind(this),
      this.waitPatient * 1000
    );
  }
  // 放弃等位需要进行的操作
  giveUpWait() {
    if (this.timer) clearTimeout(this.timer as NodeJS.Timeout);
    console.log("等位时间到, 离开餐馆");
    console.log(this);
    // 状态切换为离开状态
    this.changeState(customerState.LEAVE);
  }
  // 顾客入座
  goToSeat() {
    // 触发SEATS_IN事件
    if (this.timer) clearTimeout(this.timer as NodeJS.Timeout);
    window.$EventEmit.emit(GLOBAL_EVENT.SEATS_IN, this);
  }
  // 点餐, 输入为菜单
  startOrder(menu: Array<Food>) {
    // 暂停计时器
    // TODO: 点击按钮后进行提交菜单
    clearInterval(window.$restaurantTimer);
    // TODO: 自动弹起点餐界面
    // TODO: 点餐
  }
  // 放弃点餐
  giveUpOrder() {
    window.$seats.pop();
    this.chance = false;
    // TODO:点餐界面消失, 该人消失
    // TODO:时间继续走动
  }
  // 等待上菜
  successOrder(orderList: Array<Food>) {
    this.orderList = [...orderList];
    // 定时器开始
  }
  // 用餐
  // 生气
  // 客人离开伴随操作
  leave() {
    //
    window.$EventEmit.emit(GLOBAL_EVENT.SEATS_OUT, this);
    window.$EventEmit.emit(GLOBAL_EVENT.REVENUE_CHANGE, this.consume);
    // 状态初始化
    this.chance = false;
    this.eatList = [];
    this.orderList = [];
    this.state = customerState.INIT
    this.orderNumber = -1
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

class Chief {
  static empty = "empty";
  static cooking = "cooking";
  static cooked = "cooked";
  public status: string;
  public task: Array<Customer>;
  public workDay: number;
  constructor() {
    this.status = Chief.empty; // 厨师状态
    this.task = []; // 厨师的菜单队列
    this.workDay = 0;
  }
  startCook() {}
  finishCooked() {}
}

function createWaitCustomerDOM(name: string, pic: string) {
  const div = document.createElement("div");
  const innerHTML = `<div class="customer-img-wrapper">
  <img src=${pic} class="customer-img" alt="">
  </div>
  <div class="progress">等位中</div>`;
  div.setAttribute("id", `wait-${name}`);
  div.setAttribute("class", "customer");
  div.innerHTML = innerHTML;
  return div;
}

function createSeatCustomerDOM(
  name: string | undefined,
  pic: string | undefined
) {
  const div = document.createElement("div");
  div.setAttribute("class", "customer-wrapper");
  let innerHTML;
  if (pic) {
    innerHTML = `<div class="customer-img-wrapper">
      <img class="customer-img" src=${pic} alt="">
  </div>`;
  } else {
    innerHTML = `<div class="customer-img-wrapper">
      <img class="customer-img" src="" alt="">
  </div>`;
  }
  if (name) {
    div.setAttribute("id", `seat-${name}`);
  }
  div.innerHTML = innerHTML;
  return div;
}
console.log(createSeatCustomerDOM(undefined, undefined));

export {
  Customer,
  customerState,
  Chief,
  createWaitCustomerDOM,
  createSeatCustomerDOM,
};
