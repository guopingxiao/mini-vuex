import c from './c'

export default {
  state: {  // --> data 
    age: 222
  },
  getters: { // --> computed

  },
  mutations: { // --> methods 同步更新方法
    changeAge(state, payload) {
      state.age += payload
    }
  },
  actions: { // --> 异步更新state

  },
  modules: {
    c
  }
}