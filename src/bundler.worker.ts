import Toypack from "toypack";
import { join } from "path-browserify";
const bundler = new Toypack({
   bundleOptions: {},
});

const typesSourceURL = "https://esm.sh/";
function getSimplifiedAssets() {
   let assets = Object.fromEntries(bundler.assets);
   return Object.values(assets).map((el) => ({
      source: el.source,
      content: el.content,
   }));
}

// Bundling = not priority
// Installing = priority
const queue: any[] = [];

async function process() {
   /* if (queue.length > 0) {
      const data = queue[0];
      if (data.cmd) {
         let hasOthersWaiting = queue.find((e) => e.cmd == data.cmd && e !== data);
         if (!hasOthersWaiting) {
            const result = await bundler[data.cmd](...data.args);

            postMessage({
               ...data,
               result: data.cmd == "bundle" ? result : {},
            });
         }

         queue.shift();
      } else if (data.customCmd) {
         if (data.customCmd == "removeAsset") {
            bundler.assets.delete(data.path);

            postMessage({
               ...data,
               assets: getSimplifiedAssets(),
            });
         }

         if (data.customCmd == "installPackage") {
            let version = data.version ? "@" + data.version : "";

            // Install
            await bundler.packageManager.install(data.name + version);

            postMessage({
               ...data,
               assets: getSimplifiedAssets(),
            });

            // Get types
            let response = await fetch(typesSourceURL + data.name + version);
            let typesURL = response.headers.get("x-typescript-types");
            if (typesURL) {
               let graph = await bundler.packageManager._createGraph(
                  data.name,
                  typesURL
               );

               // Make single .d.ts file
               let dts = "";
               for (let asset of graph) {
                  let source = join(data.name, asset.source);
                  dts = `declare module "${source}" { ${asset.content} }` + dts;
               }

               let entrySource = join(data.name, graph[0].source);
               dts += `declare module "${data.name}" { export * from "${entrySource}"; export { default } from "${entrySource}" }`;

               postMessage({
                  name: data.name,
                  version: data.version,
                  dts,
               });
            }

            queue.shift();
         }
      }

      await process();
   } */

   
}

function createMethodFromData(data: any) {
   if (data.customCmd == "installPackage") {
      return {
         priority: true,
         init: async () => {
            let version = data.version ? "@" + data.version : "";

            // Install
            await bundler.packageManager.install(data.name + version);

            postMessage({
               ...data,
               assets: getSimplifiedAssets(),
            });

            // Get types
            let response = await fetch(typesSourceURL + data.name + version);
            let typesURL = response.headers.get("x-typescript-types");
            if (typesURL) {
               let graph = await bundler.packageManager._createGraph(
                  data.name,
                  typesURL
               );

               // Make single .d.ts file
               let dts = "";
               for (let asset of graph) {
                  let source = join(data.name, asset.source);
                  dts = `declare module "${source}" { ${asset.content} }` + dts;
               }

               let entrySource = join(data.name, graph[0].source);
               dts += `declare module "${data.name}" { export * from "${entrySource}"; export { default } from "${entrySource}" }`;

               postMessage({
                  name: data.name,
                  version: data.version,
                  dts,
               });
            }
         },
      };
   }
}

onmessage = async (event) => {
   const data = event.data;

   queue.push(createMethodFromData(data));

   await process();

   console.log(bundler);
};

bundler.hooks.failedLoader(async (descriptor) => {
   let BabelPattern = /\.(t|j)sx?$/; // .js, .ts, .jsx, .tsx
   if (BabelPattern.test(descriptor.asset.source)) {
      let BabelLoader = await import("toypack/lib/BabelLoader.js");
      let loopProtectPlugin = await import("@freecodecamp/loop-protect");
      let slowLoopTimeLimitMS = 100;

      let loader = new BabelLoader.default({
         registerPlugins: [
            ["loopProtect", loopProtectPlugin.default(slowLoopTimeLimitMS)],
         ],
         transformOptions: {
            plugins: ["loopProtect"],
         },
      });

      bundler.loaders.push(loader);
   }

   let VuePattern = /\.vue$/; // .vue
   if (VuePattern.test(descriptor.asset.source)) {
      let VueLoader = await import("toypack/lib/VueLoader.js");
      bundler.loaders.push(new VueLoader.default());
   }

   let SassPattern = /\.s(a|c)ss$/; // .sass, .scss
   if (SassPattern.test(descriptor.asset.source)) {
      let SassLoader = await import("toypack/lib/SassLoader.js");
      bundler.loaders.push(new SassLoader.default());
   }
});
