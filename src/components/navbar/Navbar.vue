<template>
   <div class="navbar w-100 d-flex flex-row align-items-center">
      <Dropdown v-model="selectedCity" :options="cities" optionLabel="name" placeholder="Select a City" />
   </div>
</template>

<script setup lang="ts">
import Dropdown from 'primevue/dropdown';
import { ref } from 'vue';
const selectedCity = null;
const cities = ref([
   {name: 'New York', code: 'NY'},
			{name: 'Rome', code: 'RM'},
			{name: 'London', code: 'LDN'},
			{name: 'Istanbul', code: 'IST'},
			{name: 'Paris', code: 'PRS'}
]);
</script>

<style lang="scss" scoped>
@import "@app/styles/variables.scss";

.navbar {
   height: 50px;
   background: $slate-700;
}
</style>
