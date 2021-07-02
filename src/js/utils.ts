import { waitLimit, chiefsLimit, seatsLimit } from "./const_help";

/* 关闭 开启 遮罩层函数 */
function closeWrapper(wrapper: HTMLElement) {
  wrapper.style.display = "none";
}
function openWrapper(wrapper: HTMLElement) {
  wrapper.style.display = "block";
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
function isSeatsEmpty(): boolean|number {
  const index = window.$seats.findIndex((item)=>item === undefined)
  if(index > -1){
    return index
  }
  return false
}

function isObject(value) {
  return typeof value === "object" && value !== null;
}

function hasOwnProperty(obj, key) {
  return Object.prototype.hasOwnProperty.call(obj, key);
}

function isEqual(oldValue, newValue) {
  return oldValue === newValue;
}

// 千分位划分
function format(num: number | string) {
    num = num + ''
    var reg = /[1-9]\d{0,2}(?=(\d{3})+$)/g
    return num.replace(reg, '$&,')
}

// 

export { closeWrapper, openWrapper, isWaitEmpty, isChiefsEmpty, isSeatsEmpty, isObject, hasOwnProperty, isEqual,format };
