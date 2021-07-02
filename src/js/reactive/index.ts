import { isObject } from '../utils'
import { mutableHandler } from './mutableHandle'
// reactive接收一个对象
function useReactive(target) {
  // 该函数的作用是返回一个响应式对象
  return createReactiveObject(target, mutableHandler)
}

function createReactiveObject(target, baseHandler) {
  if (!isObject(target)) {
    return target
  }
  // 响应式对象
  const observer = new Proxy(target, baseHandler)
  return observer
}

export { useReactive }