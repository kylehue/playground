import { WorkerClient } from "@app/WorkerManager";

export const worker = new WorkerClient(
   new Worker(new URL("@app/bundler/bundler.worker", import.meta.url))
);

export interface SimpleAsset {
   source: string;
   content: string;
}

export async function installPackage(name: string, version: string) {
   console.log("installPackage started");
   
   let result = await worker.send("installPackage", {
      name,
      version,
   });

   console.log("installPackage finished");
   
   return result;
}

export async function addAsset(source: string, content = "") {
   console.log("addAsset started");
   
   let result = await worker.send("addAsset", {
      source,
      content
   });

   console.log("addAsset finished");

   return result;
}

export async function removeAsset(source: string) {
   console.log("removeAsset started");
   
   let result = await worker.send("removeAsset", {
      source,
   });

   console.log("removeAsset finished");

   return result;
}

export async function clearAssets() {
   console.log("clearAssets started");
   
   let result = await worker.send("clearAssets", {});

   console.log("clearAssets finished");

   return result;
}

export async function renameAsset(source: string, newSource: string) {
   console.log("renameAsset started");
   
   let result = await worker.send("renameAsset", {
      source,
      newSource,
   });

   console.log("renameAsset finished");

   return result;
}

export async function bundle(isHardBundle = false) {
   console.log("bundle started");
   
   try {
      let result = await worker.send("bundle", {
         isHardBundle,
      });

      console.log("bundle finished");
      return result;
   } catch (error) {
      throw error;
   }
}

export async function addBulkAssets(assets: SimpleAsset[]) {
   console.log("addBulkAssets started");

   let result = await worker.send("addBulkAssets", {
      assets,
   });

   console.log("addBulkAssets finished");

   return result;
}