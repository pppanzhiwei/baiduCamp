/* 定义各种接口类型 */
import { Customer } from "./gameCharacter";
// modal
interface Modal {
  title: string;
  content: string;
  buttons: Array<{
    title: string;
    click: Function;
  }>;
}
interface createCustomer {
  Customer: Customer;
  time: number;
}
// 按钮
interface Button {
  title: string;
  click: Function;
  className: string;
}

// 全局时间接口
interface GlobalTime {
  week: number;
  day: number;
  second: number;
}
enum foodType {
  cold = "cold",
  main = "main",
  drink = "drink",
}
// 单个菜品
interface Food {
  name: string;
  price: number; // 价格
  type?: string; // 菜的类型
  eatTime: number; // 用餐时间
  cookTime: number; // 制作时间
}

export { Modal, Button, GlobalTime, Food, createCustomer };
