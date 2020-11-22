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