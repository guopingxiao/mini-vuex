## Vuex

### 基本使用

```js
import Vue from 'vue'
import Vuex from 'vuex'

Vue.use(Vuex)

export default new Vuex.Store({
  state: {    // -> data
    age: 10
  },
  getters: {    // 计算属性
    myAge(state) {
      return state.age + 20
    }
  },
  mutations: {    // method => 同步更改state  mutations 的第一个方法是状态， 第二个参数是可传入的参数
    changeAge(state, payload) {
      state.age += payload   // 更新age属性
    }
  },
  actions: {     // 异步操作做完后将结果提交给 mutations
    changeAge({commit, dispatch}, payload) {
      setTimeout(() => {
        commit('changeAge', payload)
      }, 1000)
    }
  },
  modules: {
  }
})
```

在模板上渲染

```vue
<template>
  <div id="app">
    <div>老朱今年多少岁：{{this.$store.state.age}}</div>
    <div>我的年龄是：{{this.$store.getters.myAge}}</div>
    <button @click="$store.commit('changeAge', 5)">同步更新age</button>
    <button @click="$store.dispatch('changeAge', 5)">异步更新age</button>
  </div>
</template>
```

导入关在到vue实例上

```js
new Vue({
  router,
  store,
  render: h => h(App)
}).$mount('#app')
```



### 初始化Vuex插件

Vue 中关于插件的安装注册，主要是使用 `Vue.use` 这个方法，其中该方法的核心原理是：

```js
Vue.use = function(plugin) {
  plugin.install.call(this)
}
```

好了，我们现在来初始化这个插件

```js
// store

class Store {}

const install = () => {
  ......
  // 需要将根组件中注入的 store 分派给每一个组件（子组件）  Vue.mixin
  applyMixin(Vue)  
}
```

```js
// applyMixin

export default function applyMixin(Vue) {
  Vue.mixin({   
    beforeCreate: vuexInit
} 

function vuexInit() {   // 每个组件创建的时候都会执行这个 钩子函数
    // 如果有 store 属性，表示的是一个根实例，， 即 最开始，我们把 store 注册到 main.js 上的 根实例中

    // 给所有的组件增加 $store 属性， 指向我们创建的 $store 属性
    const options = this.$options;    // 获取用户所有的选项
    if(options.store) {   // 根实例
      this.$store = options.store
    } else if(options.parent && options.parent.$store) {   // 儿子或者孙子
      this.$store = options.parent.$store
    }
  }
})

```

首先我们可以确定只有在根实例中才有 `store` 属性，因为这个属性是用户传入的。此时我们给根实例定义一个 `$store`属性，当创建子组件时，我们去获取子组件的父组件中的 `$store` 属性，如果存在我们就给子组件也创建这个属性，如果没有，则表示是根组件了。 通过一层层往上找然后创建的方式，这样就给每个组件定义了一个 `$store` 属性了。



 ### Vuex的基本实现



```js
<template>
  <div id="app">
    <div>老朱今年多少岁：{{this.$store.state.age}}</div>
    <div>我的年龄是：{{this.$store.getters.myAge}}</div>
    <button @click="$store.commit('changeAge', 5)">同步更新age</button>
    <button @click="$store.dispatch('changeAge', 5)">异步更新age</button>
  </div>
</template>
```

我们可以看到像 `state`、`getters`、`commit`、`dispatch` 等都是 Store 的实例，那么现在我们开始创建这个属性或方法。



#### state

第一步首先我们先来处理 state

```js
class Store {
    constructor(options) {
        const state = options.state
        ......
        // 1. 添加状态逻辑  数据需要是一个响应式数据
        this._vm = new Vue({
            data: {
                $$state: state
            }
        })
    }
    
    get state() {   // 属性访问器
        return this._vm._data.$$state
    }
 } 
```

为了让数据变化，视图也能更新，因此，此处的state数据必须是响应式数据，为了要让数据变成响应式，我们这里直接使用Vue创建一个实例，这样 state 就具备响应式的效果了。但是这里要注意我们使用了` $$state`，Vue 中内部规定了，如果使用`$`开头的在data中定义的属性，不会被定义在vm 实例上，但是我们可以在`vm._data.$$state`中获取到。

因为现在state 已经变成了响应式数据，因此当我们改变数据时，视图也会被渲染



#### getters

第二步处理getters 属性，需要具备缓存的效果，类似于 `computed`（多次取值是如果值不变是不会重新取值的）

```js
this.getters = {}
forEachValue(options.getters, (fn, key) => {
    computed[key] = () => {
        return fn(this.state)
    }
    Object.defineProperty(this.getters, key, {
        get: () => this._vm[key]
    })
})
this._vm = new Vue({
    data: {  
        $$state: state, 
    },
    computed
})
```

```js
// 1. 功能是遍历对象
export const forEachValue = (obj, callback) => {
  Object.keys(obj).forEach(key => callback(obj[key], key))
}
```

如果页面中同一个getter调用了很多次，我们只需去取缓存中的数据，因此我们对getter的处理需要用上计算属性 computed

```js
<div{{this.$store.getters.a}}</div>
<div{{this.$store.getters.a}}</div>
<div{{this.$store.getters.a}}</div>
<div{{this.$store.getters.a}}</div>
```



#### mutation && action

实现mutation和action， 就是使用发布订阅的模式

``` js
class Store {
    constructor(){
    // 3. 实现 mutations
    this.mutations = {}
    this.actions = {}
    forEachValue(options.mutations, (fn, key) => {
      // this.mutations = {myAge: payload => 用户定义的逻辑(state, payload)}
      this.mutations[key] = payload => fn(this.state, payload)
    })
    forEachValue(options.actions, (fn, key) => {
      this.actions[key] = payload => fn(this, payload)
    })
}

    commit = (type, payload) => {     // 为什么要这么写， 因为 用户可能会使用解构等方式获取这个方法，这样this就不是指向当前实例，， 所以为了保证当前this指向，所以用箭头函数
        // 调用 commit 其实就是去找 刚才绑定好的mutation
        this.mutations[type](payload)
    }

    dispatch = (type, payload) => {
        this.actions[type](payload)
    }
}
```

注意，这里为什么要用箭头函数来写方法，是因为在严格模式下 this 的指向

类的方法内部如果含有this，它默认指向类的实例。但是，必须非常小心，一旦单独使用该方法，很可能报错。 

但是，如果将这个方法提取出来单独使用，this会指向该方法运行时所在的环境（由于 class 内部是严格模式，所以 this 实际指向的是undefined）

1. 一个比较简单的解决方法是，在构造方法中绑定this  bind

2. 使用箭头函数

```vue
<button @click="$store.commit('aaa', 5)">同步更新</button>
<button @click="$store.dispatch('aaa', 5)">异步更新</button>
```
