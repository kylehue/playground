import { createApp } from "vue";
import "./styles/main.scss";
import PrimeVue from "primevue/config";
import ConfirmationService from "primevue/confirmationservice";
import ToastService from "primevue/toastservice";
import Tooltip from "primevue/tooltip";
import router from "./router";
import Main from "./Main.vue";

// Create app
const app = createApp(Main);

// Plugins
app.use(PrimeVue, {
   inputStyle: "filled",
});

app.use(ConfirmationService);
app.use(ToastService);
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

app.directive("fill-remaining-height", {
   mounted(el: HTMLElement) {
      let remainingHeight = el.parentElement?.offsetHeight || 0;

      let siblings = Array.from(el.parentElement?.children || []);

      for (let sibling of siblings) {
         if (sibling === el) continue;
         remainingHeight -= (sibling as HTMLElement).offsetHeight;
      }

      el.style.height = remainingHeight + "px";
   },
});

app.directive("fill-remaining-width", {
   mounted(el: HTMLElement) {
      let remainingWidth = el.parentElement?.offsetWidth || 0;

      let siblings = Array.from(el.parentElement?.children || []);

      for (let sibling of siblings) {
         if (sibling === el) continue;
         remainingWidth -= (sibling as HTMLElement).offsetWidth;
      }

      el.style.width = remainingWidth + "px";
   },
});

// Mount
app.mount("#root");
