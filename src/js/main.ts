import "./reset.ts";
import "../style/reset.css";
import "../style/border.css";
import "../style/index.css";
import { EVENT, GLOBAL_DOM} from "./const_help";
import {
  createModal,
  createButton,
  createInfoComponent,
  allInfo,
} from "./modal";
import { modalType } from "./modal";
import { disappearElement, showElement, format, debounce } from "./utils";
import { emitter} from "./eventEmit";
import { Restaurant } from "./restaurant";

let gameModal: HTMLDivElement;
let gameInfo: HTMLDivElement;
let restaurant: Restaurant;
// 游戏初始化页面渲染
window.onload = () => {
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
  document.body.removeChild(gameModal);
  // 关闭遮罩层
  disappearElement(GLOBAL_DOM.globalWrapperDOM as HTMLElement);
  // 系统开始计时
  restaurant = new Restaurant();
  restaurant.dayStartDo(); // 开启新的一天
  restaurant.handleRecruitNewChief();
  restaurant.gameStart(); // 开启监听器
  GLOBAL_DOM.globalWaitsDOM.addEventListener("click", () => {
    restaurant.enterCustomer();
  });
  GLOBAL_DOM.globalChiefsDOM.addEventListener("click", (e) => {
    restaurant.handleChiefAreaControl(e);
  });
  emitter.on(EVENT.RECRUIT_CHIEF, handleRecruitChief);
  emitter.on(EVENT.CUSTOMER_SEAT, handleCustomerSeat);
  emitter.on(EVENT.FINISH_ORDER, handleFinishOrder);
  emitter.on(EVENT.RECRUIT_SUCCESS, handleRecruitSuccess);
  emitter.on(EVENT.FIRE_CHIEF, handleFireChief)
}
// 解雇点击处理
function handleFireChief(compensation, index, ele) {
  showElement(GLOBAL_DOM.globalWrapperDOM as HTMLElement);
  modalType.fireModal.content = `<div>解雇当前闲置的厨师可以帮你节省成本。</div>
  <div>解雇时会按厨师本周已经工作的日子结算工资，并会赔偿一周工资作为解约金</div>
  <div>解雇当前厨师结算工资及解约金需要付出￥${compensation}</div>`
  gameModal = createModal({
    ...modalType.fireModal,
    buttons: [
      {
        title: "是的，确认解雇",
        click: ()=>{
          new Restaurant().handleFireAChief.bind(new Restaurant(), compensation, index, ele)()
          handleDoNothing()
        }
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
  showElement(GLOBAL_DOM.globalWrapperDOM as HTMLElement);
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
  document.body.removeChild(gameModal);
  // 取消遮罩
  disappearWrapper();
}
function handleRecruitSuccess() {
  document.body.removeChild(gameModal);
  // 取消遮罩
  disappearWrapper();
}
function handleCustomerSeat() {
  showWrapper();
}
function handleFinishOrder() {
  disappearWrapper();
}

function showWrapper() {
  showElement(GLOBAL_DOM.globalWrapperDOM as HTMLElement);
}
function disappearWrapper() {
  disappearElement(GLOBAL_DOM.globalWrapperDOM as HTMLElement);
}
