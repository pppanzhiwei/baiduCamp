import { Customer, CustomerStateBgColor, CustomerStateProgressColor } from "./Customer";
import { Chief, ChiefStateBgColor, ChiefStateProgressColor } from "./Chief";

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
  animationTime: number,
  animationState?: string
) {
  const progressContainer = document.createElement("div");
  progressContainer.style.backgroundColor = wrapperBg;
  progressContainer.className = "progress-wrapper";
  progressContainer.innerHTML = `<div class="text">${context}</div>
  <div class="progress" style="background-color:${innerBg}"></div>
  `;
  const progress: HTMLElement = progressContainer.querySelector(".progress");
  progress.style.animationDuration = animationTime + "s";
  if(animationState) {
    progress.style.animationPlayState = animationState
  }
  return progressContainer;
}

// 更改背景颜色的通用函数
function changeBgColor(character: Customer | Chief) {
  const wrapper = character.dom.firstChild as HTMLElement;
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
    const progress: HTMLElement =
      character.dom.querySelector(".progress-wrapper");
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
    progress.style.backgroundColor = color;
  }
}
// 更改进度条


export { debounce, showElement, disappearElement, format,changeProgressStyle,changeBgColor,createProgress,removeDOM,createDOM};
