import { nanoid } from "nanoid";

export interface Template {
   id: string;
   name: string;
   lastEdited: number;
   files: {
      source: string;
      content: string;
   }[];
   packages: {
      name: string;
      version: string;
   }[];
}

const templates: Template[] = [
   {
      id: nanoid(),
      name: "default template",
      lastEdited: Date.now(),
      files: [
         {
            source: "index.html",
            content: `<html>
   <head>
      <script src="./src/main"></script>
   </head>
   <body>
      Hello World!
   </body>
</html>`,
         },
         {
            source: "src/main.js",
            content: `import "../styles/style.css";
console.log("Test 1");`,
         },
         {
            source: "styles/style.css",
            content: `body {
   margin: 0;
   padding: 0;
}`,
         },
      ],
      packages: [],
   },
   {
      id: nanoid(),
      name: "typescript template",
      lastEdited: Date.now(),
      files: [
         {
            source: "index.ts",
            content: `import "./styles/style.css";
console.log("Hello World!");`,
         },
         {
            source: "styles/style.css",
            content: `body {
   margin: 0;
   padding: 0;
}`,
         },
      ],
      packages: [],
   },
   {
      id: nanoid(),
      name: "react template",
      lastEdited: Date.now(),
      files: [
         {
            source: "index.html",
            content: `<html>
   <head>
      <script src="./src/main"></script>
   </head>
   <body>
      <div id="root"></div>
   </body>
</html>`,
         },
         {
            source: "src/main.jsx",
            content: `import ReactDOM from "react-dom/client";

import App from "./App.jsx";

ReactDOM.createRoot( 
   document.querySelector("#root")
).render(<App />);`,
         },
         {
            source: "src/App.jsx",
            content: `export default function App(props) {
  return (
   <div>
      <h1>Hello World!</h1>
   </div>
  );
}`,
         },
      ],
      packages: [
         {
            name: "react",
            version: "18.2.0",
         },
         {
            name: "react-dom",
            version: "18.2.0",
         },
      ],
   },
   {
      id: nanoid(),
      name: "vue template",
      lastEdited: Date.now(),
      files: [
         {
            source: "index.html",
            content: `<html>
   <head>
      <script src="./src/main"></script>
   </head>
   <body>
      <div id="app"></div>
   </body>
</html>`,
         },
         {
            source: "src/main.js",
            content: `import { createApp } from "vue";
import App from "./App.vue";

const app = createApp(App);
app.mount("#app");`,
         },
         {
            source: "src/App.vue",
            content: `<template>
   <h1>Hello World!</h1>
   <button @click="count++">Count is: {{ count }}</button>
</template>

<script setup>
import { ref } from "vue";

const count = ref(0);
</script>

<style scoped>
button {
  font-weight: bold;
}
</style>`,
         },
      ],
      packages: [
         {
            name: "vue",
            version: "3.2.45",
         },
      ],
   },
];
export default templates;
