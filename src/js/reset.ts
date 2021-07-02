window.onload = function (): void {
  /*720代表设计师给的设计稿的宽度，你的设计稿是多少，就写多少;100代表换算比例，这里写100是
    为了以后好算,比如，你测量的一个宽度是100px,就可以写为1rem,以及1px=0.01rem等等*/
  getRem();
};
window.onresize = function (): void {
  getRem();
};
function getRem(): void {
  document.documentElement.style.fontSize =
    document.documentElement.offsetWidth / 20 + "px";
}
