import { ChiefStateProgressColor, EVENT } from "./const_help";
import { changeBgColor, changeProgressStyle } from "./utils";
import { emitter } from "./eventEmit";
import { Food } from "./food";
import { Restaurant } from "./restaurant";

/* 厨师的状态定义 */
enum ChiefState {
  IDLE = "idle",
  COOKING = "cooking",
  COOKED = "cooked",
}
class Chief {
  public state: ChiefState;
  public task: Array<Food>;
  public workDay: number;

  public id: number;
  constructor(id: number) {
    this.state = ChiefState.IDLE; // 厨师的状态
    this.id = id; // 厨师的索引
    this.task = []; // 厨师的做菜队列
    this.workDay = 0;
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
    document
      .getElementById(`chief-${this.id}`)
      .classList.remove("chief-wrapper-cooking");
  }
  // 隐藏解雇标志
  hideFireIcon() {
    document
      .getElementById(`chief-${this.id}`)
      .classList.add("chief-wrapper-cooking");
  }
  // 显示上菜小图标
  showServingIcon() {
    document
      .getElementById(`chief-${this.id}`)
      .classList.add("chief-wrapper-cooked");
  }
  // 隐藏上菜小图标
  hideServingIcon() {
    document
      .getElementById(`chief-${this.id}`)
      .classList.remove("chief-wrapper-cooked");
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
    const food = new Restaurant().taskQueue.shift(); // 从任务队列中取出第一个菜开始制作
    const chiefDOM = document.getElementById(`chief-${this.id}`);
    const progressContainer: HTMLElement =
      chiefDOM.querySelector(".progress-wrapper");
    progressContainer.style.backgroundColor =
      ChiefStateProgressColor.cooking[0];
    progressContainer.innerHTML = `
    <div class="text">${food.name}</div>
    <div class="progress" style="background-color:${ChiefStateProgressColor.cooking[1]}; animation-duration:${food.cookTime}s"></div>
    `;
    progressContainer.style.display = "block";
    this.hideFireIcon(); // 隐藏解雇标志
    this.changeChiefBgColor(); // 改变厨师的颜色样式
    // 开启做菜定时器
    new Promise((resolve, reject) => {
      emitter.emit(EVENT.REVENUE_CHANGE, -food.cost); // 扣除做菜的成本
      // 开启定时器开始做菜
      const timer = setTimeout(() => {
        resolve(food); // 做菜结束后 状态发生改变
      }, food.cookTime * 1000);
    }).then((food: Food) => {
      var timeout = setTimeout(() => {
        handleServeFinish();
      }, 5 * 1000);
      const handleServeFinish = () => {
        clearTimeout(timeout);
        this.hideServingIcon();
        progressContainer.style.display = "none";
        if (new Restaurant().taskQueue.length > 0) {
          this.changeState(ChiefState.COOKING);
        } else {
          this.changeState(ChiefState.IDLE);
        }
      };
      emitter.emit(EVENT.FINISH_COOK, food); // 通知上菜
      this.changeState(ChiefState.COOKED);
      food.listener.push(handleServeFinish.bind(this));
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
}

export { Chief, ChiefState };
