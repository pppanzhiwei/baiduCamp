
class Food {
  public name:string
  public cost: number
  public price: number
  public waitTime: number
  public eatTime: number
  public cookTime: number
  public type: string // 类型 
  public finished: boolean // 是否做完
  public belongTo: number // 对应桌子
  public dom: HTMLElement // 对应渲染的dom
  public listener:Array<any>
  public timer
  constructor({
    name,
    cost,
    price,
    cookTime,
    eatTime,
    waitTime,
  }) {
    this.name = name
    this.price = price
    this.cost = cost
    this.cookTime = cookTime
    this.eatTime = eatTime
    this.waitTime = waitTime
    this.finished = false
    this.belongTo = -1
    this.dom = null
    this.listener = []
    this.timer = null
  }
  serveFinish() {
    if(this.listener.length === 0) return
    for(const item of this.listener) {
      item()
    }
  }
} 



export {Food}



