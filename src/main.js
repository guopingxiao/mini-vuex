import Vue from 'vue'
import App from './App.vue'
import router from './router'
import store from './store'

Vue.config.productionTip = false

new Vue({
  name: 'root',
  router,
  store,  // 每个组件、子组件 都会拥有一个属性 $store 
  render: h => h(App)
}).$mount('#app')
