import { editor } from "monaco-editor";

const options: editor.IStandaloneEditorConstructionOptions = {
   autoIndent: "advanced",
   autoClosingBrackets: "languageDefined",
   autoClosingDelete: "auto",
   autoClosingQuotes: "languageDefined",
   autoSurround: "languageDefined",   
   codeLens: true,
   detectIndentation: false,
   formatOnPaste: false,
   formatOnType: false,
   insertSpaces: true,
   lineNumbers: "on",
   matchBrackets: "always",
   mouseWheelScrollSensitivity: 1,
   mouseWheelZoom: true,
   scrollBeyondLastLine: true,
   renderWhitespace: "selection",
   showDeprecated: true,
   smoothScrolling: false,
   tabCompletion: "on",
   tabSize: 4,
   wordWrap: "on",
   wrappingIndent: "indent",
};

export default options;