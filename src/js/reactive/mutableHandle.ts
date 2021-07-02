import { isObject, hasOwnProperty, isEqual } from "../utils";
import { useReactive } from "./index";
const get = createGetter();
const set = createSetter();
const mutableHandler = { get, set };

function createGetter() {
  return function (target, key, receiver) {
    const res = Reflect.get(target, key, receiver);
    /* 获取数据时要做的事情*/
    // todo
    console.log("获取了", target[key]);
    // 如果res是一个对象 则将其变为响应式
    if (isObject(res)) {
      return useReactive(res);
    }
    return res;
  };
}
function createSetter() {
  return function (target, key, value, receiver) {
    const isKeyExist = hasOwnProperty(target, key);
    const oldValue = target[key];
    const res = Reflect.set(target, key, value, receiver);
    // todo
    if (!isKeyExist) {
      // 响应式新增
      console.log("响应式新增", key, value);
    } else if (!isEqual(oldValue, value)) {
      console.log("响应式修改", key, value);
    }
    return res;
  };
}

export { mutableHandler };
