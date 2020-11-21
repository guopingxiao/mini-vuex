const applyMixin = (Vue) => { 
  Vue.mixin({
    beforeCreate: initVuex // 内部会把生命周期函数，拍平为一个数组
  })
}

/**
 * 初始化Vuex, 组件的渲染是从父  --> 子
 */
function initVuex() { 
  const options = this.$options // optionsAPI 传入的options， this--> 指向当前组件实例
  if (options.store) {
    this.$store = options.store //给根实例增加$store属性, 这样其他子组件均可从parent上$store获取；
  } else if (options.parent && options.parent.$store) { 
    // 给子组件增加$store属性， 组件渲染后，所有的组件均注入了$store属性
    this.$store = options.parent.$store
  }

}

export default applyMixin