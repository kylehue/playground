import { extname, join, basename } from "path-browserify";

interface Invalidation {
   title: string;
   message: string;
   severity: "error" | "warn";
}

function createInvalidation(
   title: Invalidation["title"],
   message: Invalidation["message"],
   severity: Invalidation["severity"]
) {
   const invalidation: Invalidation = {
      title,
      message,
      severity,
   };

   return invalidation;
}

export default function validateFile(source: string) {
   source = join("/", source);

   let extension = extname(source);
   let name = basename(source);

   if (source.startsWith("/node_modules")) {
      return createInvalidation(
         "Invalid directory",
         "node_modules is a reserved directory name.",
         "warn"
      );
   }

   if (source.startsWith("/$dummy_file.txt")) {
      return createInvalidation(
         "Invalid file",
         "$dummy_file.txt is a reserved name.",
         "warn"
      );
   }

   if (/[\\:*?<>|"]/.test(source) || (name && /[/]/.test(name))) {
      return createInvalidation(
         "Invalid file",
         "A file or directory name can't contain any of the following characters: / \\ : * ? < > |",
         "warn"
      );
   }

   if (source == "/package.json") {
      return createInvalidation(
         "Invalid file",
         "package.json is a reserved file name.",
         "warn"
      );
   }

   /* if (!supportedExtensions.includes(extension)) {
      return createInvalidation(
         "Invalid file",
         `${extension} files are currently not supported.`,
         "warn"
      );
   } */

   return null;
}
