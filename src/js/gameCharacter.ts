import { Food } from "./types";
import { GLOBAL_EVENT, menuMap, waitLimit } from "./const_help";
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
  public orderNumber: number; // 餐桌号码
  public state: customerState; // 状态
  public bgColorLeft: string;
  public bgColorRight;
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
    this.orderNumber = -1; // 餐桌序号
    this.bgColorLeft = bgColorLeft;
    this.bgColorRight = bgColorRight;
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
      // 入座状态，伴随的事情
      case customerState.SIT: {
        this.goToSeat();
        break;
      }
      case customerState.WAIT_DISH: {

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
    //
    console.log("等位时间到, 离开餐馆");
    // 状态切换为离开状态
    window.$EventEmit.emit(GLOBAL_EVENT.WAITS_OUT, this);
    this.reset();
  }
  // 顾客入座
  goToSeat() {
    // 关闭等待定时器
    if (this.timer) clearTimeout(this.timer as NodeJS.Timeout);
    /* window.$EventEmit.emit(GLOBAL_EVENT.SEATS_IN, this); */
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
    // seatout
    window.$EventEmit.emit(GLOBAL_EVENT.SEATS_OUT, this);
    window.$EventEmit.emit(GLOBAL_EVENT.REVENUE_CHANGE, this.consume);
    this.reset();
  }
  reset() {
    // 状态初始化
    this.chance = false;
    this.eatList = [];
    this.orderList = [];
    this.state = customerState.INIT;
    this.orderNumber = -1;
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

function createWaitCustomerDOM(
  name: string,
  pic: string,
  bgColorLeft: string,
  beColorRight: string
) {
  const div = document.createElement("div");
  const innerHTML = `<div class="customer-img-wrapper" style="background:linear-gradient(to right, ${bgColorLeft} 0%, ${bgColorLeft} 50%, ${beColorRight} 51%, ${beColorRight} 100%)">
  <img src=${pic} class="customer-img" alt="">
  </div>
  <div class="progress-wrapper">
  <div class="text">等待中</div>
    <div class="progress"></div>
  </div>`; // 进度条
  div.setAttribute("id", `wait-${name}`);
  div.setAttribute("class", "customer");
  div.innerHTML = innerHTML;
  return div;
}
// 创建坐着的顾客dom
function createSeatCustomerDOM(
  name: string | undefined,
  pic: string | undefined,
  bgColorLeft: string,
  beColorRight: string
) {
  const div = document.createElement("div");
  div.setAttribute("class", "customer-wrapper");
  let innerHTML;
  if (pic) {
    // progress-area 进度条
    innerHTML = `
    <div class="progress-container">
    </div>
    <div class="customer-img-wrapper" style="background:linear-gradient(to right, ${bgColorLeft} 0%, ${bgColorLeft} 50%, ${beColorRight} 51%, ${beColorRight} 100%)">
      <img class="customer-img" src=${pic} alt="">
  </div>`;
  } else {
    innerHTML = `<div class="customer-img-wrapper">
      <img  src="" alt="">
  </div>`;
  }
  /*   if (name) {
    div.setAttribute("id", `seat-${name}`);
  } */
  div.innerHTML = innerHTML;
  return div;
}

function createChiefDOM(bgColorLeft: string, beColorRight: string) {
  const div = document.createElement("div");
  div.setAttribute("class", "chief-wrapper");
  let innerHTML = `<div class="chief-img-wrapper" style="background:linear-gradient(to right, ${bgColorLeft} 0%, ${bgColorLeft} 50%, ${beColorRight} 51%, ${beColorRight} 100%)">
      <img class="chief-img" src="/public/assets/厨师.png" alt="">
  </div>`;
  div.innerHTML = innerHTML;
  return div;
}

export {
  Customer,
  customerState,
  Chief,
  createWaitCustomerDOM,
  createSeatCustomerDOM,
  createChiefDOM,
};
