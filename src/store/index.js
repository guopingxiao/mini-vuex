import Vue from 'vue'
// import Vuex from 'vuex'
import Vuex from '../mini-vuex/index'
import a from './a'
import b from './b'

Vue.use(Vuex) // vuex是一个vue插件，内部调用install方法

const store =  new Vuex.Store({
  state: {  // --> data 
    age: 28
  },
  getters: { // --> computed
    getAge(state) {
      console.log('getters')
      return state.age + 10;
    }
  },
  mutations: { // --> methods 同步更新方法
    changeAge(state, payload) {
      state.age += payload
    }
  },
  actions: { // --> 异步更新state
    changeAge({commit}, payload) {
      setTimeout(() => {
        commit('changeAge', payload);
      }, 1000);
    }
  },
  modules: {
    a,
    b
  }
})

export default store