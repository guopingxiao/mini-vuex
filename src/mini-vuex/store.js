import applyMixin from './mixin'
import { forEachObj } from './util'
import ModuleCollection  from './module/ModuleCollection'

let Vue

/**
 * 这里要对当前模块进行操作，遍历当前模块上的actions mutations, getters, 都把它定义在store上
 * @param {*} store 根模块
 * @param {*} state 根状态
 * @param {*} path 所有路径
 * @param {*} module 格式化后的树结构
 */
const installModule = (store, rootState, path, module) => { 
  const { state } = module

  // state
  // 1.将所有的子模块的状态安装到父模块的状态上, 将state处理成一层一层的模式 [a]  [b]   -----》 state
  if (path.length > 0) { 
    let parent = path.slice(0, -1).reduce((state, current) => { 
      return state[current]
    }, rootState)

    const lastModuleIndex = path[path.length -1]
    // parent[lastModuleIndex] = module.state
    // 如果这个对象 本身不是响应式的 那么 Vue.set 就相当于 
    Vue.set(parent, lastModuleIndex, state)
  }

  // 2. mutation也处理到一起store._mutations
  module.forEachMutation((key, mutation) => {
    store._mutations[key] = (store._mutations[key] || []);
    store._mutations[key].push((payload) => {
        mutation.call(store, state, payload);
    });
  });

  // 2. action也处理到一起store._actions
  module.forEachAction((key, action) => {
    store._actions[key] = (store._actions[key] || []);
    store._actions[key].push((payload) => {
        action.call(store, store, payload);
    });
  });

  // 3. getter
  module.forEachGetter((key, getter) => {
    // 模块中 getter的名字重复了 会覆盖
    store._wrappedGetters[key] = function() {
      return getter(state)
    }
  })

  // 4. 递归child
  module.forEachChild((key, child) => {
    installModule(store, rootState, path.concat(key), child)
  })

}

class Store { 
  constructor(options) { // new Store({state, getter, mutations, actions}) optins选项传递进来；
    const { state } = options

    this._wrapGetters = {}
    this._mutations = {}
    this._actions = {}

    // 1. 数据可视化，将modules的组合格式化为一个数结构
    this._modules = new ModuleCollection(options)

    // 2. 根模块的状态中，要将子模块通过模块名，全部 定义在根模块上, 和第一步的动作刚好相反；
    installModule(this, state, [], this._modules.root)
    
  }

  get state() { 
    return this._vm._data.$$state // this.state = this._vm._data.$$state
  }

  commit = (type, payload) => {
    this._mutations[type].forEach(fn => fn.call(this, payload));
  }

  dispatch = (type, payload) => {
    this._actions[type].forEach(fn => fn.call(this, payload));
  }

}








// class Store { 
//   constructor(options) { // new Store({state, getter, mutations, actions}) optins选项传递进来；
//     const { state, getters, mutations, actions } = options
//     const computed = {}
//     this.getters = {}
//     this.mutations = {}
//     this.actions = {}


//     forEachObj(getters, (key, valFn) => {
//       computed[key] = ()=> valFn(this.state) // 将用户定义的getter 定义在vm computed 属性上
//       Object.defineProperty(this.getters, key, {
//         get: () => this._vm[key]            // 取getter时， 执行对应计算属性函数即可；
//       })
//     })
    
//     // ! 1. 处理state逻辑
//     // this._vm = new Vue({ // 响应式数据 通过new Vue({data})里的数据就是响应式的
//     //   data: {  //会将data里的数据进行依赖收集，代理到vm上，$开头的变量不会被代理到实例vm上，不提供给外部访问， 而是挂在内部的_data对象上
//     //     $$state: state 
//     //   },
//     //   computed
//     // })

//     // ! 2.处理getter逻辑，具有缓存，computed属性具有缓存，如果数据不变，不会重新计算；
    
    
//     // Oject.kes(getters).forEach(key => {  // 直接取出对应getters 中key对应的函数，执行掉即可
//     //   Object.defineProperty(this.getters, key, {
//     //     get: () => getters[key](this.state)
//     //   })
//     // })

//     // forEachObj(getters, (key, valFn) => { // 但是这样有个问题，就是每次取getters都会执行一次，比较耗性能，可以放在computed计算属性中去处理
//     //   Object.defineProperty(this.getters, key, { // 通过defineProperty， 定义对应getters key的opions.getters的函数
//     //     get: () => valFn(this.state)
//     //   })
//     // })


//     // ! 3. 处理mutations， 和处理getters是一样的，拿到具体的mutations并执行，但是通过commit函数执行
//     // forEachObj(mutations, (type, valFn) => {
//     //   this.mutations[type] = (payload)=> valFn(this.state, payload) 
//     // })

//     // ! 4. 处理actions， 和上面是一样的，拿到具体的actions，通过{commit}函数执行
//     // forEachObj(actions, (type, valFn) => {
//     //   this.actions[type] = (payload)=> valFn(this, payload) // 从store里结构dispatch
//     // })



//   }

//   get state() { 
//     return this._vm._data.$$state // this.state = this._vm._data.$$state
//   }

//   commit = (type, payload) => {// 箭头函数保证commit的this永远指向Store， $store, 调用commit,就是查找到对应的mutations里的type函数，执行即可 
//     this.mutations[type](payload)
//   }

//   dispatch = (type, payload) => {
//     this.actions[type](payload)
//   }

// }

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