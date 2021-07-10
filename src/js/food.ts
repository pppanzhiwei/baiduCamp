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
    this.listener = []
    this.dom = null
  }
  // 监听食物的完成
  watch(callback) {
    this.listener.push(callback) // 调用该函数更新界面显示
  }
  finish() {
    this.finished = true
    setTimeout(()=>{
      this.listener.forEach((item)=>{
        item()
      })
    })
  }
} 



export {Food}



