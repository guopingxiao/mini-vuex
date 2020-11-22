<template>
  <div id="app">
    <div>老朱今年多少岁：{{age}}</div>
    <div>我的年龄是：{{myAge}}</div>
    <!-- <div>我的年龄是：{{this.$store.state.a.age}}</div> -->
    <!-- <div>我的年龄是：{{this.$store.state.b.age}}</div> -->
    <button @click="$store.state.age = 100">同步更新age</button> 
    <button @click="$store.commit('a/changeAge', 5)">同步更新age</button>
    <button @click="$store.commit('b/changeAge', 5)">异步更新age</button>
    <button @click="$store.dispatch('b/changeAge', 5)">异步更新age</button>
  </div>
</template>

<script>

import { mapState, mapGetters } from './vuex'

export default {
  name: 'app',
  computed: {
    ...mapState(['age']),
    ...mapGetters(['myAge'])
  },
  methods: {

  }
}
</script>