import "./reset.ts";
import "../style/reset.css";
import "../style/border.css";
import "../style/index.css";
import { className, EVENT } from "./const_help";
import { createModal } from "./modal";
import { modalType } from "./modal";
import { disappearElement, showElement, format, debounce } from "./utils";
import { emitter } from "./eventEmit";
import { Restaurant } from "./restaurant";
import { bgColorType, Info, InfoType } from "./info";
import { Customer } from "./Customer";

let gameModal: HTMLDivElement;
const info: HTMLElement = Info();
let restaurant: Restaurant;
// 游戏初始化页面渲染
window.onload = () => {
  restaurant = new Restaurant();
  // 显示modal
  gameModal = createModal({
    ...modalType.startModal,
    buttons: [
      {
        title: "开始经营吧",
        click: gameStart,
      },
    ],
  });
};
/* 由按钮点击后触发，开始游戏函数*/
function gameStart() {
  // 关闭modal
  disappearElement(gameModal);
  document.body.removeChild(gameModal);
  gameModal = null;
  // 关闭遮罩层
  disappearWrapper();
  // 系统开始计时
  restaurant.dayStartDo(); // 开启新的一天
  restaurant.gameStart();
  // 开启监听器
  document.addEventListener("click", (e) => {
    const target = e.target;
    const globalWaitsDOM = document.querySelector(className.waitAreas);
    const globalChiefsDOM = document.querySelector(className.chiefArea);
    if (globalWaitsDOM.contains(target as HTMLElement)) {
      restaurant.enterCustomer();
      return;
    }
    if (globalChiefsDOM.contains(target as HTMLElement)) {
      restaurant.handleChiefAreaControl(e);
      return;
    }
  });
  // 监听主要用于modal 和 info 组件的显示与关闭
  emitter.on(EVENT.RECRUIT_CHIEF, handleRecruitChief); // 招聘厨师事件
  emitter.on(EVENT.CUSTOMER_SEAT, handleCustomerSeat); // 顾客入座事件
  emitter.on(EVENT.FINISH_ORDER, handleFinishOrderInfo); // 结束点单事件
  emitter.on(EVENT.RECRUIT_SUCCESS, handleRecruitSuccess); // 招聘成果事件
  emitter.on(EVENT.FIRE_CHIEF, handleFireChief); // 解雇厨师事件
  emitter.on(EVENT.CUSTOMER_COME, handleCustomerComeInfo); // 顾客进店事件
  emitter.on(EVENT.CUSTOMER_PAY, handleCustomerPayInfo); // 顾客支付事件
  emitter.on(EVENT.CUSTOMER_ANGRY, handleCustomerAngryInfo); // 顾客生气
  emitter.on(EVENT.MONEY_INSUFFICIENT, handleMoneySufficientInfo); // 金额不足，无法解雇
  emitter.on(EVENT.FIRE_SUCCESS, handleFireSuccessInfo);
}
// 解雇点击处理
function handleFireChief(compensation, index, ele) {
  showWrapper();
  modalType.fireModal.content = `<div>解雇当前闲置的厨师可以帮你节省成本。</div>
  <div>解雇时会按厨师本周已经工作的日子结算工资，并会赔偿一周工资作为解约金</div>
  <div>解雇当前厨师结算工资及解约金需要付出￥${compensation}</div>`;
  gameModal = createModal({
    ...modalType.fireModal,
    buttons: [
      {
        title: "是的，确认解雇",
        click: () => {
          new Restaurant().handleFireAChief.bind(
            new Restaurant(),
            compensation,
            index,
            ele
          )();
          handleDoNothing();
        },
      },
      {
        title: "先不了",
        click: handleDoNothing,
      },
    ],
  });
}
// 招聘点击处理
function handleRecruitChief() {
  // 开启遮罩层
  showWrapper();
  gameModal = createModal({
    ...modalType.wantedModal,
    buttons: [
      {
        title: "是的，确认招聘",
        click: new Restaurant().handleRecruitNewChief.bind(new Restaurant()),
      },
      {
        title: "先不了",
        click: handleDoNothing,
      },
    ],
  });
}
function handleDoNothing() {
  disappearElement(gameModal);
  document.body.removeChild(gameModal);
  gameModal = null;
  // 取消遮罩
  disappearWrapper();
}
function handleRecruitSuccess(number) {
  disappearElement(gameModal);
  document.body.removeChild(gameModal);
  gameModal = null;
  disappearWrapper();
  const type = InfoType.finishRecruit(number);
  info.style.backgroundColor = type.color;
  info.innerHTML = type.content;
  info.style.display = "block";
  setTimer(3);
}
function handleCustomerSeat() {
  showWrapper();
}
function handleFinishOrderInfo(customer: Customer) {
  disappearWrapper();
  const type = InfoType.finishOrder(customer.name);
  info.style.backgroundColor = type.color;
  info.innerHTML = type.content;
  info.style.display = "block";
  setTimer(3);
}

function showWrapper() {
  const globalWrapperDOM: HTMLElement = document.querySelector(
    className.bgWrapper
  );
  showElement(globalWrapperDOM);
}
function disappearWrapper() {
  const globalWrapperDOM: HTMLElement = document.querySelector(
    className.bgWrapper
  );
  disappearElement(globalWrapperDOM);
}
function handleMoneySufficientInfo() {
  const type = InfoType.fireFailure;
  info.style.backgroundColor = type.color;
  info.innerHTML = type.content;
  info.style.display = "block";
  setTimer(3);
}
function handleCustomerComeInfo() {
  // 显示短消息
  const type = InfoType.hasSeats;
  info.style.backgroundColor = type.color;
  info.innerHTML = type.content;
  info.style.display = "block";
  setTimer(3);
}

function handleCustomerPayInfo(name, consume) {
  const type = InfoType.pay(name, consume);
  info.style.backgroundColor = type.color;
  info.innerHTML = type.content;
  info.style.display = "block";
  setTimer(3);
}
function handleCustomerAngryInfo(name) {
  const type = InfoType.angry(name);
  info.style.backgroundColor = type.color;
  info.innerHTML = type.content;
  info.style.display = "block";
  setTimer(3);
}

function handleFireSuccessInfo(money) {
  const type = InfoType.fireSuccess(money);
  info.style.backgroundColor = type.color;
  info.innerHTML = type.content;
  info.style.display = "block";
  setTimer(3);
}

let timer = null;
// info的显示时间
function setTimer(delay) {
  if (timer) {
    clearTimeout(timer);
  }
  timer = setTimeout(() => {
    info.style.display = "none";
  }, delay * 1000);
}
document.addEventListener("click", (e) => {
  if (info.contains(e.target as any)) {
    info.style.display = "none";
  }
});
