<template>
  <div id="app">
    我的年龄是: {{this.$store.state.age}}
    <br />
    老王的年龄是: {{this.$store.getters.getAge}}
    <br />
    <!-- dispatch对应的action -->
    <button @click="$store.dispatch('changeAge', 3)">过一会增加年龄3</button>
    <!-- commit 对应的mutation -->
    <button @click="$store.commit('changeAge', 5)">立即增加年龄5</button>
  </div>
</template>

