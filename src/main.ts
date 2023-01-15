import { createApp } from "vue";
import App from "./App.vue";
import "./styles/main.scss";
const app = createApp(App);

app.directive("focus", {
   mounted(el) {
      el.focus();
   }
});

app.mount("#root");

