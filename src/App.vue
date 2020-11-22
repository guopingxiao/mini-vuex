<template>
  <div id="app">
    我的年龄是: {{this.$store.state.age}}<br />
    老朱的年龄是: {{this.$store.getters.getAge}}<br />
    老王的年龄是: {{this.$store.getters.getAge}}<br />
    a模块的年龄是: {{this.$store.state.a.age}}<br />
    b模块的年龄是: {{this.$store.state.b.age}}<br />
    <!-- commit 对应的mutation -->
    <button @click="$store.commit('changeAge', 5)">立即增加年龄5</button>
    <!-- dispatch对应的action -->
    <button @click="$store.dispatch('changeAge', 3)">过一会增加年龄3</button>
  </div>
</template>
<script>
export default {

}
</script>

