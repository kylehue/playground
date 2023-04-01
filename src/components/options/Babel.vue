<template>
   <div class="d-flex flex-column gap-3 w-100 h-100">
      <Card>
         <template #title>
            <span class="text-truncate"> Transform Presets </span>
         </template>
         <template #content>
            <p class="text-wrap text-muted">
               Babel code transformation presets.
            </p>
            <MultiSelect
               :filter="true"
               v-model="options.transformPresets"
               :options="optionsTransformPresets"
               :option-label="(d) => d"
               display="chip"
               class="mw-100"
               :show-toggle-all="false"
            ></MultiSelect>
         </template>
      </Card>
      <Card>
         <template #title>
            <span class="text-truncate"> Transform Plugins </span>
         </template>
         <template #content>
            <p class="text-wrap text-muted">
               Babel code transformation plugins.
            </p>
            <MultiSelect
               :filter="true"
               v-model="options.transformPlugins"
               :options="optionsTransformPlugins"
               :option-label="(d) => d"
               display="chip"
               class="mw-100"
               :show-toggle-all="false"
            ></MultiSelect>
         </template>
      </Card>
      <Card>
         <template #title>
            <span class="text-truncate"> Parse Plugins </span>
         </template>
         <template #content>
            <p class="text-wrap text-muted">Babel code parsing plugins.</p>
            <MultiSelect
               :filter="true"
               v-model="options.parsePlugins"
               :options="optionsParsePlugins"
               :option-label="(d) => d"
               display="chip"
               class="mw-100"
               :show-toggle-all="false"
            ></MultiSelect>
         </template>
      </Card>
   </div>
</template>

<script lang="ts" setup>
import Card from "primevue/card";
import MultiSelect from "primevue/multiselect";
import type defaultBabelOptions from "@app/options/babel";
import BabelLoader from "toypack/lib/BabelLoader";
import { computed } from "vue";
const props = defineProps<{
   options: typeof defaultBabelOptions;
}>();

const optionsTransformPlugins = computed(() => {
   let opt = Object.keys(BabelLoader.getAvailablePlugins());
   // Remove defaults from transform plugins options
   opt.splice(opt.indexOf("loop-protect"), 1);
   opt.splice(opt.indexOf("add-module-exports"), 1);

   return opt;
});

const optionsTransformPresets = computed(() =>
   Object.keys(BabelLoader.getAvailablePresets())
);

const optionsParsePlugins = computed(() => [
   "asyncDoExpressions",
   "asyncGenerators",
   "bigInt",
   "classPrivateMethods",
   "classPrivateProperties",
   "classProperties",
   "classStaticBlock",
   "decimal",
   "decorators",
   "decorators-legacy",
   "decoratorAutoAccessors",
   "destructuringPrivate",
   "doExpressions",
   "dynamicImport",
   "estree",
   "explicitResourceManagement",
   "exportDefaultFrom",
   "flow",
   "flowComments",
   "functionBind",
   "functionSent",
   "importMeta",
   "jsx",
   "logicalAssignment",
   "importAssertions",
   "importReflection",
   "moduleBlocks",
   "moduleStringNames",
   "nullishCoalescingOperator",
   "numericSeparator",
   "objectRestSpread",
   "optionalCatchBinding",
   "optionalChaining",
   "partialApplication",
   "pipelineOperator",
   "placeholders",
   "privateIn",
   "recordAndTuple",
   "regexpUnicodeSets",
   "throwExpressions",
   "topLevelAwait",
   "typescript",
   "v8intrinsic",
]);
</script>

<style lang="scss" scoped></style>
