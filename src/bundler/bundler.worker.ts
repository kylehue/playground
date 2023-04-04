import Toypack from "toypack";
import { WorkerThread } from "@app/WorkerManager";
import NodePolyfillPlugin from "toypack/lib/NodePolyfillPlugin";
import DefinePlugin from "toypack/lib/DefinePlugin";
import type IBabelLoader from "toypack/lib/loaders/BabelLoader";
import BabelLoader from "toypack/lib/BabelLoader";
import { join } from "path-browserify";
import type defaultBundlerOptions from "@app/options/bundler";
import type defaultBabelOptions from "@app/options/babel";
import { SimpleAsset } from ".";

const bundler = new Toypack({
   bundleOptions: {
      mode: "development",
      entry: "/",
      output: {
         path: "dist",
         resourceType: "external",
         sourceMap: "inline-cheap-sources",
         filename: "bundle.js",
         assetFilename: "assets/[base]",
      },
      resolve: {
         alias: {},
         fallback: {},
         extensions: [],
      },
      logs: true,
   },
});

const babelLoader: IBabelLoader = new BabelLoader();

const definePlugin = new DefinePlugin({});
bundler.loaders.push(babelLoader as any);
bundler.use(new NodePolyfillPlugin());
bundler.use(definePlugin);

const infiniteLoopPluginId = "loop-protect";

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

thread.listen("getAssets", () => {
   let entries = Object.fromEntries(bundler.assets);
   let simplifiedAssets: SimpleAsset[] = [];
   for (let asset of Object.values(entries)) {
      if (asset.source.startsWith("/node_modules/")) continue;

      simplifiedAssets.push({
         source: asset.source,
         content: asset.content
      });
   }

   return simplifiedAssets;
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
         data.options,
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

thread.listen("updateOptions", (data) => {
   let options: typeof defaultBundlerOptions = data.options;
   let bundleOptions = bundler.options.bundleOptions!;

   if (typeof options.entry == "string") {
      bundleOptions.entry = options.entry;
   }

   if (options.envMode == "development" || options.envMode == "production") {
      bundleOptions.mode = options.envMode;
   }

   if (typeof options.infiniteLoopProtection == "boolean") {
      if (options.infiniteLoopProtection) {
         addInfiniteLoopProtection();
      } else {
         removeInfiniteLoopProtection();
      }
   }

   if (typeof options.replace == "object") {
      definePlugin.options = options.replace;
   }

   bundleOptions.resolve ??= {};

   if (typeof options.resolve?.alias == "object") {
      bundleOptions.resolve.alias = options.resolve.alias;
   }

   if (typeof options.resolve?.fallback == "object") {
      let fallback = {};
      for (let fb of Object.entries(options.resolve.fallback)) {
         fallback[fb[0]] = !!fb[1] ? fb[1] : false;
      }

      bundleOptions.resolve.fallback = fallback;
   }

   if (typeof options.resolve?.extensions == "object") {
      let extensions: string[] = [];
      for (let ext of options.resolve.extensions) {
         extensions.push("." + ext);
      }

      bundleOptions.resolve.extensions = extensions;
   }

   if (typeof options.sourceMap == "string") {
      if (options.sourceMap == "cheap") {
         bundler.defineOptions({
            bundleOptions: {
               output: {
                  sourceMap: "inline-cheap-sources",
               },
            },
         });
      } else if (options.sourceMap == "full") {
         bundler.defineOptions({
            bundleOptions: {
               output: {
                  sourceMap: "inline-hires-sources",
               },
            },
         });
      } else {
         bundler.defineOptions({
            bundleOptions: {
               output: {
                  sourceMap: false,
               },
            },
         });
      }
   }
});

thread.listen("updateBabelOptions", (data) => {
   let options: typeof defaultBabelOptions = data.options;
   const transformOptions = babelLoader.options?.transformOptions!;
   const parseOptions = babelLoader.options?.parseOptions!;

   if (options.transformPlugins?.length) {
      // Preserve defaults
      let defaultTransformPlugins: any[] = [];
      if (defaultTransformPlugins.find((p) => p == infiniteLoopPluginId)) {
         defaultTransformPlugins.push(infiniteLoopPluginId);
      }

      if (!options.transformPlugins.find((p) => p == "add-module-exports")) {
         defaultTransformPlugins.push("add-module-exports");
      }

      transformOptions.plugins = defaultTransformPlugins.concat(
         options.transformPlugins
      );
   }

   if (options.transformPresets?.length) {
      transformOptions.presets = options.transformPresets;
   }

   if (options.parsePlugins?.length) {
      parseOptions.plugins = options.parsePlugins as any;
   }
});

function removeInfiniteLoopProtection() {
   try {
      if (babelLoader) {
         let plugins = babelLoader.options?.transformOptions?.plugins;
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
}

let infiniteLoopProtectionRegistered = false;
async function addInfiniteLoopProtection() {
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
         BabelLoader.registerPlugin(infiniteLoopPluginId, loopProtectPlugin);
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
}

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
