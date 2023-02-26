import { createApp } from "vue";
import App from "./App.vue";
import "./styles/main.scss";
import PrimeVue from "primevue/config";
import Tooltip from "primevue/tooltip";
import router from "./router";
const app = createApp(App);
app.directive("tooltip", Tooltip);
app.use(PrimeVue);
app.use(router);
app.directive("focus", {
   mounted(el) {
      let input = el.querySelector("input");

      if (input) {
         input.focus();
      } else {
         el.focus();
      }
   }
});

app.mount("#root");

