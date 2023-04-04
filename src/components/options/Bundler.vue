<template>
   <div class="d-flex flex-column gap-3 w-100 h-100">
      <Card>
         <template #title>
            <span class="text-truncate"> Entry Point </span>
         </template>
         <template #content>
            <p class="text-wrap text-muted">
               The path to the entry point of the bundle.
            </p>
            <InputText v-model="options.entry"></InputText>
         </template>
      </Card>
      <Card>
         <template #title>
            <span class="text-truncate"> Environment Mode </span>
         </template>
         <template #content>
            <p class="text-wrap text-muted">
               When set to <code>development</code>, bundling will be optimized
               for fast and flexible workflow during the development process.
               When set to <code>production</code>, it will be optimized for
               performance and efficiency in a live production environment. When
               set to <code>auto</code>, it will be in
               <code>development</code> mode during the development process and
               <code>production</code> mode when downloading.
            </p>
            <Dropdown
               v-model="options.envMode"
               :options="optionsEnvMode"
            ></Dropdown>
         </template>
      </Card>
      <Card>
         <template #title>
            <span class="text-truncate"> Infinite Loop Protection </span>
         </template>
         <template #content>
            <p class="text-wrap text-muted">
               This option safeguards against situations where a user's code
               contains an endless loop created by a while, for, or do loop. It
               also prevents the creation of infinite loops that can occur when
               a React component references itself.
            </p>
            <InputSwitch v-model="options.infiniteLoopProtection" />
         </template>
      </Card>
      <Card>
         <template #title>
            <span class="text-truncate"> Replace </span>
         </template>
         <template #content>
            <p class="text-wrap text-muted">
               Replace variables in your code with other values or expressions
               at compile time.
            </p>
            <RecordPair v-model="options.replace"></RecordPair>
         </template>
      </Card>
      <Card>
         <template #title>
            <span class="text-truncate"> Resolve Aliases </span>
         </template>
         <template #content>
            <p class="text-wrap text-muted">
               Create aliases to import or require certain modules more easily. (This option is currently not supported in TypeScript)
            </p>
            <RecordPair v-model="options.resolve.alias"></RecordPair>
         </template>
      </Card>
      <Card>
         <template #title>
            <span class="text-truncate"> Resolve Fallbacks </span>
         </template>
         <template #content>
            <p class="text-wrap text-muted">
               Redirect module requests when normal resolving fails.
            </p>
            <RecordPair v-model="options.resolve.fallback"></RecordPair>
         </template>
      </Card>
      <Card>
         <template #title>
            <span class="text-truncate"> Resolve Extensions </span>
         </template>
         <template #content>
            <p class="text-wrap text-muted">
               Attempt to resolve the extensions provided in order.
            </p>
            <Chips
               v-model="options.resolve.extensions"
               :allow-duplicate="false"
               :separator="' '"
            ></Chips>
         </template>
      </Card>
      <Card>
         <template #title>
            <span class="text-truncate"> Source Maps </span>
         </template>
         <template #content>
            <p class="text-wrap text-muted">
               When set to <code>full</code>, it will map both lines and columns
               of code, providing a more detailed and accurate representation of
               the original source code. When set to <code>cheap</code>, it will
               result in a less detailed source map but smaller and faster
               bundle. When set to <code>none</code>, it will produce no source
               maps. (Note: Source map is set to <code>none</code> when
               Environment Mode is set to <code>production</code>.)
            </p>
            <Dropdown
               v-model="options.sourceMap"
               :options="optionsSourceMap"
            ></Dropdown>
         </template>
      </Card>
   </div>
</template>

<script lang="ts" setup>
import Chips from "primevue/chips";
import Dropdown from "primevue/dropdown";
import InputText from "primevue/inputtext";
import InputSwitch from "primevue/inputswitch";
import Card from "primevue/card";
import RecordPair from "@app/components/basic/RecordPair.vue";
import defaultBundlerOptions from "@app/options/bundler";
const props = defineProps<{
   options: typeof defaultBundlerOptions;
}>();

const optionsEnvMode: Array<typeof defaultBundlerOptions["envMode"]> = [
   "development",
   "production",
];

const optionsSourceMap: Array<typeof defaultBundlerOptions["sourceMap"]> = [
   "full",
   "cheap",
   "none",
];
</script>

<style lang="scss" scoped></style>
