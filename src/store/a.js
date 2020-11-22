import c from './c'
export default {
  namespaced: true,
  state: {
    age: 222
  },
  getters: {

  },
  mutations: {
    changeAge(state, payload) {
      state.age += payload
    }
  },
  actions: {

  },
  modules: {
    c
  }
}