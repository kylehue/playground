import Toypack from "toypack";
import BabelLoader from "toypack/lib/loaders/BabelLoader";
import NodePolyfillPlugin from "toypack/lib/NodePolyfillPlugin";
import DefinePlugin from "toypack/lib/DefinePlugin";
import { join } from "path-browserify";
const bundler = new Toypack({
   bundleOptions: {
      mode: "development",
      entry: "/",
      output: {
         path: "lib",
         resourceType: "external",
         sourceMap: "inline-cheap-sources",
      },
      logs: true,
   },
});

globalThis.bundler = bundler;

bundler.use(new NodePolyfillPlugin());
bundler.use(
   new DefinePlugin({
      __VUE_OPTIONS_API__: true,
      __VUE_PROD_DEVTOOLS__: false
   })
);

const typesSourceURL = "https://esm.sh/";
function getSimplifiedAssets() {
   let assets = Object.fromEntries(bundler.assets);
   return Object.values(assets).map((el) => ({
      source: el.source,
      content: el.content,
   }));
}

const queue: any[] = [];
async function process() {
   let data = queue[0];

   if (data.cmd) {
      queue.shift();
      let hasOthersWaiting = queue.find((q) => q.cmd == data.cmd && q !== data);
      if (!hasOthersWaiting) {
         const result = await bundler[data.cmd](...data.args);

         postMessage({
            ...data,
            result: data.cmd == "bundle" ? result : {},
         });
      }
   } else if (data.customCmd) {
      if (data.customCmd == "removeAsset") {
         queue.shift();
         bundler.assets.delete(data.path);

         postMessage({
            ...data,
            assets: getSimplifiedAssets(),
         });
      }

      if (data.customCmd == "clear") {
         queue.shift();
         
         bundler.assets.clear();
      }

      if (data.customCmd == "renameAsset") {
         queue.shift();

         let asset = bundler.assets.get(data.from);
         if (asset) {
            await bundler.addAsset(data.to, asset.content);
            bundler.assets.delete(asset.source);
         }

         postMessage({
            ...data,
            assets: getSimplifiedAssets(),
         });
      }

      if (data.customCmd == "installPackage") {
         // Install
         await bundler.packageManager.install(data.name, data.version);

         // Send
         postMessage({
            ...data,
            assets: getSimplifiedAssets(),
         });

         // After installing, it's time we remove it from queue
         queue.shift();
      }
   }

   // If queue isn't empty, keep processing
   if (queue.length > 0) {
      await process();
   }
}

const dtsCache = new Map();
bundler.hooks.installPackage(async (pkg) => {
   postMessage({
      loadStart: true,
   });

   let pkgVersion = pkg.version ? "@" + pkg.version : "";
   let pkgSource = pkg.name + pkgVersion + pkg.subpath;
   let name = pkg.name + pkg.subpath;

   // Check cache
   let cached = dtsCache.get(name);
   if (cached) {
      // No need to post since it's already added in monaco editor ts libs
      // postMessage(cached);
      return;
   }

   // Get types/dts
   let response = await fetch(typesSourceURL + pkgSource);
   let typesURL = response.headers.get("x-typescript-types");
   let dts = "";

   // Get name in fallbacks (this is needed when plugin auto-installs happens)
   let fallbacks = bundler.options.bundleOptions?.resolve?.fallback;
   if (typeof fallbacks == "object") {
      for (let [key, value] of Object.entries(fallbacks)) {
         if (value == pkg.name + pkg.subpath) {
            name = key;

            break;
         }
      }
   }

   if (typesURL) {
      let graph = await bundler.packageManager._createGraph(
         pkgSource,
         typesURL
      );

      // Produce dts
      for (let i = 0; i < graph.length; i++) {
         let asset = graph[i];
         let source = join(name + pkgVersion, asset.source);

         // First asset is the entry, so we're gonna set its module source to installed module name
         if (i == 0) {
            source = name;
         }

         dts += `
declare module "${source}" {
   ${asset.content}
}
`;
      }
   }

   // If dts fetching failed, just create a mock dts to remove errors
   if (!response.ok || !dts) {
      dts = `declare module "${name}";`;
   }

   let result = {
      name,
      dts,
      loadEnd: true,
   };

   postMessage(result);

   // Add to cache
   dtsCache.set(name, result);
});

onmessage = async (event) => {
   const data = event.data;
   queue.push(data);
   if (queue.length == 1) {
      postMessage({
         loadStart: true
      });
      await process();
      postMessage({
         loadEnd: true,
      });
   }
   console.log(bundler);
};
bundler.hooks.failedLoader(async (descriptor) => {
   let BabelPattern = /\.(t|j)sx?$/; // .js, .ts, .jsx, .tsx
   if (BabelPattern.test(descriptor.asset.source)) {
      let BabelLoader = await import("toypack/lib/BabelLoader.js");
      let loopProtectPlugin = await import("@freecodecamp/loop-protect");
      let slowLoopTimeLimitMS = 200;

      let loader: BabelLoader = new BabelLoader.default({
         registerPlugins: [
            ["loopProtect", loopProtectPlugin.default(slowLoopTimeLimitMS, () => {
               console.warn("Loop Protection Warning: A slow loop has been terminated.");
            }, 10000)],
         ]
      });

      // Why is this breaking vue?
      let plugins = loader.options?.transformOptions?.plugins;

      if (plugins) {
         plugins.push("loopProtect");
      }

      bundler.loaders.push(loader as any);
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
