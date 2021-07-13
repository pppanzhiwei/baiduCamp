import { Customer, CustomerStateBgColor } from "./Customer";
import { Chief } from "./Chief";
import {
  CustomerStateProgressColor,
  ChiefStateBgColor,
  ChiefStateProgressColor,
  customerName,
  customerIcon,
} from "./const_help";

/* 关闭 开启 遮罩层函数 */
function showElement(ele: HTMLElement) {
  ele.style.display = "block";
}
function disappearElement(ele: HTMLElement) {
  ele.style.display = "none";
}

// 千分位划分
function format(num: number | string) {
  num = num + "";
  var reg = /[1-9]\d{0,2}(?=(\d{3})+$)/g;
  return num.replace(reg, "$&,");
}

// 防抖函数
function debounce(callback, delay) {
  let timer = null;
  return function (e) {
    let that = this;
    if (timer) {
      clearTimeout(timer);
    }
    timer = setTimeout(() => {
      callback.call(that, e);
    }, delay);
  };
}

// 用于创建等待区顾客DOM结构的通用函数
function createWaitDOM(
  icon: string,
  colorA: string,
  colorB: string,
  time: number
): string {
  const innerHTML = `
  <div class="wait-wrapper">
    <div class="wait-img-wrapper" style="background:linear-gradient(to right, #2693FF 0%, #2693FF 50%, #006DD9 51%, #006DD9 100%)">
      <img class="wait-img" src=${icon} alt>
    </div>
    <div class="progress-wrapper" style="background-color: ${colorA}">
      <div class="text">等待中</div>
      <div class="progress" style="background-color:${colorB}; animation-duration: ${time}s">
    </div>
  </div>
`;
  return innerHTML;
}
function createSeatDOM(icon: string, colorA: string, colorB: string) {
  const innerHTML = `<div class="customer-img-wrapper" style="background: linear-gradient(to right, ${colorA} 0%, ${colorA} 50%, ${colorB} 51%, ${colorB} 100%)">
  <img class="customer-img" src=${icon} alt>
</div>
<div class="progress-container">
</div>`;
  return innerHTML;
}

// 用于移除角色的DOM结构的通用函数
function removeDOM(parent: Element, ele: HTMLElement) {
  parent.removeChild(ele);
}

// 创建进度条的通用函数
function createProgress(
  context: string,
  animationTime: number,
  className: string,
  animationState?: string
) {
  const progressContainer = document.createElement("div");
  progressContainer.className = `progress-wrapper`;
  progressContainer.classList.add(className);
  progressContainer.innerHTML = `<div class="text">${context}</div>
  <div class="progress" style="animation-duration:${animationTime}s; animation-playState = ${animationState}"></div>
  `;
  return progressContainer;
}

// 更改背景颜色的通用函数
function changeBgColor(character: Customer | Chief) {
  const wrapper: HTMLElement =
    character instanceof Customer
      ? document
          .getElementById(`seat-${character.seatNumber}`)
          .querySelector(".customer-img-wrapper")
      : document
          .getElementById(`chief-${character.id}`)
          .querySelector(".chief-img-wrapper");
  const state = character.state;
  const bgColorLeft =
    character instanceof Customer
      ? CustomerStateBgColor[state][0]
      : ChiefStateBgColor[state][0];
  const bgColorRight =
    character instanceof Customer
      ? CustomerStateBgColor[state][1]
      : ChiefStateBgColor[state][1];
  wrapper.style.background = `linear-gradient(to right, ${bgColorLeft} 0%, ${bgColorLeft} 50%, ${bgColorRight} 51%, ${bgColorRight} 100%)`;
}
// 更改进度条背景颜色的通用函数
function changeProgressStyle(
  character: Chief | Customer | HTMLElement,
  color?: string
) {
  if (character instanceof Chief || character instanceof Customer) {
    const wrapper: HTMLElement =
      character instanceof Customer
        ? document.getElementById(`seat-${character.seatNumber}`)
        : document.getElementById(`chief-${character.id}`);
    const progress: HTMLElement = wrapper.querySelector(".progress-wrapper");
    const inner: HTMLElement = progress.querySelector(".progress");
    const state = character.state;
    progress.style.backgroundColor =
      character instanceof Chief
        ? ChiefStateProgressColor[state][0]
        : CustomerStateProgressColor[state][0];
    inner.style.backgroundColor =
      character instanceof Chief
        ? ChiefStateProgressColor[state][1]
        : CustomerStateProgressColor[state][1];
  } else {
    // 针对单个进度条进行颜色修改
    const progress = character;
    (progress.lastChild as HTMLElement).style.backgroundColor = color;
  }
}
// 生成顾客信息
//
function createCustomerInformation() {
  const nameNumber = customerName.length;
  const iconNumber = customerIcon.length;
  const nameIndex = Math.floor(Math.random() * nameNumber);
  const iconIndex = Math.floor(Math.random() * iconNumber);
  const name = customerName[nameIndex];
  const icon = customerIcon[iconIndex];
  const waitTime = Math.floor(Math.random() * (50 - 30 + 1) + 20);
  const visitTime = Math.floor(Math.random() * (200 - 0 + 1));
  return new Customer(name, icon, waitTime, visitTime)
}

export {
  debounce,
  showElement,
  disappearElement,
  format,
  changeProgressStyle,
  changeBgColor,
  createProgress,
  removeDOM,
  createWaitDOM,
  createSeatDOM,
  createCustomerInformation,
};
