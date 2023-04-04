<template>
   <div class="d-flex flex-column gap-3 w-100 h-100">
      <Card>
         <template #title>
            <span class="text-truncate"> Auto Indent </span>
         </template>
         <template #content>
            <p class="text-wrap text-muted">
               Controls whether the editor should automatically adjust the
               indentation when users type, paste, move or indent lines.
            </p>
            <Dropdown
               v-model="options.autoIndent"
               :options="optionsAutoIndent"
            ></Dropdown>
         </template>
      </Card>
      <Card>
         <template #title>
            <span class="text-truncate"> Auto Close Brackets </span>
         </template>
         <template #content>
            <p class="text-wrap text-muted">
               Controls whether the editor should automatically close brackets
               after the user adds an opening bracket.
            </p>
            <Dropdown
               v-model="options.autoClosingBrackets"
               :options="optionsAutoClosingBrackets"
            ></Dropdown>
         </template>
      </Card>
      <Card>
         <template #title>
            <span class="text-truncate"> Auto Close Delete </span>
         </template>
         <template #content>
            <p class="text-wrap text-muted">
               Options for pressing backspace near quotes or bracket pairs.
            </p>
            <Dropdown
               v-model="options.autoClosingDelete"
               :options="optionsAutoClosingDelete"
            ></Dropdown>
         </template>
      </Card>
      <Card>
         <template #title>
            <span class="text-truncate"> Auto Close Quotes </span>
         </template>
         <template #content>
            <p class="text-wrap text-muted">
               Controls whether the editor should automatically close quotes
               after the user adds an opening quote.
            </p>
            <Dropdown
               v-model="options.autoClosingQuotes"
               :options="optionsAutoClosingQuotes"
            ></Dropdown>
         </template>
      </Card>
      <Card>
         <template #title>
            <span class="text-truncate"> Auto Surround </span>
         </template>
         <template #content>
            <p class="text-wrap text-muted">
               Controls whether the editor should automatically surround
               selections when typing quotes or brackets.
            </p>
            <Dropdown
               v-model="options.autoSurround"
               :options="optionsAutoSurround"
            ></Dropdown>
         </template>
      </Card>
      <Card>
         <template #title>
            <span class="text-truncate"> Code Lens </span>
         </template>
         <template #content>
            <p class="text-wrap text-muted">
               Controls whether the editor shows CodeLens.
            </p>
            <InputSwitch v-model="options.codeLens" />
         </template>
      </Card>
      <Card>
         <template #title>
            <span class="text-truncate"> Format On Paste </span>
         </template>
         <template #content>
            <p class="text-wrap text-muted">Enable format on paste.</p>
            <InputSwitch v-model="options.formatOnPaste" />
         </template>
      </Card>
      <Card>
         <template #title>
            <span class="text-truncate"> Format On Type </span>
         </template>
         <template #content>
            <p class="text-wrap text-muted">Enable format on type.</p>
            <InputSwitch v-model="options.formatOnType" />
         </template>
      </Card>
      <Card>
         <template #title>
            <span class="text-truncate"> Insert Spaces </span>
         </template>
         <template #content>
            <p class="text-wrap text-muted">
               Insert spaces when pressing <kbd>Tab</kbd>.
            </p>
            <InputSwitch v-model="options.insertSpaces" />
         </template>
      </Card>
      <Card>
         <template #title>
            <span class="text-truncate"> Line Numbers </span>
         </template>
         <template #content>
            <p class="text-wrap text-muted">
               Control the rendering of line numbers. If it is a function, it
               will be invoked when rendering a line number and the return value
               will be rendered. Otherwise, if it is a truthy, line numbers will
               be rendered normally (equivalent of using an identity function).
               Otherwise, line numbers will not be rendered.
            </p>
            <Dropdown
               v-model="options.lineNumbers"
               :options="optionsLineNumbers"
            ></Dropdown>
         </template>
      </Card>
      <Card>
         <template #title>
            <span class="text-truncate"> Match Brackets </span>
         </template>
         <template #content>
            <p class="text-wrap text-muted">
               Enable highlighting of matching brackets.
            </p>
            <Dropdown
               v-model="options.matchBrackets"
               :options="optionsMatchBrackets"
            ></Dropdown>
         </template>
      </Card>
      <Card>
         <template #title>
            <span class="text-truncate"> Scroll Sensitivity </span>
         </template>
         <template #content>
            <p class="text-wrap text-muted">
               A multiplier to be used on the <code>deltaX</code> and
               <code>deltaY</code> of mouse wheel scroll events.
            </p>
            <Slider
               v-model="options.mouseWheelScrollSensitivity"
               :min="0.1"
               :max="2"
               :step="0.01"
            ></Slider>
         </template>
      </Card>
      <Card>
         <template #title>
            <span class="text-truncate"> Mouse Wheel Zoom </span>
         </template>
         <template #content>
            <p class="text-wrap text-muted">
               Zoom the font in the editor when using the mouse wheel in
               combination with holding <kbd>Ctrl</kbd>.
            </p>
            <InputSwitch v-model="options.mouseWheelZoom" />
         </template>
      </Card>
      <Card>
         <template #title>
            <span class="text-truncate"> Scroll Beyond Last Line </span>
         </template>
         <template #content>
            <p class="text-wrap text-muted">
               Enable that scrolling can go one screen size after the last line.
            </p>
            <InputSwitch v-model="options.scrollBeyondLastLine" />
         </template>
      </Card>
      <Card>
         <template #title>
            <span class="text-truncate"> Render Whitespace </span>
         </template>
         <template #content>
            <p class="text-wrap text-muted">Enable rendering of whitespace.</p>
            <Dropdown
               v-model="options.renderWhitespace"
               :options="optionsRenderWhitespace"
            ></Dropdown>
         </template>
      </Card>
      <Card>
         <template #title>
            <span class="text-truncate"> Show Deprecated </span>
         </template>
         <template #content>
            <p class="text-wrap text-muted">
               Controls strikethrough deprecated variables.
            </p>
            <InputSwitch v-model="options.showDeprecated" />
         </template>
      </Card>
      <Card>
         <template #title>
            <span class="text-truncate"> Smooth Scrolling </span>
         </template>
         <template #content>
            <p class="text-wrap text-muted">
               Enable that the editor animates scrolling to a position.
            </p>
            <InputSwitch v-model="options.smoothScrolling" />
         </template>
      </Card>
      <Card>
         <template #title>
            <span class="text-truncate"> Tab Completion </span>
         </template>
         <template #content>
            <p class="text-wrap text-muted">Enable tab completion.</p>
            <Dropdown
               v-model="options.tabCompletion"
               :options="optionsTabCompletion"
            ></Dropdown>
         </template>
      </Card>
      <Card>
         <template #title>
            <span class="text-truncate"> Tab Size </span>
         </template>
         <template #content>
            <p class="text-wrap text-muted">
               The number of spaces a tab is equal to.
            </p>
            <InputNumber
               v-model="options.tabSize"
               :allowEmpty="false"
               :min="0"
               :step="1"
               showButtons
               :useGrouping="false"
            ></InputNumber>
         </template>
      </Card>
      <Card>
         <template #title>
            <span class="text-truncate"> Word Wrap </span>
         </template>
         <template #content>
            <p class="text-wrap text-muted">
               Control the wrapping of the editor. When set to <code>off</code>,
               the lines will never wrap. When set to <code>on</code>, the lines
               will wrap at the viewport width. When set to
               <code>bounded</code>, the lines will wrap at min(viewport_width,
               wordWrapColumn).
            </p>
            <Dropdown
               v-model="options.wordWrap"
               :options="optionsWordWrap"
            ></Dropdown>
         </template>
      </Card>
      <Card>
         <template #title>
            <span class="text-truncate"> Wrapping Indent </span>
         </template>
         <template #content>
            <p class="text-wrap text-muted">
               Control indentation of wrapped lines.
            </p>
            <Dropdown
               v-model="options.wrappingIndent"
               :options="optionsWrappingIndent"
            ></Dropdown>
         </template>
      </Card>
   </div>
</template>

<script lang="ts" setup>
import InputSwitch from "primevue/inputswitch";
import InputNumber from "primevue/inputnumber";
import Card from "primevue/card";
import Slider from "primevue/slider";
import Dropdown from "primevue/dropdown";
import type defaultEditorOptions from "@app/options/editor";
import { editor } from "monaco-editor";

const props = defineProps<{
   options: typeof defaultEditorOptions;
}>();

const optionsAutoIndent: Array<typeof props.options.autoIndent> = [
   "advanced",
   "brackets",
   "full",
   "keep",
   "none",
];

const optionsAutoClosingBrackets: Array<editor.EditorAutoClosingStrategy> = [
   "always",
   "beforeWhitespace",
   "languageDefined",
   "never",
];

const optionsAutoClosingDelete: Array<editor.EditorAutoClosingEditStrategy> = [
   "always",
   "auto",
   "never",
];

const optionsAutoClosingQuotes: Array<editor.EditorAutoClosingStrategy> = [
   "always",
   "beforeWhitespace",
   "languageDefined",
   "never",
];

const optionsAutoSurround: Array<editor.EditorAutoSurroundStrategy> = [
   "quotes",
   "brackets",
   "languageDefined",
   "never",
];

const optionsLineNumbers: Array<editor.LineNumbersType> = [
   "interval",
   "relative",
   "on",
   "off",
];

const optionsMatchBrackets: Array<typeof props.options.matchBrackets> = [
   "always",
   "near",
   "never",
];

const optionsRenderWhitespace: Array<typeof props.options.renderWhitespace> = [
   "all",
   "boundary",
   "selection",
   "trailing",
   "none",
];

const optionsTabCompletion: Array<typeof props.options.tabCompletion> = [
   "on",
   "onlySnippets",
   "off",
];

const optionsWordWrap: Array<typeof props.options.wordWrap> = [
   "on",
   "bounded",
   "off",
];

const optionsWrappingIndent: Array<typeof props.options.wrappingIndent> = [
   "deepIndent",
   "indent",
   "same",
   "none",
];
</script>

<style lang="scss" scoped></style>
