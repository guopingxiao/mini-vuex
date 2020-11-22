export default {
  namespaced: true,
  state: {
    age: 444
  },
  getters: {

  },
  mutations: {
    changeAge(state, payload) {
      state.age += payload
    }
  },
  actions: {

  }
}