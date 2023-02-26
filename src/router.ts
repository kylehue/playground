import { createRouter, createWebHistory } from "vue-router";
import App from "./App.vue";

const router = createRouter({
   history: createWebHistory(),
   routes: [
      {
         path: "/",
         redirect: "/app",
      },
      {
         name: "App",
         path: "/app",
         component: App,
      },
   ],
});

export default router;
