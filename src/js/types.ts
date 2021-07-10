/* 定义各种接口类型 */
import { Customer } from "./gameCharacter";
import { Food} from "./food"
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



// 菜品上的单个菜品
interface MenuFood {
  name: string; // 名称
  cost: number // 成本
  price: number; // 价格
  waitTime: number; // 等餐时间
  eatTime: number; // 用餐时间
  cookTime: number; // 制作时间
}



export { Modal, Button, GlobalTime, MenuFood, createCustomer};
