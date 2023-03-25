import { editor } from "monaco-editor";

const options: editor.IStandaloneEditorConstructionOptions = {
lineNumbers: "on",
   roundedSelection: true,
   scrollBeyondLastLine: true,
   readOnly: false,
   theme: "theme-dark",
   wordWrap: "on",
   wrappingIndent: "indent",
   insertSpaces: true,
   tabSize: 3,
   useShadowDOM: true,
   automaticLayout: true,
   contextmenu: true,
   scrollbar: {
      vertical: "auto",
      horizontal: "auto",
   },
   mouseWheelZoom: true,
   autoClosingBrackets: "always",
}

export default options;