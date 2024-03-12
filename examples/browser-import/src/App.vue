<script setup lang="ts">
import HelloWorld from './components/HelloWorld.vue'
import TheWelcome from './components/TheWelcome.vue'
import { formatDate } from '@compass-aiden/helpers'; // es import, auto tree shake
// import * as AllHelpers from '@compass-aiden/helpers/esm'; // esm import
// import '@compass-aiden/helpers/umd'; // umd import

console.log('Test: ', formatDate());
// // @ts-ignore
// console.log('Test2: ', window.CompassHelpers);
// Logger.log('Hello World');
// // @ts-ignore
// window.CompassHelpers.Logger.log('UMD log: Hello World');
</script>

<template>
  <header>
    <img alt="Vue logo" class="logo" src="./assets/logo.svg" width="125" height="125" />

    <div class="wrapper">
      <HelloWorld msg="You did it!" />
    </div>
  </header>

  <main>
    <TheWelcome />
  </main>
</template>

<style scoped>
header {
  line-height: 1.5;
}

.logo {
  display: block;
  margin: 0 auto 2rem;
}

@media (min-width: 1024px) {
  header {
    display: flex;
    place-items: center;
    padding-right: calc(var(--section-gap) / 2);
  }

  .logo {
    margin: 0 2rem 0 0;
  }

  header .wrapper {
    display: flex;
    place-items: flex-start;
    flex-wrap: wrap;
  }
}
</style>
