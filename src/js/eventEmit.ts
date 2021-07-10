class EventEmit {
  public events
  constructor() {
    // 创建一个事件池，用来存储后期用来执行的方法
    this.events = {}
  }
  // 订阅
  on(event: string, callback:Function) {
    let _this = this
    if (!_this.events.hasOwnProperty(event)) {
      _this.events[event] = [callback]
    } else {
      _this.events[event].push(callback)
    }
  }
  // 注册事件的回调函数，该回调函数只执行一次,执行一次后就删除回调
  once(event, callback) {
    function one(){
      //一旦执行one 就触发该回调
      callback.apply(this,arguments)
      this.off(event,one)
    }
    this.on(event,one)
  }
  // 发布
  emit(event, ...args) {
    let _this = this;
    if(!this.events[event]) return
    //事件池中该事件有回调函数，触发回调函数
    if(this.events[event]) {
      // item为每一个函数
      for(let item of this.events[event]) {
        item.apply(_this,args)
      }
    }
  }
  // 删除一个回调函数
  remove(event, callback) {
    if(this.events[event]) {
      this.events[event].filter((item)=>{
        item !== callback
      })
    }
  }
}

const emitter = new EventEmit()

export {EventEmit, emitter}