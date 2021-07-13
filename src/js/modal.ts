import { Modal, Button } from "./types";

// 生成modal模块， 需要参数 1、标题 2、正文内容 3、buttons 包含有button中的内容
function createModal({ title, content, buttons }: Modal) {
  const modal = document.createElement("div");
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
  document.body.appendChild(modal);
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
  <div class="task"><span>招聘厨师</span><span>迎接客人</span><span>烹饪美食</span></div>
  `,
};
// 招聘
const wantedModal = {
  title: "招聘新厨师",
  content: `<div>招聘一名新厨师可以帮你更快地为顾客烹饪菜肴，增加餐厅收入。你最多可以拥有六名厨师。</div>
  <div>但每个厨师每周需要你支付工资￥100元</div>
  <div>请问你确认招聘一名厨师吗？</div>
  `,
};

const fireModal = {
  title: "解雇厨师",
  content: "",
};

const modalType = {
  startModal: startModal,
  wantedModal: wantedModal,
  fireModal: fireModal,
};

export { createModal, createButton, closeModal, openModal, modalType };
