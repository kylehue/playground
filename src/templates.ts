export interface Template {
   id: string;
   name?: string;
   lastEdited?: number;
   files?: {
      source: string;
      content: string;
   }[];
   packages?: {
      name: string;
      version: string;
   }[];
}

const templates: Template[] = [
   {
      id: "default",
      name: "default template",
      lastEdited: Date.now(),
      files: [
         {
            source: "index.html",
            content: `<html>
   <head>
      <script src="./src/main.js"></script>
   </head>
   <body>
      <h1>Default Template</h1>
      <button id="countButton">Count is: <span>0</span></button>
   </body>
</html>`,
         },
         {
            source: "src/main.js",
            content: `import "../styles/style.css";
let countButton = document.querySelector("#countButton");

countButton.addEventListener("click", () => {
   let span = countButton.querySelector("span");
   let currentCount = parseInt(span.textContent);
   
   span.textContent = (currentCount + 1).toString();;
});`,
         },
         {
            source: "styles/style.css",
            content: `button {
   font-family: consolas;
   padding: 10px 20px;
   cursor: pointer;
}`,
         },
      ],
      packages: [],
   },
   {
      id: "typescript",
      name: "typescript template",
      lastEdited: Date.now(),
      files: [
         {
            source: "index.html",
            content: `<html>
   <head>
      <script src="./src/main.ts"></script>
   </head>
   <body>
      <h1>TypeScript Template</h1>
      <button id="countButton">Count is: <span>0</span></button>
   </body>
</html>`,
         },
         {
            source: "src/main.ts",
            content: `import "../styles/style.css";
let countButton = document.querySelector("#countButton");

countButton.addEventListener("click", () => {
   let span = countButton.querySelector("span");
   let currentCount = parseInt(span.textContent);
   
   span.textContent = (currentCount + 1).toString();;
});`,
         },
         {
            source: "styles/style.css",
            content: `button {
   font-family: consolas;
   padding: 10px 20px;
   cursor: pointer;
}`,
         },
      ],
      packages: [],
   },
   {
      id: "react",
      name: "react template",
      lastEdited: Date.now(),
      files: [
         {
            source: "index.html",
            content: `<html>
   <head>
      <script src="./src/main.jsx"></script>
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
            content: ` import { useState } from "react";

export default function App(props) {
   let [count, setCount] = useState(0);
   return (
      <div>
         <h1>React Template</h1>
         <button style={ style.button } onClick={ () => setCount(count + 1) }>Count is: { count }</button>
      </div>
   );
}

const style = {
   button: {
      fontFamily: "consolas",
      padding: "10px 20px",
      cursor: "pointer"
   }
};`,
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
      id: "vue",
      name: "vue template",
      lastEdited: Date.now(),
      files: [
         {
            source: "index.html",
            content: `<html>
   <head>
      <script src="./src/main.js"></script>
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
   <h1>Vue Template</h1>
   <button @click="count++">Count is: {{ count }}</button>
</template>

<script setup>
import { ref } from "vue";

const count = ref(0);
</script>

<style scoped>
button {
   font-family: consolas;
   padding: 10px 20px;
   cursor: pointer;
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
   {
      id: "matter-js",
      name: "matter-js template",
      lastEdited: Date.now(),
      files: [
         {
            source: "index.ts",
            content: `import "./styles/style.css";
import MatterWrap from "matter-wrap";
import Matter, { Engine, Render, Runner, Bodies, Composite, Composites, Mouse, MouseConstraint, Common } from "matter-js";

// infinite world plugin
Matter.use(MatterWrap);

// create an engine
let engine = Engine.create(),
   world = engine.world;

// create a renderer
let render = Render.create({
   element: document.body,
   engine: engine,
   options: {
      width: innerWidth,
      height: innerHeight,
      showAngleIndicator: true
   }
});

Render.run(render);

let runner = Runner.create();
Runner.run(runner, engine);

// add bodies
let stack = Composites.stack(20, 20, 20, 5, 0, 0, function (x, y) {
   return Bodies.circle(x, y, Common.random(10, 20), { friction: 0.00001, restitution: 0.5, density: 0.001 });
});

Composite.add(world, stack);

Composite.add(world, [
   Bodies.rectangle(200, 150, 700, 20, { isStatic: true, angle: Math.PI * 0.06, render: { fillStyle: '#060a19' } }),
   Bodies.rectangle(500, 350, 700, 20, { isStatic: true, angle: -Math.PI * 0.06, render: { fillStyle: '#060a19' } }),
   Bodies.rectangle(340, 580, 700, 20, { isStatic: true, angle: Math.PI * 0.04, render: { fillStyle: '#060a19' } })
]);

// add mouse control
let mouse = Mouse.create(render.canvas),
   mouseConstraint = MouseConstraint.create(engine, {
      mouse: mouse,
      constraint: {
         stiffness: 0.2,
         render: {
            visible: false
         }
      }
   });

Composite.add(world, mouseConstraint);

// keep the mouse in sync with rendering
render.mouse = mouse;

// fit the render viewport to the scene
Render.lookAt(render, Composite.allBodies(world));

// wrapping using matter-wrap plugin
for (let i = 0; i < stack.bodies.length; i += 1) {
   stack.bodies[i].plugin.wrap = {
      min: { x: render.bounds.min.x, y: render.bounds.min.y },
      max: { x: render.bounds.max.x, y: render.bounds.max.y }
   };
}`,
         },
         {
            source: "styles/style.css",
            content: `body {
   margin: 0;
   padding: 0;
   overflow: hidden;
}`,
         },
      ],
      packages: [
         {
            name: "matter-js",
            version: "0.19.0",
         },
         {
            name: "matter-wrap",
            version: "0.2.0",
         },
      ],
   },
];
export default templates;
