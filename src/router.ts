import { createRouter, createWebHashHistory } from "vue-router";
import { defineAsyncComponent } from "vue";
import Splash from "./Splash.vue";
import { loadOnigasm, setupMonacoEnv } from "@app/utils/monacoSetup";

const App = defineAsyncComponent({
   loader: async () => {
      await setupMonacoEnv();
      await loadOnigasm();
      return await import("./App.vue");
   },
   delay: 0,
   loadingComponent: Splash,
});

const router = createRouter({
   history: createWebHashHistory(),
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
