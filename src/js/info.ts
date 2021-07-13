const Info = (function () {
  let info = null;
  return function () {
    if (!info) {
      info = document.createElement("div");
      info.className = "info";
      info.style.display = "none";
      document.body.appendChild(info);
    }
    return info;
  };
})();
const bgColorType = {
  green: "rgb(217, 230, 125)",
  red: "rgb(255, 179, 153)",
};

const InfoType = {
  hasSeats: {
    color: bgColorType.red,
    content: "餐厅目前有空位，赶紧点击等位客人头像，让客人入座点餐吧",
  },
  finishOrder: (name) => {
    return {
      color: bgColorType.green,
      content: `<div>${name}完成点餐，等候用餐</div>
    <div>疯狂点击厨师头像可以加速做菜</div>`,
    };
  },
  pay: (name, money) => {
    return {
      color: bgColorType.green,
      content: `<div class="info-content">${name}完成用餐，收获$${money}</div>`,
    };
  },
  angry: (name) => {
    return {
      color: bgColorType.red,
      content: `<div class="info-content">${name}失望而归，别再让客人挨饿了</div>`,
    };
  },
  finishRecruit: (number) => {
    return {
      color: bgColorType.green,
      content: `<div class="info-content">招聘厨师成功！您已经有${number}名厨师了</div>`,
    };
  },
  fireFailure: {
    color: bgColorType.red,
    content: `<div class="info-content">你的金额已经不足支付解约金了</div>`,
  },
  fireSuccess: (money) => {
    return {
      color: bgColorType.green,
      content: `<div class="info-content">解约厨师成功，解约支出 ￥${money}`,
    };
  },
};

export { Info, bgColorType, InfoType };
