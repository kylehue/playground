import { createApp } from "vue";
import "./styles/main.scss";
import PrimeVue from "primevue/config";
import Tooltip from "primevue/tooltip";
import router from "./router";
import Main from "./Main.vue";

// Create app
const app = createApp(Main);

// Plugins
app.use(PrimeVue);
app.use(router);

// Directives
app.directive("tooltip", Tooltip);
app.directive("focus", {
   mounted(el) {
      let input = el.querySelector("input");

      if (input) {
         input.focus();
      } else {
         el.focus();
      }
   },
});
app.directive("fill-content", {
   mounted(el: HTMLElement) {
      let navbar: HTMLElement | null = document.querySelector(".navbar-wrapper");

      if (navbar) {
         let navbarHeight = navbar.offsetHeight;

         el.style.height = `calc(100vh - ${navbarHeight}px)`;
      }
   }
});

// Mount
app.mount("#root");

