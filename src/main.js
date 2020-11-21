import Vue from 'vue'
import App from './App.vue'

import store from './store'

// 根实例，App为根组件；
new Vue({
  name: 'root',
  store: store,
  render: h => h(App),
}).$mount('#app')
