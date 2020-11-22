import applyMixin from "./mixin"
import { forEachValue } from './util'
import ModuleCollection from "./module/module-collection"

export let Vue

function getState(store, path) {    // 获取最新的状态
  return path.reduce((newState, current) => {
    return newState[current]
  }, store.state)
}

/**
 * 
 * @param {*} store         store 实例
 * @param {*} rootState     根 state
 * @param {*} path          所有路径，即所有嵌套模块 例如 [a, c] [b]
 * @param {*} module        // 我们格式化后的模块结果
 */
const installModule = (store, rootState, path, module) => {
  
  // 这里我要对当前模块进行操作
  // 这里我需要遍历当前模块上的 actions、mutation、getters 都把他定义在

  // 我要给当前订阅的事件 增加一个命名空间   a/change   b/changge   a/c/change    path [a]  [b]   [a, c]  
  let namespace = store._modules.getNamespaced(path)      // 返回前缀即可
 
  // state
  // 将所有的子模块的状态安装到父模块的状态上
  // [a]  [b]          -----》 state
  if(path.length>0) {   // vuex 可以动态的添加模块
    let parent = path.slice(0, -1).reduce((memo, current) => {
      return memo[current]
    }, rootState)
    // 如果这个对象 本身不是响应式的 那么 Vue.set 就相当于 
    Vue.set(parent, path[path.length-1], module.state)
  }

  // mutation
  module.forEachMutation((mutation, key) => {
    store._mutations[namespace+key] = store._mutations[namespace+key] || []
    store._mutations[namespace+key].push((payload) => {
      mutation.call(store, getState(store, path), payload)
      store._subscribes.forEach(fn => {
        fn(mutation, store.state)
      })
    })
  })
  // action
  module.forEachAction((action, key) => {
    store._actions[namespace+key] = store._actions[namespace+key] || []
    store._actions[namespace+key].push((payload) => {
      action.call(store, store, payload)
    })
  })
  // getter
  module.forEachGetter((getter, key) => {
    // 模块中 getter的名字重复了 会覆盖
    store._wrappedGetters[namespace+key] = function() {
      return getter(getState(store, path))
    }
  })
  module.forEachChild((child, key) => {
    installModule(store, rootState, path.concat(key), child)
  })
}

function resetStoreVM(store, state) {
  const computed = {};    // 定义计算属性
  store.getters = {};    // 定义 store 中的 getters
  
  forEachValue(store._wrappedGetters, (fn, key) => {
    computed[key] = () => {
      return fn()
    }
    Object.defineProperty(store.getters, key, {
      get: () => store._vm[key]    // 去计算属性中取值
    })
  })

  store._vm = new Vue({
    data: {
      $$state: state,
    },
    computed      //计算属性有缓存效果
  })
}

export class Store {    // 容器的初始化
  constructor(options) {   // options 就是你 Vuex.Store({state, mutation, actions})
    const state = options.state    // 数据变化要更新视图 （vue的核心逻辑 依赖收集）,,  所以 要 改为 响应式数据

    this._actions = {}
    this._mutations = {}
    this._wrappedGetters = {}
    this._subscribes = []

    // 数据的格式化 格式化成我想要的结果（树）

    // 1. 模块收集
    this._modules = new ModuleCollection(options)

    // 根模块的状态中 要将子模块通过模块名 定义在根模块上
    // 2.安装模块
    installModule(this, state, [], this._modules.root)

    // 3. 将状态和getters 都定义在当前的vm上
    resetStoreVM(this, state)

    // Vuex 的插件实现
    // 插件内部会依次执行
    options.plugins.forEach(plugin => plugin(this))

  }

  get state() {  // 属性访问器
    return this._vm._data.$$state   //   虽然 vue 官方 内部 对于 $ 开头的属性不会挂载到 vm 实例上， 但是会挂载到 _data 上，所以，在vm._data 中是能够被访问到的。
  }
/*
// 在严格模式下 this 的指向
类的方法内部如果含有this，它默认指向类的实例。但是，必须非常小心，一旦单独使用该方法，很可能报错。 
但是，如果将这个方法提取出来单独使用，this会指向该方法运行时所在的环境（由于 class 内部是严格模式，所以 this 实际指向的是undefined）
1. 一个比较简单的解决方法是，在构造方法中绑定this  bind
2. 使用箭头函数
*/
  commit = (type, payload) => {     // 为什么要这么写， 因为 用户可能会使用解构等方式获取这个方法，这样this就不是指向当前实例，， 所以为了保证当前this指向，所以用箭头函数
    // 调用 commit 其实就是去找 刚才绑定好的mutation
    this._mutations[type].forEach(mutation => mutation.call(this, payload))    // 发布订阅
  }

  dispatch = (type, payload) => {
    this._actions[type].forEach(action => action.call(this, payload))      // 发布订阅
  }

  replaceState(state) {
    // 替换掉最新的状态
    this._vm._data.$$state = state
  }

  subscribe = (fn) => {
    this._subscribes.push(fn)
  }
}

/*
  // Vue.use 的核心原理
  Vue.use = function(plugin) {
    plugin.install.call(this)
  }
*/


// Vue.use 方法会调用插件的install 方法，此方法中的参数就是Vue的构造函数
export const install = (_Vue) => {   // 插件的安装  Vue.use()
  // _Vue   是Vue 的构造函数，外部传入是什么版本的Vue，就是什么版本， 不用在担心 Vue 版本的兼容性问题， 比如 2.x  或 3.x 都可以
  Vue = _Vue  // 将当前的Vue 暴露出去，那么，在当先的项目中，就都可以使用这个 Vue 

  // 需要将根组件中注入的 store 分派给每一个组件（子组件）  Vue.mixin
  applyMixin(Vue)
}