import Toypack from "toypack";
import { WorkerThread } from "@app/WorkerManager";
import NodePolyfillPlugin from "toypack/lib/NodePolyfillPlugin";
import DefinePlugin from "toypack/lib/DefinePlugin";
import type _BabelLoader from "toypack/lib/loaders/BabelLoader";
import BabelLoader from "toypack/lib/BabelLoader";
import { join } from "path-browserify";
import type defaultGeneralOptions from "@app/options/general";

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

const babelLoader: _BabelLoader = new BabelLoader();
bundler.loaders.push(babelLoader as any);
bundler.use(new NodePolyfillPlugin());
bundler.use(
   new DefinePlugin({
      __VUE_OPTIONS_API__: true,
      __VUE_PROD_DEVTOOLS__: false,
   })
);

const thread = new WorkerThread();

thread.listen("installPackage", async (data) => {
   try {
      await bundler.packageManager.install(data.name, data.version);
   } catch (error) {
      throw error;
   }

   return data;
});

thread.listen("addAsset", async (data) => {
   try {
      await bundler.addAsset(data.source, data.content);
   } catch (error) {
      throw error;
   }

   return data;
});

thread.listen("removeAsset", (data) => {
   try {
      bundler.assets.delete(data.source);
   } catch (error) {
      throw error;
   }

   return data;
});

thread.listen("clearAssets", (data) => {
   try {
      bundler.assets.clear();
   } catch (error) {
      throw error;
   }

   return data;
});

thread.listen("renameAsset", async (data) => {
   try {
      let asset = bundler.assets.get(data.source);
      if (asset) {
         await bundler.addAsset(data.newSource, asset.content);
         bundler.assets.delete(data.source);
      }
   } catch (error) {
      throw error;
   }

   return data;
});

thread.listen("bundle", async (data) => {
   try {
      let bundleResult = await bundler.bundle(
         undefined,
         data.isHardBundle ? "hard" : "soft"
      );

      console.log(bundler);

      return bundleResult;
   } catch (error) {
      throw error;
   }
});

thread.listen("addBulkAssets", async (data) => {
   try {
      for (let asset of JSON.parse(data.assets)) {
         await bundler.addAsset(asset.source, asset.content);
      }
   } catch (error) {
      throw error;
   }

   return data;
});

thread.listen("setOptions", (data) => {
   let options: typeof defaultGeneralOptions = data.options;

   if (options.infiniteLoopProtection) {
      addInfiniteLoopProtection({});
   } else {
      removeInfiniteLoopProtection({});
   }
});

function removeInfiniteLoopProtection(data) {
   try {
      if (babelLoader) {
         let plugins = babelLoader.options?.transformOptions
            ?.plugins;
         if (plugins) {
            for (let i = 0; i < plugins.length; i++) {
               const plugin = plugins[i];
               if (plugin == infiniteLoopPluginId) {
                  plugins.splice(i, 1);
                  break;
               }
            }
         }
      }
   } catch (error) {
      throw error;
   }

   return data;
}

thread.listen("removeInfiniteLoopProtection", removeInfiniteLoopProtection);

let infiniteLoopProtectionRegistered = false;
const infiniteLoopPluginId = "loopProtect";

async function addInfiniteLoopProtection(data) {
   try {
      if (!infiniteLoopProtectionRegistered) {
         let slowLoopTimeLimitMS = 200;
         let loopProtectPluginModule = await import(
            "@freecodecamp/loop-protect"
         );
         let loopProtectPlugin = loopProtectPluginModule.default(
            slowLoopTimeLimitMS,
            () => {
               console.warn(
                  "Loop Protection Warning: A slow loop has been terminated."
               );
            },
            10000
         );
         infiniteLoopProtectionRegistered = true;
         babelLoader.registerPlugin(
            infiniteLoopPluginId,
            loopProtectPlugin
         );
      }

      if (babelLoader) {
         let plugins = babelLoader.options?.transformOptions?.plugins;
         if (!plugins?.find((p) => p == infiniteLoopPluginId)) {
            plugins?.push(infiniteLoopPluginId);
         }
      }
   } catch (error) {
      throw error;
   }

   return data;
}

thread.listen("addInfiniteLoopProtection", addInfiniteLoopProtection);

const typesSourceURL = "https://esm.sh/";
const dtsCache = new Map();

bundler.hooks.installPackage(async (pkg) => {
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
   };

   postMessage(result);

   // Add to cache
   dtsCache.set(name, result);
});

bundler.hooks.failedLoader(async (descriptor) => {
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
