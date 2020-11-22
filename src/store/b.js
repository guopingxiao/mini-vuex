export default {
  namespaced: true,
  state: {
    age: 333
  },
  getters: {

  },
  mutations: {
    changeAge(state, payload) {
      state.age += payload
    }
  },
  actions: {
    changeAge(state, payload) {
      state.age += payload
    }
  }
}