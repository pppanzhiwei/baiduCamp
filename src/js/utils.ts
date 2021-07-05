import { waitLimit, chiefsLimit, seatsLimit } from "./const_help";

/* 关闭 开启 遮罩层函数 */
function showElement(ele: HTMLElement) {
  ele.style.display = "block";
}
function disappearElement(ele: HTMLElement) {
  ele.style.display = "none";
}

/* 判断等待区是否有空位 */
function isWaitEmpty(): boolean {
  return window.$waits.length < waitLimit ? true : false;
}
/* 判断是否能招厨师 */
function isChiefsEmpty(): boolean {
  return window.$chiefs.length < chiefsLimit ? true : false;
}
/* 判断第一个餐位 */
function isSeatsEmpty(): boolean | number {
  const index = window.$seats.findIndex((item) => item === undefined);
  if (index > -1) {
    return index;
  }
  return false;
}

// 千分位划分
function format(num: number | string) {
  num = num + "";
  var reg = /[1-9]\d{0,2}(?=(\d{3})+$)/g;
  return num.replace(reg, "$&,");
}

// 防抖
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
// 节流
function throttle(fun, delay) {
  let timer = null;
  let previous = 0;
  return function (args) {
    let now = Date.now();
    let remaining = delay - (now - previous); //距离规定时间,还剩多少时间
    let that = this;
    let _args = args;
    clearTimeout(timer); //清除之前设置的定时器
    if (remaining <= 0) {
      fun.apply(that, _args);
      previous = Date.now();
    } else {
      timer = setTimeout(function () {
        fun.apply(that, _args);
      }, remaining); //因为上面添加的clearTimeout.实际这个定时器只有最后一次才会执行
    }
  };
}

export {
  debounce,
  throttle,
  showElement,
  disappearElement,
  isWaitEmpty,
  isChiefsEmpty,
  isSeatsEmpty,
  format,
};
