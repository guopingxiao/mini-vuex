import applyMixin from './mixin'
import { forEachObj } from './util'

let Vue
class Store { 
  constructor(options) { // new Store({state, getter, mutations, actions}) optins选项传递进来；
    const { state, getters, mutations, actions } = options
    const computed = {}
    this.getters = {}
    this.mutations = {}
    this.actions = {}


    forEachObj(getters, (key, valFn) => {
      computed[key] = ()=> valFn(this.state) // 将用户定义的getter 定义在vm computed 属性上
      Object.defineProperty(this.getters, key, {
        get: () => this._vm[key]            // 取getter时， 执行对应计算属性函数即可；
      })
    })
    
    // ! 1. 处理state逻辑
    this._vm = new Vue({ // 响应式数据 通过new Vue({data})里的数据就是响应式的
      data: {  //会将data里的数据进行依赖收集，代理到vm上，$开头的变量不会被代理到实例vm上，不提供给外部访问， 而是挂在内部的_data对象上
        $$state: state 
      },
      computed
    })

    // ! 2.处理getter逻辑，具有缓存，computed属性具有缓存，如果数据不变，不会重新计算；
    
    
    // Oject.kes(getters).forEach(key => {  // 直接取出对应getters 中key对应的函数，执行掉即可
    //   Object.defineProperty(this.getters, key, {
    //     get: () => getters[key](this.state)
    //   })
    // })

    // forEachObj(getters, (key, valFn) => { // 但是这样有个问题，就是每次取getters都会执行一次，比较耗性能，可以放在computed计算属性中去处理
    //   Object.defineProperty(this.getters, key, { // 通过defineProperty， 定义对应getters key的opions.getters的函数
    //     get: () => valFn(this.state)
    //   })
    // })


    // ! 3. 处理mutations， 和处理getters是一样的，拿到具体的mutations并执行，但是通过commit函数执行
    forEachObj(mutations, (type, valFn) => {
      this.mutations[type] = (payload)=> valFn(this.state, payload) 
    })

    // ! 4. 处理actions， 和上面是一样的，拿到具体的actions，通过{commit}函数执行
    forEachObj(actions, (type, valFn) => {
      this.actions[type] = (payload)=> valFn(this, payload) // 从store里结构dispatch
    })



  }

  get state() { 
    return this._vm._data.$$state // this.state = this._vm._data.$$state
  }

  commit = (type, payload) => {// 箭头函数保证commit的this永远指向Store， $store, 调用commit,就是查找到对应的mutations里的type函数，执行即可 
    this.mutations[type](payload)
  }

  dispatch = (type, payload) => {
    this.actions[type](payload)
  }

}

/**
 * 插件install方法， Vue.use(plugin)  => plugin.install(this) 传入Vue
 * @param {*} _Vue 
 */
const install = (_Vue) => { 
  // _Vue是Vue的构造函数，在安装插件的时候会将其传入；
  Vue = _Vue
  // 需要将根组件注入的store，依次传递给组件和子组件， Vue.mixin方式实现；
  applyMixin(Vue)
}



export {
  install,
  Store
} 