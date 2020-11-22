export default function applyMixin(Vue) {
  Vue.mixin({   // 内部会把生命周期函数 拍平成一个数组
    beforeCreate: vuexInit
  })
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