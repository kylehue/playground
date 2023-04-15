import { WorkerClient } from "@app/WorkerManager";
import defaultBabelOptions from "@app/options/babel";
import type { BundleOptions } from "toypack/lib/core/types";

export const worker = new WorkerClient(
   new Worker(new URL("@app/bundler/bundler.worker", import.meta.url))
);

export interface SimpleAsset {
   source: string;
   content: string;
}

export async function installPackage(name: string, version: string) {
   console.log("installPackage started");

   let result = await worker.send(
      "installPackage",
      {
         name,
         version,
      },
      true
   );

   console.log("installPackage finished");

   return result;
}

export async function addAsset(source: string, content: SimpleAsset["content"] = "") {
   console.log("addAsset started");

   let result = await worker.send(
      "addAsset",
      {
         source,
         content,
      },
      true
   );

   console.log("addAsset finished");

   return result;
}

export async function getAssets() {
   console.log("getAssets started");

   let result: SimpleAsset[] = await worker.send("getAssets", {}, true);

   console.log("getAssets finished");

   return result;
}

export async function removeAsset(source: string) {
   console.log("removeAsset started");

   let result = await worker.send(
      "removeAsset",
      {
         source,
      },
      true
   );

   console.log("removeAsset finished");

   return result;
}

export async function clearAssets() {
   console.log("clearAssets started");

   let result = await worker.send("clearAssets", {}, true);

   console.log("clearAssets finished");

   return result;
}

export async function renameAsset(source: string, newSource: string) {
   console.log("renameAsset started");

   let result = await worker.send(
      "renameAsset",
      {
         source,
         newSource,
      },
      true
   );

   console.log("renameAsset finished");

   return result;
}

export async function bundle(isHardBundle = false, options?: BundleOptions) {
   console.log("bundle started");

   try {
      let result = await worker.send(
         "bundle",
         {
            isHardBundle,
            options,
         },
         true
      );

      console.log("bundle finished");
      return result;
   } catch (error) {
      throw error;
   }
}

export async function addBulkAssets(assets: SimpleAsset[]) {
   console.log("addBulkAssets started");

   let result = await worker.send(
      "addBulkAssets",
      {
         assets: JSON.stringify(assets),
      },
      true
   );

   console.log("addBulkAssets finished");

   return result;
}

export function updateOptions(options) {
   console.log("updateOptions started");

   let result = worker.send(
      "updateOptions",
      {
         options,
      },
      true
   );

   console.log("updateOptions finished");

   return result;
}

export function updateBabelOptions(options: typeof defaultBabelOptions) {
   console.log("updateBabelOptions started");

   let result = worker.send(
      "updateBabelOptions",
      {
         options,
      },
      true
   );

   console.log("updateBabelOptions finished");

   return result;
}
