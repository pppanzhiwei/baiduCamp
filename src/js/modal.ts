import {Modal, Button} from './types'


// 生成modal模块， 需要参数 1、标题 2、正文内容 3、buttons 包含有button中的内容
function createModal({ title, content, buttons }: Modal) {
  const modal= document.createElement("div");
  modal.className = "modal";
  /* header */
  const header = document.createElement("div");
  header.className = "modal-title";
  header.innerHTML = title;
  /* 内容 */
  const contentArea = document.createElement("div");
  contentArea.innerHTML = content;
  contentArea.className = "modal-content";
  /* button */
  const buttonArea = document.createElement("div");
  buttonArea.className = "modal-button-area";
  const len = buttons.length;
  for (let i = 0; i < len; i++) {
    buttonArea.appendChild(
      createButton(
        {
          title: buttons[i].title,
          click: buttons[i].click,
          className:
            len === 2 && i === 0
              ? "button-left"
              : len === 2 && i === 1
              ? "button-right"
              : "button-middle",
        },
        modal
      )
    );
  }
  modal.appendChild(header);
  modal.appendChild(contentArea);
  modal.appendChild(buttonArea);
  modal.style.display = "block";
  return modal;
}
// modal中的button生成
function createButton({ title, click, className }: Button, modal: HTMLElement) {
  const button = document.createElement("button");
  const text = document.createTextNode(title);
  button.className = `modal-button ${className}`;
  button.onclick = function () {
    // 内部触发回调
    click.bind(this)();
  };
  button.appendChild(text);
  modal.style.display = "none";
  return button;
}


/* modal模块 开启与关闭 */
function closeModal(modal: HTMLElement) {
  modal.style.display = "none";
}
function openModal(modal: HTMLElement) {
  modal.style.display = "block";
}


/* 用于定义modal中的标题、内容 */

const startModal = {
  title: "WebMOOC餐厅开业啦",
  content: `<div>WebMOOC餐厅即将开业，请认真经营你的餐厅吧</div>
  <div>经营餐厅需要做好下面几件事情！加油！</div>
  <div>&nbsp</div>
  <div class="task">招聘厨师&nbsp&nbsp&nbsp&nbsp&nbsp迎接客人&nbsp&nbsp&nbsp&nbsp&nbsp烹饪美食</div>
  `,
};

const bgColorType = {
  green: 'rgb(217, 230, 125)',
  red: 'rgb(255, 179, 153)'
}

const allInfo = {
  hasSeats: {
    color: bgColorType.red,
    content: '餐厅目前有空位，赶紧点击等位客人头像，让客人入座点餐吧'
  },
  finishOrder: {
    color: bgColorType.green,
    content: `<div>完成点餐，等候用餐</div>
    <div>疯狂点击厨师头像可以加速做菜</div>`
  },
  pay: {
    color: bgColorType.green,
    content: `<div>完成用餐，收获$</div>
    `
  },
  angry: {
    color: bgColorType.red,
    content: `失望而归，别再让客人挨饿了`
  },
  offer: {
    color: bgColorType.green,
    content: `招聘厨师成功！您已经有5名厨师了`
  },
  fireFailure: {
    color: bgColorType.red,
    content: `你的金额已经不足支付解约金了`
  },
  fireSuccess: {
    color: bgColorType.green,
    content: `解约厨师成功，解约支出`
  }
  
}

const createInfoComponent = (bgColor:string, content:string) => {
  const info = document.createElement('div')
  info.className = 'info'
  info.innerHTML = `<div class="info-content">${content}</div>`
  info.style.backgroundColor = bgColor
  document.body.append(info)
  info.style.display = 'none'
  return info
}

/* modal模块 开启与关闭 */
function closeInfo(info: HTMLElement) {
  info.style.display = "none";
}
function openInfo(info: HTMLElement) {
  info.style.display = "block";
}

export { createModal, createButton, closeModal, openModal, startModal, createInfoComponent, allInfo, closeInfo, openInfo };



