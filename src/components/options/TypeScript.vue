<template>
   <div class="d-flex flex-column gap-3 w-100 h-100">
      <Card>
         <template #title>
            <span class="text-truncate"> Allow JS </span>
         </template>
         <template #content>
            <p class="text-wrap text-muted">
               Allow JavaScript files to be imported inside your project, instead of just <code>.ts</code> and <code>.tsx</code> files.
            </p>
            <TriStateCheckbox v-model="options.allowJs"></TriStateCheckbox>
         </template>
      </Card>
      <Card>
         <template #title>
            <span class="text-truncate"> Allow Synthetic Default Imports </span>
         </template>
         <template #content>
            <p class="text-wrap text-muted">
               When set to true, it allows you to write an import like:
               <pre>import React from "react";</pre>
               instead of:
               <pre>import * as React from "react";</pre>
            </p>
            <TriStateCheckbox v-model="options.allowSyntheticDefaultImports"></TriStateCheckbox>
         </template>
      </Card>
      <Card>
         <template #title>
            <span class="text-truncate"> Check JS </span>
         </template>
         <template #content>
            <p class="text-wrap text-muted">
               Works in tandem with <code>allowJs</code>. When <code>checkJs</code> is enabled then errors are reported in JavaScript files. This is the equivalent of including <code>// @ts-check</code> at the top of all JavaScript files which are included in your project.
            </p>
            <TriStateCheckbox v-model="options.checkJs"></TriStateCheckbox>
         </template>
      </Card>
      <Card>
         <template #title>
            <span class="text-truncate"> ES Module Interop </span>
         </template>
         <template #content>
            <p class="text-wrap text-muted">
               By default (with esModuleInterop false or not set) TypeScript treats CommonJS/AMD/UMD modules similar to ES6 modules. In doing this, there are two parts in particular which turned out to be flawed assumptions:
               <ul>
                  <li>a namespace import like <code>import * as moment from "moment"</code> acts the same as <code>const moment = require("moment")</code></li>
                  <li>a default import like import moment from "moment" acts the same as <code>const moment = require("moment").default</code></li>
               </ul>
               This mis-match causes these two issues:
               <ul>
                  <li>the ES6 modules spec states that a namespace import (<code>import * as x</code>) can only be an object, by having TypeScript treating it the same as <code>= require("x")</code> then TypeScript allowed for the import to be treated as a function and be callable. That's not valid according to the spec.</li>
                  <li>while accurate to the ES6 modules spec, most libraries with CommonJS/AMD/UMD modules didn't conform as strictly as TypeScript's implementation.</li>
               </ul>
               Turning on this option will fix both of these problems in the code transpiled by TypeScript.
            </p>
            <TriStateCheckbox v-model="options.esModuleInterop"></TriStateCheckbox>
         </template>
      </Card>
      <Card>
         <template #title>
            <span class="text-truncate"> Experimental Decorators </span>
         </template>
         <template #content>
            <p class="text-wrap text-muted">
               Enables experimental support for decorators, which is a version of decorators that predates the TC39 standardization process.  <a href="https://www.typescriptlang.org/docs/handbook/decorators.html" target="_blank">See</a>
            </p>
            <TriStateCheckbox v-model="options.experimentalDecorators"></TriStateCheckbox>
         </template>
      </Card>
      <Card>
         <template #title>
            <span class="text-truncate"> Force Consistent Casing In File Names </span>
         </template>
         <template #content>
            <p class="text-wrap text-muted">
               When this option is set, TypeScript will issue an error if a program tries to include a file by a casing different from the casing on disk.
            </p>
            <TriStateCheckbox v-model="options.forceConsistentCasingInFileNames"></TriStateCheckbox>
         </template>
      </Card>
      <Card>
         <template #title>
            <span class="text-truncate"> Isolated Modules </span>
         </template>
         <template #content>
            <p class="text-wrap text-muted">
               While you can use TypeScript to produce JavaScript code from TypeScript code, it's also common to use other transpilers such as Babel to do this. However, other transpilers only operate on a single file at a time, which means they can't apply code transforms that depend on understanding the full type system. This restriction also applies to TypeScript's ts.transpileModule API which is used by some build tools.
            </p>
            <TriStateCheckbox v-model="options.isolatedModules"></TriStateCheckbox>
         </template>
      </Card>
      <Card>
         <template #title>
            <span class="text-truncate"> JSX </span>
         </template>
         <template #content>
            <p class="text-wrap text-muted">
               Controls how JSX constructs are emitted in JavaScript files. This only affects output of JS files that started in <code>.tsx</code> files.
            </p>
            <Dropdown
               v-model="options.jsx"
               :options="optionsJSX"
               option-label="label"
               option-value="value"
            ></Dropdown>
         </template>
      </Card>
      <Card>
         <template #title>
            <span class="text-truncate"> Keyof Strings Only </span>
         </template>
         <template #content>
            <p class="text-wrap text-muted">
               This flag changes the keyof type operator to return string instead of string | number when applied to a type with a string index signature.
            </p>
            <TriStateCheckbox v-model="options.keyofStringsOnly"></TriStateCheckbox>
         </template>
      </Card>
      <Card>
         <template #title>
            <span class="text-truncate"> Module </span>
         </template>
         <template #content>
            <p class="text-wrap text-muted">
               Sets the module system for the program. See the <a href="https://www.typescriptlang.org/docs/handbook/modules.html" target="_blank">Modules</a> reference page for more information.
            </p>
            <Dropdown
               v-model="options.module"
               :options="optionsModule"
               option-label="label"
               option-value="value"
            ></Dropdown>
         </template>
      </Card>
      <Card>
         <template #title>
            <span class="text-truncate"> No Fallthrough Cases In Switch </span>
         </template>
         <template #content>
            <p class="text-wrap text-muted">
               Report errors for fallthrough cases in switch statements. Ensures that any non-empty case inside a switch statement includes either <code>break</code> or <code>return</code>. This means you won't accidentally ship a case fallthrough bug.
            </p>
            <TriStateCheckbox v-model="options.noFallthroughCasesInSwitch"></TriStateCheckbox>
         </template>
      </Card>
      <Card>
         <template #title>
            <span class="text-truncate"> No Implicit Any </span>
         </template>
         <template #content>
            <p class="text-wrap text-muted">
               In some cases where no type annotations are present, TypeScript will fall back to a type of <code>any</code> for a variable when it cannot infer the type.
            </p>
            <TriStateCheckbox v-model="options.noImplicitAny"></TriStateCheckbox>
         </template>
      </Card>
      <Card>
         <template #title>
            <span class="text-truncate"> No Implicit Returns </span>
         </template>
         <template #content>
            <p class="text-wrap text-muted">
               When enabled, TypeScript will check all code paths in a function to ensure they return a value.
            </p>
            <TriStateCheckbox v-model="options.noImplicitReturns"></TriStateCheckbox>
         </template>
      </Card>
      <Card>
         <template #title>
            <span class="text-truncate"> No Implicit This </span>
         </template>
         <template #content>
            <p class="text-wrap text-muted">
               Raise error on ‘this' expressions with an implied ‘any' type.
            </p>
            <TriStateCheckbox v-model="options.noImplicitThis"></TriStateCheckbox>
         </template>
      </Card>
      <Card>
         <template #title>
            <span class="text-truncate"> No Strict Generic Checks </span>
         </template>
         <template #content>
            <p class="text-wrap text-muted">
               TypeScript will unify type parameters when comparing two generic functions.
            </p>
            <TriStateCheckbox v-model="options.noStrictGenericChecks"></TriStateCheckbox>
         </template>
      </Card>
      <Card>
         <template #title>
            <span class="text-truncate"> No Unused Locals </span>
         </template>
         <template #content>
            <p class="text-wrap text-muted">
               Report errors on unused local variables.
            </p>
            <TriStateCheckbox v-model="options.noUnusedLocals"></TriStateCheckbox>
         </template>
      </Card>
      <Card>
         <template #title>
            <span class="text-truncate"> No Unused Parameters </span>
         </template>
         <template #content>
            <p class="text-wrap text-muted">
               Report errors on unused parameters in functions.
            </p>
            <TriStateCheckbox v-model="options.noUnusedParameters"></TriStateCheckbox>
         </template>
      </Card>
      <Card>
         <template #title>
            <span class="text-truncate"> Resolve JSON Module </span>
         </template>
         <template #content>
            <p class="text-wrap text-muted">
               Allows importing modules with a <code>.json</code> extension, which is a common practice in node projects. This includes generating a type for the <code>import</code> based on the static JSON shape.
            </p>
            <TriStateCheckbox v-model="options.resolveJsonModule"></TriStateCheckbox>
         </template>
      </Card>
      <Card>
         <template #title>
            <span class="text-truncate"> Skip Lib Check </span>
         </template>
         <template #content>
            <p class="text-wrap text-muted">
               Skip type checking of declaration files.
            </p>
            <TriStateCheckbox v-model="options.skipLibCheck"></TriStateCheckbox>
         </template>
      </Card>
      <Card>
         <template #title>
            <span class="text-truncate"> Strict </span>
         </template>
         <template #content>
            <p class="text-wrap text-muted">
               This flag enables a wide range of type checking behavior that results in stronger guarantees of program correctness.
            </p>
            <TriStateCheckbox v-model="options.strict"></TriStateCheckbox>
         </template>
      </Card>
      <Card>
         <template #title>
            <span class="text-truncate"> Strict Bind Call Apply </span>
         </template>
         <template #content>
            <p class="text-wrap text-muted">
               When set, TypeScript will check that the built-in methods of functions call, bind, and apply are invoked with correct argument for the underlying function.
            </p>
            <TriStateCheckbox v-model="options.strictBindCallApply"></TriStateCheckbox>
         </template>
      </Card>
      <Card>
         <template #title>
            <span class="text-truncate"> Strict Function Types </span>
         </template>
         <template #content>
            <p class="text-wrap text-muted">
               When enabled, this flag causes functions parameters to be checked more correctly.
            </p>
            <TriStateCheckbox v-model="options.strictFunctionTypes"></TriStateCheckbox>
         </template>
      </Card>
      <Card>
         <template #title>
            <span class="text-truncate"> Strict Null Checks </span>
         </template>
         <template #content>
            <p class="text-wrap text-muted">
               When this options is turned off, <code>null</code> and <code>undefined</code> are effectively ignored by the language. This can lead to unexpected errors at runtime.

               When this option is turned on, <code>null</code> and <code>undefined</code> have their own distinct types and you'll get a type error if you try to use them where a concrete value is expected.
            </p>
            <TriStateCheckbox v-model="options.strictNullChecks"></TriStateCheckbox>
         </template>
      </Card>
      <Card>
         <template #title>
            <span class="text-truncate"> Strict Property Initialization </span>
         </template>
         <template #content>
            <p class="text-wrap text-muted">
               When this option is turned on, TypeScript will raise an error when a class property was declared but not set in the constructor.
            </p>
            <TriStateCheckbox v-model="options.strictPropertyInitialization"></TriStateCheckbox>
         </template>
      </Card>
      <Card>
         <template #title>
            <span class="text-truncate"> Target </span>
         </template>
         <template #content>
            <p class="text-wrap text-muted">
               This option changes which JS features are downleveled and which are left intact. <a href="https://www.typescriptlang.org/tsconfig#target" target="_blank">See</a>
            </p>
            <Dropdown
               v-model="options.target"
               :options="optionsTarget"
               option-label="label"
               option-value="value"
            ></Dropdown>
         </template>
      </Card>
      <Card>
         <template #title>
            <span class="text-truncate"> Use Define For Class Fields </span>
         </template>
         <template #content>
            <p class="text-wrap text-muted">
               This flag is used as part of migrating to the upcoming standard version of class fields.
            </p>
            <TriStateCheckbox v-model="options.useDefineForClassFields"></TriStateCheckbox>
         </template>
      </Card>
      <Card>
         <template #title>
            <span class="text-truncate"> Suppress Excess Property Errors </span>
         </template>
         <template #content>
            <p class="text-wrap text-muted">
               This disables reporting of excess property errors. <a href="https://www.typescriptlang.org/tsconfig#suppressExcessPropertyErrors" target="_blank">See</a>
            </p>
            <TriStateCheckbox v-model="options.suppressExcessPropertyErrors"></TriStateCheckbox>
         </template>
      </Card>
      <Card>
         <template #title>
            <span class="text-truncate"> Suppress Implicit Any Index Errors </span>
         </template>
         <template #content>
            <p class="text-wrap text-muted">
               Turning this on suppresses reporting the error about implicit anys when indexing into objects. <a href="https://www.typescriptlang.org/tsconfig#suppressImplicitAnyIndexErrors" target="_blank">See</a>
            </p>
            <TriStateCheckbox v-model="options.suppressImplicitAnyIndexErrors"></TriStateCheckbox>
         </template>
      </Card>
   </div>
</template>

<script lang="ts" setup>
import TriStateCheckbox from 'primevue/tristatecheckbox';
import InputSwitch from "primevue/inputswitch";
import Card from "primevue/card";
import { languages } from "monaco-editor";
import Dropdown from "primevue/dropdown";

const props = defineProps<{
   options: languages.typescript.CompilerOptions;
}>();

const optionsModule: Array<{
   label: keyof typeof languages.typescript.ModuleKind;
   value: languages.typescript.ModuleKind;
}> = [
   {
      label: "AMD",
      value: languages.typescript.ModuleKind.AMD,
   },
   {
      label: "CommonJS",
      value: languages.typescript.ModuleKind.CommonJS,
   },
   {
      label: "ES2015",
      value: languages.typescript.ModuleKind.ES2015,
   },
   {
      label: "ESNext",
      value: languages.typescript.ModuleKind.ESNext,
   },
   {
      label: "System",
      value: languages.typescript.ModuleKind.System,
   },
   {
      label: "UMD",
      value: languages.typescript.ModuleKind.UMD,
   },
   {
      label: "None",
      value: languages.typescript.ModuleKind.None,
   },
];

const optionsTarget: Array<{
   label: keyof typeof languages.typescript.ScriptTarget;
   value: languages.typescript.ScriptTarget;
}> = [
   {
      label: "ES2015",
      value: languages.typescript.ScriptTarget.ES2015,
   },
   {
      label: "ES2016",
      value: languages.typescript.ScriptTarget.ES2016,
   },
   {
      label: "ES2017",
      value: languages.typescript.ScriptTarget.ES2017,
   },
   {
      label: "ES2018",
      value: languages.typescript.ScriptTarget.ES2018,
   },
   {
      label: "ES2019",
      value: languages.typescript.ScriptTarget.ES2019,
   },
   {
      label: "ES2020",
      value: languages.typescript.ScriptTarget.ES2020,
   },
   {
      label: "ES3",
      value: languages.typescript.ScriptTarget.ES3,
   },
   {
      label: "ES5",
      value: languages.typescript.ScriptTarget.ES5,
   },
   {
      label: "ESNext",
      value: languages.typescript.ScriptTarget.ESNext,
   },
   {
      label: "JSON",
      value: languages.typescript.ScriptTarget.JSON,
   },
   {
      label: "Latest",
      value: languages.typescript.ScriptTarget.Latest,
   },
];

const optionsJSX: Array<{
   label: keyof typeof languages.typescript.JsxEmit;
   value: languages.typescript.JsxEmit;
}> = [
   {
      label: "Preserve",
      value: languages.typescript.JsxEmit.Preserve,
   },
   {
      label: "React",
      value: languages.typescript.JsxEmit.React,
   },
   {
      label: "ReactJSX",
      value: languages.typescript.JsxEmit.ReactJSX,
   },
   {
      label: "ReactJSXDev",
      value: languages.typescript.JsxEmit.ReactJSXDev,
   },
   {
      label: "ReactNative",
      value: languages.typescript.JsxEmit.ReactNative,
   },
   {
      label: "None",
      value: languages.typescript.JsxEmit.None,
   },
];
</script>

<style lang="scss" scoped></style>
