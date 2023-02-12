import { extname } from "path-browserify";

const languages = {
   txt: "text/html",
   html: "text/html",
   css: "css",
   sass: "scss",
   scss: "scss",
   js: "typescript",
   jsx: "typescript",
   ts: "typescript",
   tsx: "typescript",
   json: "json",
   vue: "text/html",
};

export default function getLang(str: string) {
   let ext = extname(str);

   return languages[ext.substring(1)];
}