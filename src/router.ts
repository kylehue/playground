import { createRouter, createWebHistory } from "vue-router";
import { defineAsyncComponent } from "vue";
import Splash from "./Splash.vue";

const App = defineAsyncComponent({
   loader: () => import("./App.vue"),
   delay: 0,
   loadingComponent: Splash,
});

const router = createRouter({
   history: createWebHistory(),
   routes: [
      {
         path: "/",
         redirect: "/app"
      },
      {
         name: "App",
         path: "/app",
         component: App,
      },
   ],
});

export default router;
