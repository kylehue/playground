import { extname } from "path-browserify";

export default function isFile(path: string) {
   let extension = extname(path);
   let isValid = /^.[a-zA-Z]+$/g.test(extension);
   return !!extension && isValid;
}
