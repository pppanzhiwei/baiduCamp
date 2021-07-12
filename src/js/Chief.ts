import { GLOBAL_DOM, EVENT } from "./const_help";
import {
  changeBgColor,
  changeProgressStyle,
  createDOM,
  createProgress,
  removeDOM,
} from "./utils";
import { emitter } from "./eventEmit";
import { Food } from "./food";
import { Restaurant } from "./restaurant";

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
const ChiefStateProgressColor = {
  cooking: ["#FF9122", "#D96D00"],
  cooked: ["#AC91FF", "#AC91FF"],
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
  handleIdle() {
    this.showFireIcon();
    this.hideServingIcon();
    this.changeChiefBgColor();
  }
  // 处理开始工作逻辑
  handleStartWork() {
    // 厨师当前处于空闲状态且任务队列不为空
    if (this.state === ChiefState.IDLE) {
      if (new Restaurant().taskQueue.length > 0) {
        this.changeState(ChiefState.COOKING);
      }
    }
  }
  // 处理开始烹饪逻辑
  handleStartCooking() {
    const food =  new Restaurant().taskQueue.shift(); // 从任务队列中取出第一个菜开始制作
    const progress = createProgress(
      food.name,
      this.bgColorLeft,
      this.bgColorRight,
      food.cookTime
    ); // 生成进度条
    this.dom.appendChild(progress);
    this.hideFireIcon(); // 隐藏解雇标志
    this.changeChiefBgColor(); // 改变厨师的颜色样式
    this.changeChiefProgressStyle(); // 改变样式
    // 开启做菜定时器
    new Promise((resolve, reject) => {
      emitter.emit(EVENT.REVENUE_CHANGE, -food.cost); // 扣除做菜的成本
      // 开启定时器开始做菜
      setTimeout(() => {
        resolve(food); // 做菜结束后 状态发生改变
      }, food.cookTime * 1000);
    }).then((food: Food) => {
      const handleServeFinish = () => {
        clearTimeout(timeout);
        this.hideServingIcon()
        this.dom.removeChild(progress);
        if (new Restaurant().taskQueue.length > 0) {
          this.changeState(ChiefState.COOKING);
        } else {
          this.changeState(ChiefState.IDLE);
        }
      };
      // 结束上菜任务
      var timeout = setTimeout(() => {
        handleServeFinish();
      }, 5 * 1000);
      this.changeState(ChiefState.COOKED);
      food.listener.push(handleServeFinish.bind(this));
      emitter.emit(EVENT.FINISH_COOK, food); // 通知上菜
    });
  }
  // 菜品制作完成逻辑处理
  handleFinishCook() {
    // 1、改变颜色
    this.changeChiefBgColor();
    // 2、出现上菜的小图标
    this.showServingIcon();
    // 3、改变进度条的颜色
    this.changeChiefProgressStyle();
  }
  // 改变背景颜色，表征状态改变
  changeChiefBgColor() {
    changeBgColor(this);
  }
  // 改变进度条的颜色样式， 表征状态变化
  changeChiefProgressStyle() {
    changeProgressStyle(this);
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

export { ChiefStateBgColor, ChiefStateProgressColor, Chief, ChiefState };
