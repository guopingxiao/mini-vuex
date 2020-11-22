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



### Vuex中的模块搜集

将数据进行格式化，格式化成一颗树

```js
this._modules = new ModuleCollection(options)  // options 就是 Vuex.Store中传入的参数
```

```js
import { forEachValue } from "../util"
import Module from './module'

class ModuleCollection {
  constructor(options) {
    this.register([], options)    // stack = [根对象, a, c]  [根对象, b]  栈结构
  }

  register(path, rootModule) {
    let newModule = new Module(rootModule)

    if(path.length == 0) {
      // 根模块
      this.root = newModule
    } else {
      // [a]
      // [b]
      let parent = path.slice(0, -1).reduce((memo, current) => {
        return memo.getChild(current)   
      }, this.root)
      parent.addChild(path[path.length-1], newModule)
    }

    if(rootModule.modules) {
      forEachValue(rootModule.modules, (module, moduleName) => {
        // [a]
        // [b]
        this.register(path.concat(moduleName), module)
      })
    }

  }
}

export default ModuleCollection
```

```js
import { forEachValue } from "../util"

class Module {
  constructor(newModule) {
    this._raw = newModule
    this._children = {}
    this.state = newModule.state
  }
  getChild(key) {
    return this._children[key]
  }
  addChild(key, module) {
    this._children[key] = module
  }
	......
}

export default Module
```

最后我们的转换过程和结果如下：

```js
{
	state: {},
  getters: {},
  mutations: {},
  actions: {},
  modules: {
    a,    // a里又有模块c
    b
  }
}
```

转换结果如下

```js
this.root = {
  "_raw": "根模块",
  "_children": {
    "a": {
    	"_raw": "a模块",
      "_children": {
        "c": {
          "_raw": "c模块",
          "_children": {},
          "state": "c状态"
        }
    	},
			"state": "a状态"
		},
    "b": {
      "_raw": "b模块",
      "_children": {},
      "state": "b状态"
    }
	},
	"state": "根模块自己的状态"
}
```



### Vuex中的安装模块

在根模块的状态中，将子模块通过模块名 定义在根模块中

```js
class Store {
  constructor(options) {   // options 就是 {state, getters, mutation, actions}
    const state = options.state    
    this._actions = {}
    this._mutations = {}
    this._wrappedGetters = {}
    
    ......
    installModule(this, state, [], this._modules.root)
		......
    
  }
}
```

通过 `installModule` 方法我们来处理 state、getter、mutation、action，

- 将state处理成一层一层的模式
- getter都处理到一起`store._wrappedGetters`
- mutation也处理到一起`store._mutations`
- action也处理到一起`store._actions`
- 最后再进行递归 执行 `installModule` 方法，对于有子模块的情况，进行递归执行，这样，子模块的state、getter、mutation、action就能合并到根的state、getter、mutation、action上了。

```js
const installModule = (store, rootState, path, module) => {
  // 这里我要对当前模块进行操作
  // 这里我需要遍历当前模块上的 actions、mutation、getters 都把他定义在

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
    store._mutations[key] = store._mutations[key] || []
    store._mutations[key].push((payload) => {
      mutation.call(store, module.state, payload)
    })
  })
  // action
  module.forEachAction((action, key) => {
    store._actions[key] = store._actions[key] || []
    store._actions[key].push((payload) => {
      action.call(store, store, payload)
    })
  })
  // getter
  module.forEachGetter((getter, key) => {
    // 模块中 getter的名字重复了 会覆盖
    store._wrappedGetters[key] = function() {
      return getter(module.state)
    }
  })
  module.forEachChild((child, key) => {
    installModule(store, rootState, path.concat(key), child)
  })
}
```

最后整个 store 实例的`state`、`_wrappedGetters`、`_mutations`、`_actions`的属性就变成了合并的结果了， 其中 `_wrappedGetters` 属性会被覆盖，不会有重复，`_mutations`和`_actions`结果是一个数组。如下：

```js
state = {
  age: 10,
  a: {
    age: 222,
    c: {
      age: 444
    }
  },
  b: {
    age: 333
  }
}

this._wrappedGetters = {
  myAge() {......},
  myAge2() {}
}

this._mutations = {
  changeAge: [fn1, fn2, fn3, fn4],     // 这里的 fn 是同名的情况
  changeAge1: [xx],
 	changeAge2: [xx]   
}

this._actions = {
  changeAge: [fn1, xx],
  changeAge1: [xx]
}
```



### Vuex中的状态

将 state 和 getters 都定义在当前的 vm 上

```js
class Stroe {
  constructor() {
    ......
    resetStoreVM(this, state)
    ......
  }
  
  get state() {  // 属性访问器
    return this._vm._data.$$state   //   虽然 vue 官方 内部 对于 $ 开头的属性不会挂载到 vm 实例上， 但是会挂载到 _data 上，所以，在vm._data 中是能够被访问到的。
  }
}
```

`resetStoreVM`第一个参数是 store 实例，第二个参数是 处理过的整体的 state。通过如下方法，我们可以将state和getters转成了响应式属性，其中需要借用Vue的data和计算属性来做到。这样就会进行依赖收集了，而且计算属性具有缓存效果，所以getters也是。

将 `_wrappedGetters`上的属性和值定义到计算属性上。

现在store 实例上也存在 getters 属性了。

```js
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
```

```js
state
_wrappedGetters
getters
_mutations
_actions
```

### 命名空间的实现

现在我们要实现Vuex的命名空间，主要是看 module 中的 namespaced 属性。其思想就是对路径的字符串拼接，增加上模块名。给 getters、mutations、actions的key值拼接上模块名。

主要是在初始化store时 的 installModule 方法中进行
```js
class Store {
  constructor() {
    ......
    // 2.安装模块
    installModule(this, state, [], this._modules.root)
    ......
  }
}

```
```js
const installModule = (store, rootState, path, module) => {
  ...
  // 我要给当前订阅的事件 增加一个命名空间   a/change   b/changge   a/c/change    path [a]  [b]   [a, c]  
  let namespace = store._modules.getNamespaced(path)      // 返回前缀即可
  ...
}
```
我们在 ModuleCollection 类中 增加一个方法，用于获取 拼接 namespaced 后的 字符串路径值，然后再将其绑定到 getters、mutations、actions上
```js
class ModuleCollection {
  ...
  getNamespaced(path) {
    let root = this.root      //从根模块开始找
    return path.reduce((str, key) => {
      root = root.getChild(key)     // 不停的去找当前的模块
      return str + ( root.namespaced ? key + '/' : '')   // a/c/   c/
    }, '')    // 参数是一个字符串
  }
  ...
}
```
但是注意这里的 `root.namespaced` ，此时因为 root 是进过我们处理过得到的树，我们要先给该root增加上 namespaced 属性，即 Module 类增加上 namespaced 访问器属性
```js
class Module {
  get namespaced() {
    return !!this._raw.namespaced
  }
  ...
}
```
最后 给每个 需要拼接上 命名空间的地方增加上该值，如 `store._mutations[namespace+key]`
```js
const installModule = (store, rootState, path, module) => {
  ...
  // 我要给当前订阅的事件 增加一个命名空间   a/change   b/changge   a/c/change    path [a]  [b]   [a, c]  
  let namespace = store._modules.getNamespaced(path)      // 返回前缀即可

  // mutation
  module.forEachMutation((mutation, key) => {
    store._mutations[namespace+key] = store._mutations[namespace+key] || []
    store._mutations[namespace+key].push((payload) => {
      mutation.call(store, module.state, payload)
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
      return getter(module.state)
    }
  })
}
```


### Vuex插件的实现

先来说明一下Vuex中的插件，Vuex的store接收 `plugins` 选项，这个选项暴露出每次 mutation 的钩子。Vuex插件就是一个函数，它接收 store 作为唯一参数。

```js
const store = new Vuex.Store({
  // ...
  plugins: [myPlugin]
})
```

```js
const myPlugin = store => {
  // 当 store 初始化后调用
  store.subscribe((mutation, state) => {
    // 每次 mutation 之后调用
    // mutation 的格式为 { type, payload }
  })
}
```

每次执行mutation后都会执行这个监控方法。现在让我们来实现这个功能。

首先我们现在 Vuex.Store上增加 plugins 插件属性， 为这个插件增加一个 persists 方法，该方法的作用就是每次 执行 mutation 后 我们将 state 的值保存到缓存中，让页面刷新后，从缓存中取值，显示的最后一次保存的值，让页面看起来好像有记忆功能一样

```js
Vuex.Store({
  plugins: [
    persists()
  ]
})
```

```js
function persists() {
  return function(store) {   // store 是当前默认传递的
    let data = localStorage.getItem('VUEX:STATE')
    if(data) {
      store.replaceState(JSON.parse(data))
    }
    store.subscribe((mutation, state) => {
      localStorage.setItem('VUEX:STATE', JSON.stringify(state))
    })
  }
}
```

很明显这个实现用到的也是发布订阅模式，具体如下：

```js
class Store {
  constructor() {
    ...
  	this._subscribes = []
    ...
    // Vuex 的插件实现
    // 插件内部会依次执行
    options.plugins.forEach(plugin => plugin(this))
  }
  ...
  
  subscribe = (fn) => {
    this._subscribes.push(fn)
  }
}
```

初始化执行 `options.plugins.forEach(plugin => plugin(this))` 会执行插件内部定义的插件，将一个个相关的回调存到了  `_subscribes` 中，等执行 mutation 时，执行该数组中的所有方法，所以就想一个监听函数一样

```js
// mutation
  module.forEachMutation((mutation, key) => {
    ...
    store._mutations[namespace+key].push((payload) => {
      ...
      store._subscribes.forEach(fn => {   // 关键部分
        fn(mutation, store.state)
      })
    })
  })
```

当 `commit` 时，会触发`_mutations` 中的所有方法，在这些方法内部我们会调用之前绑定到 `_subscribes` 上的方法，这些方法接收两个参数 `mutation`, `state`，所以就执行了方法内部的 `localStorage.setItem('VUEX:STATE', JSON.stringify(state))` 语句了。

接下来我们再来说一下插件中定义的 `store.replaceState(JSON.parse(data))` 方法，作用是当刷新页面时从缓存中获取数据，state回到最后一次的效果，好像记忆功能一样

```js
class Store {
  ...
  replaceState(state) {
    // 替换掉最新的状态
    this._vm._data.$$state = state
  }
}
```

这样 state 就重新赋值了，但是这里有一个问题，因为是覆盖的原因，那么Store 中原本的 state 就是旧的了，如果我们不进行修改的话，那么每次更新页面将不会更新，因为 state 还是旧的state，所以我们定义一个方法，用于返回每个module 的新的 state

```js
function getState(store, path) {    // 获取最新的状态
  return path.reduce((newState, current) => {
    return newState[current]
  }, store.state)
}
```

```js
const installModule = (store, rootState, path, module) => {
  ...
  module.forEachMutation((mutation, key) => {
    ...
    store._mutations[namespace+key].push((payload) => {
      ...
      mutation.call(store, getState(store, path), payload)   // 每次传给mutation 方法的state参数是新的state
      ...
    })
  })
  ...
  // getter
  module.forEachGetter((getter, key) => {
    store._wrappedGetters[namespace+key] = function() {
      return getter(getState(store, path))   // getters 的 state 参数也一样
    }
  })
    ...
}
  
```



### 辅助函数



```js
import { mapState, mapGetters } from './vuex'

export default {
  name: 'app',
  computed: {
    ...mapState(['age']),
    ...mapGetters(['myAge'])
  },
  methods: {

  }
}
```

```js
// helpers.js

export function mapState(stateArr) {
  let obj = {}
  stateArr.forEach(key => {
    obj[key] = function() {
      return this.$store.state[key]
    }
  })
  return obj
}

export function mapGetters(gettersArr) {
  let obj = {}
  gettersArr.forEach(key => {
    obj[key] = function() {
      return this.$store.getters[key]
    }
  })
  return obj
}
```

```js
// vuex/index.js

...

export * from './helpers'

```