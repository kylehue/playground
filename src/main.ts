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
      setTimeout(() => {
         if (input) {
            input.focus();
         } else {
            el.focus();
         }
      }, 10);
   },
});

let fillRemainingHeightElements: HTMLElement[] = [];
app.directive("fill-remaining-height", {
   mounted(el: HTMLElement) {
      if (fillRemainingHeightElements.includes(el)) return;
      var fillRemainingHeight = () => {
         let remainingHeight = el.parentElement?.offsetHeight || 0;

         let siblings = Array.from(el.parentElement?.children || []);

         for (let sibling of siblings) {
            if (sibling === el) continue;
            remainingHeight -= (sibling as HTMLElement).offsetHeight;
         }

         el.style.height = remainingHeight + "px";
      };

      fillRemainingHeight();
      addEventListener("resize", fillRemainingHeight);
      fillRemainingHeightElements.push(el);
   },
});

let fillRemainingWidthElements: HTMLElement[] = [];
app.directive("fill-remaining-width", {
   mounted(el: HTMLElement) {
      if (fillRemainingWidthElements.includes(el)) return;
      var fillRemainingWidth = () => {
         let remainingWidth = el.parentElement?.offsetWidth || 0;

         let siblings = Array.from(el.parentElement?.children || []);

         for (let sibling of siblings) {
            if (sibling === el) continue;
            remainingWidth -= (sibling as HTMLElement).offsetWidth;
         }

         el.style.width = remainingWidth + "px";
      };

      fillRemainingWidth();
      addEventListener("resize", fillRemainingWidth);
      fillRemainingWidthElements.push(el);
   },
});

app.config.globalProperties.$log = console.log;

// Mount
app.mount("#root");
